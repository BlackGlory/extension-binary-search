import { each } from 'extra-promise'
import {
  promisify
, getAllControllableExtensions
, readExceptionsConfig
, alert
, confirm
, progress
, halfArray
} from './utils'

async function setEnabled(id: string, enabled: boolean) {
  return await promisify<void>(chrome.management.setEnabled)(id, enabled)
}

function enable(id: string) {
  return setEnabled(id, true)
}

function disable(id: string) {
  return setEnabled(id, false)
}

async function search() {
  // Save
  const exceptions = await readExceptionsConfig()
  const currentExtensions = (await getAllControllableExtensions())
    .filter(x => x.enabled)
    .filter(({ id }) => !exceptions.find(x => x.id === id))

  if (currentExtensions.length === 0) {
    return await alert(
      undefined
    , chrome.i18n.getMessage('notification_zero')
    , chrome.i18n.getMessage('notification_end')
    )
  }

  try {
    let remains = currentExtensions.map(x => ({ name: x.name, id: x.id }))
    while (remains.length !== 1) {
      const [testArr, anotherArr] = halfArray(remains)

      const progressTrigger = await progress(0)
      await each(testArr, async ({ id, name }, i) => {
        await disable(id)
        await progressTrigger(
          (i + 1) / testArr.length
        , `${ chrome.i18n.getMessage('notification_closing') } ${ name }`
        )
      }, 1)

      if (
        await confirm(
          chrome.i18n.getMessage('notification_confirm')
        , chrome.i18n.getMessage('notification_still_running')
        , chrome.i18n.getMessage('notification_not_running')
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
          , `${ chrome.i18n.getMessage('notification_recovering') } ${ name }`
          )
        }, 1)
      }
    }

    const target = remains[0]
    await alert(
      chrome.i18n.getMessage('notification_result')
    , `${ currentExtensions.find(x => x.id === target.id)!.name }`
    , chrome.i18n.getMessage('notification_end')
    )
  } catch (e) {
    if (e) {
      await alert(
        chrome.i18n.getMessage('notification_unkown_error')
      , `${ e.message }`
      , chrome.i18n.getMessage('notification_end')
      )
    }
  } finally {
    each(currentExtensions, async ({ id, enabled }, i) => await setEnabled(id, enabled), 1)
  }
}

chrome.runtime.onMessage.addListener(async (method, sender, sendResponse) => {
  if (sender.id === chrome.runtime.id) {
    if (method === 'search') {
      await search()
      sendResponse(true)
    }
  }
})
