export interface ExtensionInfoLite {
  name: string
  id: string
}

export function promisify<T>(fn: (...args: any[]) => any) {
  return (...args: any[]) => new Promise<T>((resolve, reject) => fn(...args, (result: T) =>
    chrome.runtime.lastError
  ? reject(chrome.runtime.lastError)
  : resolve(result)
  ))
}

export async function readExceptionsConfig(): Promise<ExtensionInfoLite[]> {
  const items = await promisify<{ [key: string]: any }>(chrome.storage.sync.get.bind(chrome.storage.sync))(['exceptions'])
  return items.exceptions || []
}

export async function writeExceptionsConfig(exceptions: ExtensionInfoLite[]) {
  await promisify(chrome.storage.sync.set.bind(chrome.storage.sync))({ exceptions })
}

export function getAllExtensions() {
  // All installed extensions, apps, themes
  return promisify<chrome.management.ExtensionInfo[]>(chrome.management.getAll)()
}

export async function getAllControllableExtensions() {
  return (await getAllExtensions())
    .filter(x => ['extension', 'hosted_app'].includes(x.type)) // All extensions and apps
    .filter(x => x.id !== chrome.runtime.id) // Except me
}

export function confirm(text: string, button1Text: string, button2Text: string) {
  const options = {
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
    function buttonClickHandler(id: string, buttonIndex: number) {
      if (id === notificationId) {
        removeListeners()
        chrome.notifications.clear(notificationId)
        resolve(buttonIndex === 0)
      }
    }

    function closeHandler(id: string) {
      if (id === notificationId) {
        removeListeners()
        reject()
      }
    }

    function addListeners() {
      chrome.notifications.onButtonClicked.addListener(buttonClickHandler)
      chrome.notifications.onClosed.addListener(closeHandler)
    }

    function removeListeners() {
      chrome.notifications.onButtonClicked.removeListener(buttonClickHandler)
      chrome.notifications.onClosed.removeListener(closeHandler)
    }

    const notificationId = await promisify(chrome.notifications.create)(options) as string
    addListeners()
  })
}

export function alert(title: string = '', text: string, buttonText: string) {
  const options = {
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

    function addListeners() {
      chrome.notifications.onButtonClicked.addListener(buttonClickHandler)
      chrome.notifications.onClosed.addListener(closeHandler)
    }

    function removeListeners() {
      chrome.notifications.onButtonClicked.removeListener(buttonClickHandler)
      chrome.notifications.onClosed.removeListener(closeHandler)
    }

    const notificationId = await promisify(chrome.notifications.create)(options) as string
    addListeners()
  })
}

export async function progress(value: number, text = '') {
  const progressValue = Math.round(value * 100)
  const options = {
    type: 'progress'
  , title: ''
  , message: text
  , iconUrl: 'assets/images/icon-128.png'
  , progress: progressValue
  , priority: 2
  , requireInteraction: true
  }

  const notificationId = await promisify(chrome.notifications.create)(options) as string
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

export function halfArray(arr: any[]) {
  const index = Math.ceil(arr.length / 2)
  const arr1 = arr.slice(0, index)
  const arr2 = arr.slice(index)
  return [arr1, arr2]
}
