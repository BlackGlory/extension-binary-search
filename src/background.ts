import { isError } from '@blackglory/prelude'
import { each } from 'extra-promise'
import {
  getAllControllableExtensions
, loadExcludedExtensions
, alert
, confirm
, progress
, splitArrayInHalf
, i18n
} from './utils'

async function setEnabled(id: string, enabled: boolean): Promise<void> {
  await chrome.management.setEnabled(id, enabled)
}

async function enable(id: string): Promise<void> {
  await setEnabled(id, true)
}

async function disable(id: string): Promise<void> {
  await setEnabled(id, false)
}

async function search(): Promise<void> {
  // Save
  const excludeExtensions = loadExcludedExtensions()
  const currentExtensions = (await getAllControllableExtensions())
    .filter(x => x.enabled)
    .filter(({ id }) => !excludeExtensions.find(x => x.id === id))

  if (currentExtensions.length === 0) {
    return await alert(
      undefined
    , i18n('notification_zero')
    , i18n('notification_end')
    )
  }

  try {
    let remains = currentExtensions.map(x => ({ name: x.name, id: x.id }))
    while (remains.length !== 1) {
      const [testArr, anotherArr] = splitArrayInHalf(remains)

      const progressTrigger = await progress(0)
      await each(testArr, async ({ id, name }, i) => {
        await disable(id)
        await progressTrigger(
          (i + 1) / testArr.length
        , `${i18n('notification_closing')} ${name}`
        )
      }, 1)

      if (
        await confirm(
          i18n('notification_confirm')
        , i18n('notification_still_running')
        , i18n('notification_not_running')
        )
      ) {
        remains = anotherArr
      } else {
        remains = testArr

        const progressTrigger = await progress(0)
        await each(testArr, async ({ id, name }, i) => {
          await enable(id)
          await progressTrigger(
            (i + 1) / testArr.length
          , `${i18n('notification_recovering')} ${name}`
          )
        }, 1)
      }
    }

    const target = remains[0]
    await alert(
      i18n('notification_result')
    , `${ currentExtensions.find(x => x.id === target.id)!.name }`
    , i18n('notification_end')
    )
  } catch (e) {
    if (isError(e)) {
      await alert(
        i18n('notification_unkown_error')
      , `${e.message}`
      , i18n('notification_end')
      )
    }
  } finally {
    await each(currentExtensions, ({ id, enabled }) => setEnabled(id, enabled), 1)
  }
}

chrome.runtime.onMessage.addListener(
  async (method, sender, sendResponse): Promise<void> => {
    if (sender.id === chrome.runtime.id) {
      if (method === 'search') {
        await search()
        sendResponse(true)
      }
    }
  }
)
