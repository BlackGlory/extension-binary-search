import browser from 'webextension-polyfill'
import { assert, isError, isntUndefined } from '@blackglory/prelude'
import { each } from 'extra-promise'
import { getAllManageableExtensions } from '@utils/extension'
import { splitArrayInHalf } from '@utils/split-array-in-half'
import { i18n } from '@utils/i18n'
import { createTabClient, createServer } from '@delight-rpc/webextension'
import { IBackgroundAPI, IDialogAPI, IExtension } from '@src/contract'
import { AbortController, withAbortSignal, AbortError } from 'extra-abort'

const STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS = 'excludedExtensions'

createServer<IBackgroundAPI>({
  searchExtension
, loadExcludedExtensions
, saveExcludedExtensions
})

async function searchExtension(): Promise<null> {
  const controller = new AbortController()
  const signal = controller.signal

  const window = await browser.windows.create({
    url: browser.runtime.getURL('dialog.html')
  , type: 'popup'
  , width: 400
  , height: 300
  })
  const tabId = window.tabs?.[0].id
  assert(isntUndefined(tabId), 'The dialog tab does not exist')

  browser.windows.onRemoved.addListener(function windowRemovedHandler(windowId) {
    if (windowId === window.id) {
      browser.windows.onRemoved.removeListener(windowRemovedHandler)
      controller.abort('The interactive window is closed')
    }
  })

  await withAbortSignal(signal, () => new Promise<void>(resolve => {
    browser.runtime.onMessage.addListener(function pingHandler(message, sender) {
      if (sender.tab?.id === tabId && message === 'ping') {
        browser.runtime.onMessage.removeListener(pingHandler)
        resolve()
      }
    })
  }))
  const client = createTabClient<IDialogAPI>({ tabId })

  const excludedExtensions = await loadExcludedExtensions()
  const includedExtensions = (await getAllManageableExtensions())
    .filter(x => x.enabled)
    .filter(({ id }) => !excludedExtensions.find(x => x.id === id))

  try {
    await withAbortSignal(signal, async () => {
      if (includedExtensions.length === 0) {
        return await client.message({
          text: i18n('notification_zero')
        , buttonText: i18n('notification_end')
        })
      }

      let restExtensions = includedExtensions.map(x => ({ name: x.name, id: x.id }))
      while (restExtensions.length !== 1) {
        const [groupA, groupB] = splitArrayInHalf(restExtensions)

        await client.progress({ value: 0 })
        await each(groupA, async ({ id, name }, i) => {
          await disableExtension(id)
          await client.progress({
            text: `${i18n('notification_closing')} ${name}`
          , value: (i + 1) / groupA.length
          })
        }, 1)

        if (
          await client.confirm({
            text: i18n('notification_confirm')
          , button1Text: i18n('notification_still_running')
          , button2Text: i18n('notification_not_running')
          })
        ) {
          restExtensions = groupB
        } else {
          restExtensions = groupA

          await client.progress({ value: 0 })
          await each(groupA, async ({ id, name }, i) => {
            await enableExtension(id)
            await client.progress({
              text: `${i18n('notification_recovering')} ${name}`
            , value: (i + 1) / groupA.length
            })
          }, 1)
        }
      }

      const target = restExtensions[0]
      await client.message({
        title: i18n('notification_result')
      , text: `${ includedExtensions.find(x => x.id === target.id)!.name }`
      , buttonText: i18n('notification_end')
      })
    })
  } catch (e) {
    if (isError(e)) {
      const err = e

      if (!(e instanceof AbortError)) {
        await withAbortSignal(signal, () => client.message({
          title: i18n('notification_unkown_error')
        , text: `${err.message}`
        , buttonText: i18n('notification_end')
        }))
      } else {
        console.warn(e)
      }
    } else {
      console.warn(e)
    }
  } finally {
    await browser.tabs.remove(tabId)
    await each(
      includedExtensions
    , ({ id, enabled }) => setExtensionState(id, enabled)
    , 1
    )
  }

  return null
}

async function setExtensionState(id: string, enabled: boolean): Promise<void> {
  await browser.management.setEnabled(id, enabled)
}

async function enableExtension(id: string): Promise<void> {
  await setExtensionState(id, true)
}

async function disableExtension(id: string): Promise<void> {
  await setExtensionState(id, false)
}

async function loadExcludedExtensions(): Promise<IExtension[]> {
  const data = await browser.storage.sync.get(STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS) as {
    [STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]: IExtension[] | undefined
  }
  return data[STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS] ?? []
}

async function saveExcludedExtensions(excludedExtensions: IExtension[]): Promise<null> {
  await browser.storage.sync.set({
    [STORAGE_ITEM_KEY_EXCLUDED_EXTENSIONS]: excludedExtensions
  })
  return null
}
