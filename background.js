chrome.action.onClicked.addListener(tab => {

  chrome.storage.local.set({ url: tab.url }, () => {
    chrome.windows.create({
      url: 'index.html',
      type: 'popup',
      width: 500
    })
  })
})
