chrome.action.onClicked.addListener(tab => {
// if page zoom is set, these values are somehow less than 500?
  chrome.tabs.getZoom(tab.id, zoomFactor => {
    const width = tab.width / 2
    const height = tab.height / 2 - (250/2)
      chrome.storage.local.set({ url: tab.url }, () => {
        chrome.windows.create({
          url: 'index.html',
          type: 'popup',
          width: Math.floor(500 * (zoomFactor || 1)),
          height: Math.floor(250 * (zoomFactor || 1)),
          left: width - (500 / 2),
          top: height
        })
      })
  })


})
