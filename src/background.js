function promisify(fn) {
  return (...args) => new Promise((resolve, reject) => fn(...args, result =>
    chrome.runtime.lastError
  ? reject(chrome.runtime.lastError)
  : resolve(result)
  ))
}

const iconUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII='

function confirm(text, button1Text, button2Text) {
  const options = {
    type: 'basic'
  , title: ''
  , message: text
  , iconUrl
  , buttons: [
      { title: button1Text }
    , { title: button2Text }
    ]
  , priority: 2
  , requireInteraction: true
  }

  return new Promise(async (resolve, reject) => {
    function buttonClickHandler(id, buttonIndex) {
      if (id === notificationId) {
        removeListeners()
        chrome.notifications.clear(notificationId)
        resolve(buttonIndex === 0)
      }
    }

    function closeHandler(id) {
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

    const notificationId = await promisify(chrome.notifications.create)(options)
    addListeners()
  })
}

function alert(text, buttonText) {
  const options = {
    type: 'basic'
  , title: ''
  , message: text
  , iconUrl
  , buttons: [
      { title: buttonText }
    ]
  , priority: 2
  , requireInteraction: true
  }

  return new Promise(async (resolve, reject) => {
    function buttonClickHandler(id, buttonIndex) {
      if (id === notificationId) {
        removeListeners()
        chrome.notifications.clear(notificationId)
        resolve()
      }
    }

    function closeHandler(id) {
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

    const notificationId = await promisify(chrome.notifications.create)(options)
    addListeners()
  })
}

/*
async function progress(value, text) {
  const options = {
    type: 'progress'
  , title: ''
  , message: text
  , iconUrl
  , priority: 2
  , requireInteraction: true
  }
  if (!notificationId) {
    notificationId = await promisify(chrome.notifications.create)(options)
  } else {
    await promisify(chrome.notifications.update)(notificationId, options)
  }
}
*/

async function setEnabled(id, enabled) {
  return await promisify(chrome.management.setEnabled)(id, enabled)
}

function enable(id) {
  return setEnabled(id, true)
}

function disable(id) {
  return setEnabled(id, false)
}

function halfArray(arr) {
  const index = Math.ceil(arr.length / 2)
  const arr1 = arr.slice(0, index)
  const arr2 = arr.slice(index)
  return [arr1, arr2]
}

async function search() {
  // Save
  const currentExtensions = (await promisify(chrome.management.getAll)()) // All installed extensions, apps, themes
    .filter(x => ['extension', 'hosted_app'].includes(x.type)) // All extensions and apps
    .filter(x => x.enabled) // All enabled
    .filter(x => x.id !== chrome.runtime.id) // Except me

  if (currentExtensions.length === 0) {
    return await alert('不存在需要查找的扩展', '知道了')
  }

  try {
    // Check
    let temp = currentExtensions.map(x => x.id)
    while (temp.length !== 1) {
      const [arr1, arr2] = halfArray(temp)
      for (id of arr1) {
        await disable(id)
      }
      if (await confirm('已经关闭了剩余的一半扩展, 你寻找的扩展是否还在影响?', '还在影响', '不在影响')) {
        temp = arr2
      } else {
        for (id of arr1) {
          await enable(id)
        }
        temp = arr1
      }
    }

    // Result
    const targetId = temp[0]
    await alert(currentExtensions.find(x => x.id === targetId).name, '知道了')
  } catch (e) {
    if (e) {
      await alert(`发生错误: ${ e.message }`, '结束')
    }
  } finally {
    // Restore
    for (const { id, enabled } of currentExtensions) {
      await setEnabled(id, enabled)
    }
  }
}

chrome.runtime.onMessage.addListener((data, sender) => {
  if (sender.id === chrome.runtime.id) {
    search()
  }
})
