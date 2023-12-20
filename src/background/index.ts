import { assert, isError, isntUndefined } from '@blackglory/prelude'
import { each, Deferred } from 'extra-promise'
import { applyPropertyDecorators } from 'extra-proxy'
import { getAllManageableExtensions } from '@utils/extension'
import { splitArrayInHalf } from '@utils/split-array-in-half'
import { i18n } from '@utils/i18n'
import { ImplementationOf } from 'delight-rpc'
import { createTabClient, createServer } from '@delight-rpc/webextension'
import { IBackgroundAPI, IDialogAPI, IExtension } from '@src/contract'
import { AbortController, withAbortSignal, AbortError } from 'extra-abort'
import { migrate } from './migrate'
import { initStorage, getExcludedExtensions, setExcludedExtensions } from './storage'
import { waitForLaunch, LaunchReason } from 'extra-webextension'

const launched = new Deferred<void>()

const api: ImplementationOf<IBackgroundAPI> = {
  searchExtension
, getExcludedExtensions
, setExcludedExtensions
}

// 确保尽早启动服务器, 以免拒绝来自客户端的连接, 造成功能失效.
createServer<IBackgroundAPI>(
  applyPropertyDecorators(
    api
  , Object.keys(api) as Array<keyof IBackgroundAPI>
  , (fn: (...args: unknown[]) => unknown) => {
      return async function (...args: unknown[]): Promise<unknown> {
        // 等待初始化/迁移执行完毕
        await launched

        return await fn(...args)
      }
    }
  ) as ImplementationOf<IBackgroundAPI>
)

waitForLaunch().then(async details => {
  switch (details.reason) {
    case LaunchReason.Install: {
      await initStorage()
      break
    }
    case LaunchReason.Update: {
      await migrate(details.previousVersion)
      break
    }
  }

  launched.resolve()
})

async function searchExtension(): Promise<null> {
  const controller = new AbortController()
  const signal = controller.signal

  const window = await chrome.windows.create({
    url: chrome.runtime.getURL('dialog.html')
  , type: 'popup'
  , width: 450
  , height: 250
  })
  const tabId = window.tabs?.[0].id
  assert(isntUndefined(tabId), 'The dialog tab does not exist')

  chrome.windows.onRemoved.addListener(function windowRemovedHandler(windowId) {
    if (windowId === window.id) {
      chrome.windows.onRemoved.removeListener(windowRemovedHandler)
      controller.abort('The interactive window is closed')
    }
  })

  await withAbortSignal(signal, () => new Promise<void>(resolve => {
    chrome.runtime.onMessage.addListener(function pingHandler(message, sender) {
      if (sender.tab?.id === tabId && message === 'ping') {
        chrome.runtime.onMessage.removeListener(pingHandler)
        resolve()
      }
    })
  }))
  const client = createTabClient<IDialogAPI>({ tabId })

  const excludedExtensions: IExtension[] = await getExcludedExtensions()
  const includedExtensions: chrome.management.ExtensionInfo[] = (
    await getAllManageableExtensions()
  )
    .filter(x => x.enabled)
    .filter(({ id }) => !excludedExtensions.find(x => x.id === id))

  try {
    await withAbortSignal(signal, async () => {
      if (includedExtensions.length === 0) {
        return await client.message({
          text: i18n('dialog_no_extensions')
        , buttonText: i18n('dialog_end')
        })
      }

      let restExtensions: IExtension[] = includedExtensions
        .map(x => ({ name: x.name, id: x.id }))

      while (restExtensions.length !== 1) {
        const [extensionGroupA, extensionGroupB] = splitArrayInHalf(restExtensions)

        await client.progress({ value: 0 })
        await each(extensionGroupA, async ({ id, name }, i) => {
          await disableExtension(id)
          await client.progress({
            text: `${i18n('dialog_being_disabled')} ${name}`
          , value: (i + 1) / extensionGroupA.length
          })
        }, 1)

        if (
          await client.confirm({
            text: i18n('dialog_confirm')
          , button1Text: i18n('dialog_still_running_button')
          , button2Text: i18n('dialog_not_running_button')
          })
        ) {
          restExtensions = extensionGroupB
        } else {
          restExtensions = extensionGroupA

          await client.progress({ value: 0 })
          await each(extensionGroupA, async ({ id, name }, i) => {
            await enableExtension(id)
            await client.progress({
              text: `${i18n('dialog_being_enabled')} ${name}`
            , value: (i + 1) / extensionGroupA.length
            })
          }, 1)
        }
      }

      const target = restExtensions[0]
      await client.message({
        title: i18n('dialog_result')
      , text: `${ includedExtensions.find(x => x.id === target.id)!.name }`
      , buttonText: i18n('dialog_end')
      })
    })
  } catch (e) {
    if (isError(e)) {
      const err = e

      if (!(e instanceof AbortError)) {
        await withAbortSignal(signal, () => client.message({
          title: i18n('dialog_unkown_error')
        , text: `${err.message}`
        , buttonText: i18n('dialog_end')
        }))
      } else {
        console.warn(e)
      }
    } else {
      console.warn(e)
    }
  } finally {
    await each(
      includedExtensions
    , ({ id, enabled }) => setExtensionState(id, enabled)
    , 1
    )
    // 由于标签页可能被用户手动关闭, 调用有可能抛出错误, 所以放到最后执行.
    await chrome.tabs.remove(tabId)
  }

  return null
}

async function setExtensionState(id: string, enabled: boolean): Promise<void> {
  await chrome.management.setEnabled(id, enabled)
}

async function enableExtension(id: string): Promise<void> {
  await setExtensionState(id, true)
}

async function disableExtension(id: string): Promise<void> {
  await setExtensionState(id, false)
}
