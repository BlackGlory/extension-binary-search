document.querySelector('button').addEventListener('click', () => {
  chrome.runtime.sendMessage(true)
})
