function validateWPM(n) {
  return n >= 0 && n <= 1000
}

function saveOptions() {
  const wpm = document.getElementById('default-wpm')
  const status = document.getElementById('status')
  if (!validateWPM(wpm.value)) {
    status.innerHTML = 'error'
    return
  }
  chrome.storage.local.set({ wpm: wpm.value }, () => {
    status.innerHTML = 'saved'
    setTimeout(() => status.innerHTML = '&nbsp;', 750)
  })
}

function loadOptions() {
  chrome.storage.local.get('wpm', ({ wpm }) => {
    const wpmInput = document.getElementById('default-wpm')
    wpmInput.value = wpm
  })
}

document.addEventListener('DOMContentLoaded', () => {
  loadOptions()
  document.getElementById('save').addEventListener('click', saveOptions)
})
