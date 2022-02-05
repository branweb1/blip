chrome.action.onClicked.addListener(tab => {
  const HEIGHT = 250
  const WIDTH = 500
  // necessary because windows.create ignores zoom factor
  // when creating a window but css doesn't so you
  // get a window that is HEIGHT / zoom factor pixels tall
  // and yet with 500px wide content (as defined in your css)
  chrome.tabs.getZoom(tab.id, zoomFactor => {
    const x = Math.floor(tab.width / 2 - (WIDTH / 2))
    const y = Math.floor(tab.height / 2 - (HEIGHT / 2))
    chrome.storage.local.set({ url: tab.url }, () => {
      chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: Math.floor(WIDTH * (zoomFactor || 1)),
        height: Math.floor(HEIGHT * (zoomFactor || 1)),
        left: x,
        top: y
      })
    })
  })
})
