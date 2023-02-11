import { isntNull } from '@blackglory/prelude'

export interface IExtension {
  name: string
  id: string
}

export function promisify<Args extends unknown[], Result>(
  fn: (...args: [...Args, (result: Result) => void]) => void
): (...args: Args) => Promise<Result> {
  return function (...args: Args): Promise<Result> {
    return new Promise((resolve, reject) => {
      fn(...args, (result: Result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(result)
        }
      })
    })
  }
}

const storageItemKey = 'excludedExtensions'
export function loadExcludedExtensions(): IExtension[] {
  const data = localStorage.getItem(storageItemKey)
  return isntNull(data)
       ? JSON.parse(data) as IExtension[]
       : []
}

export function saveExcludedExtensions(excludedExtensions: IExtension[]): void {
  localStorage.setItem(storageItemKey, JSON.stringify(excludedExtensions))
}

export function getAllExtensions(): Promise<chrome.management.ExtensionInfo[]> {
  // all installed extensions, apps, themes
  return promisify(chrome.management.getAll)()
}

export async function getAllControllableExtensions(): Promise<
  chrome.management.ExtensionInfo[]
> {
  return (await getAllExtensions())
    // all extensions and apps
    .filter(x => ['extension', 'hosted_app'].includes(x.type))
    // except this extension
    .filter(x => x.id !== chrome.runtime.id)
}

export function confirm(
  text: string
, button1Text: string
, button2Text: string
): Promise<boolean> {
  const options: chrome.notifications.NotificationOptions<true> = {
    type: 'basic'
  , title: ''
  , message: text
  , iconUrl: 'assets/images/icon-128.png'
  , buttons: [
      { title: button1Text }
    , { title: button2Text }
    ]
  , priority: 2
  , requireInteraction: true
  }

  return new Promise<boolean>(async (resolve, reject) => {
    const notificationId = await promisify(chrome.notifications.create)(options)
    addListeners()

    function addListeners() {
      chrome.notifications.onButtonClicked.addListener(buttonClickHandler)
      chrome.notifications.onClosed.addListener(closeHandler)
    }

    function removeListeners() {
      chrome.notifications.onButtonClicked.removeListener(buttonClickHandler)
      chrome.notifications.onClosed.removeListener(closeHandler)
    }

    function buttonClickHandler(id: string, buttonIndex: number) {
      if (id === notificationId) {
        removeListeners()
        chrome.notifications.clear(notificationId)
        resolve(buttonIndex === 0)
      }
    }

    function closeHandler(id: string) {
      console.log(id, notificationId)
      if (id === notificationId) {
        removeListeners()
        reject()
      }
    }
  })
}

export function alert(
  title: string = ''
, text: string
, buttonText: string
): Promise<void> {
  const options: chrome.notifications.NotificationOptions<true> = {
    type: 'basic'
  , title
  , message: text
  , iconUrl: 'assets/images/icon-128.png'
  , buttons: [
      { title: buttonText }
    ]
  , priority: 2
  , requireInteraction: true
  }

  return new Promise<void>(async (resolve, reject) => {
    const notificationId = await promisify(chrome.notifications.create)(options)
    addListeners()

    function addListeners() {
      chrome.notifications.onButtonClicked.addListener(buttonClickHandler)
      chrome.notifications.onClosed.addListener(closeHandler)
    }

    function removeListeners() {
      chrome.notifications.onButtonClicked.removeListener(buttonClickHandler)
      chrome.notifications.onClosed.removeListener(closeHandler)
    }

    function buttonClickHandler(id: string, buttonIndex: number) {
      if (id === notificationId) {
        removeListeners()
        chrome.notifications.clear(notificationId)
        resolve()
      }
    }

    function closeHandler(id: string) {
      if (id === notificationId) {
        removeListeners()
        reject()
      }
    }
  })
}

export async function progress(
  value: number
, text: string = ''
): Promise<(value: number, text: string) => Promise<void>> {
  const progressValue = Math.round(value * 100)
  const options: chrome.notifications.NotificationOptions<true> = {
    type: 'progress'
  , title: ''
  , message: text
  , iconUrl: 'assets/images/icon-128.png'
  , progress: progressValue
  , priority: 2
  , requireInteraction: true
  }

  const notificationId = await promisify(chrome.notifications.create)(options)
  return async (value: number, text: string) => {
    const progressValue = Math.round(value * 100)
    await promisify(chrome.notifications.update)(notificationId, {
      ...options
    , progress: progressValue
    , message: text
    })
    if (progressValue === 100) {
      await promisify(chrome.notifications.clear)(notificationId)
    }
  }
}

export function splitArrayInHalf<T>(arr: T[]): [T[], T[]] {
  const index = Math.ceil(arr.length / 2)
  const arr1 = arr.slice(0, index)
  const arr2 = arr.slice(index)
  return [arr1, arr2]
}

export function i18n(messageName: string): string {
  return chrome.i18n.getMessage(messageName)
}
