// TODO allow configuration of colors
// TODO save progress in local storage so we can start where we left off
// TODO try against more inputs to find edge cases
// TODO add overlay to darken rest of screen

// state
// offset is how many characters to the left the red letter is
// so if e was the red letter below
// 0 1 2 3 4
// a b c d e
// the offset would be 3
// we multiply this by the width of a character to get the
// position of the little vertical bars. We also use it
// to pad the word so that it aligns to the vertical bars.
const APPSTATE = {
  count: 0,
  words: [],
  offset: 5,
  wpm: 320,
  paused: true,
  intervalId: null,
  url: null
}

// helpers
function calculateDelay(word) {
  if (word.length === 0) return -1
  const lastLetter = word[word.length-1]
  const interval = calculateInterval()
  let newInterval;
  switch(lastLetter) {
    // fallthrough intentional
    case '!':
    case '?':
    case '.': {
       newInterval = Math.floor(interval * 1.5)
    }
    break;
    // fallthrough intentional
    case ':':
    case ',': {
      newInterval = Math.floor(interval * 1.2)
    }
    break;
    // fallthrough intentional
    case '"':
    case '\'': {
      if (/[\.\?\!]/.test(word[word.length-2])) {
        newInterval = Math.floor(interval * 1.5)        
      }
    }
    break;
    default: {
      newInterval = 0
    }
  }
  return newInterval
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calculateRedIndex(word) {
  let redIndex;
  const wordlen = word.length;
  if (wordlen === 1) {
    redIndex = 0
  } else if (wordlen <= 3) {
    redIndex = 1
  } else if (wordlen < 8) {
    redIndex = 2
  } else {
    redIndex = 3
  }
  
  return redIndex
}

function leftPad(word, padchar, n) {
  let padding = ''
  for (let i = 0; i < n; i++) {
    padding += padchar
  }
  return padding + word
}

function buildWord(word) {
  if (!word) return '  '
  let index = calculateRedIndex(word)
  // we want the red letter to align with the vertical bars. We get their
  // position by doing offset * width of character. So if the word was
  // foobar, index would be 2. We subtract that from the offset to account
  // for the width of the two characters ahead of the red letter (in this
  // case f and o).
  const p1 = leftPad(word.substring(0, index), ' ', APPSTATE.offset-index)
  const p2 = `<span class="red-letter">${word.charAt(index)}</span>`
  const p3 = word.substring(index+1)
  return p1 + p2 + p3
}

function calculateInterval() {
  return Math.floor(60 * 1000 / APPSTATE.wpm)
}

// the main thing
async function blip() {
  if (APPSTATE.count > APPSTATE.words.length-1) {
    clearInterval(APPSTATE.intervalId)
    return
  }

  const currentWord = APPSTATE.words[APPSTATE.count]

  // skip empty words
  if (currentWord === '') {
    APPSTATE.count++
    return
  }

  render(buildWord(currentWord))

  const delay = calculateDelay(currentWord)

  if (delay > 0) {
    clearInterval(APPSTATE.intervalId)
    APPSTATE.intervalId = null
    await sleep(delay)
    // if the user clicked paused while we were sleeping, then don't
    // set a new interval. The user will need to unpause for that to
    // happen
    if (!APPSTATE.paused) {
      APPSTATE.intervalId = setInterval(blip, calculateInterval())
    }
  }

  APPSTATE.count++  
}

// render stuff
function render(word) {
  const display = document.getElementById("word")
  const wpm = document.getElementById("wpm")
  display.innerHTML = word
  wpm.innerHTML = `${APPSTATE.wpm} wpm`
}

function renderInitial() {
  const body = document.querySelector('body')
  const bodyWidth = body.getBoundingClientRect().width
  
  // hack to render popup sanely in tiling window system
  const bodyHeight = body.getBoundingClientRect().height
  const contentHeight = document.querySelector('.top').getBoundingClientRect().height +
        document.querySelector('.bottom').getBoundingClientRect().height
  if (bodyHeight > contentHeight + 200) {
    body.style.paddingTop = `${(bodyHeight / 2 - contentHeight).toFixed(0)}px`
  }

  const display = document.getElementById("word")
  display.style.visibility = 'hidden'
  display.innerHTML = buildWord("dummyword")
  const charWidth = display.querySelector('span').getBoundingClientRect().width
  APPSTATE.offset = Math.floor((bodyWidth / 3)  / charWidth)
  const pixelOffset = (charWidth / 2) + (charWidth * APPSTATE.offset)
  Array.from(document.querySelectorAll(".vert-bar")).forEach(bar => {
    bar.style.width = `${pixelOffset}px`
  })
  display.style.visibility = 'initial'
  render(' ')
}

// content fetching
async function parse(url) {
  const { content } = await Mercury.parse(url, { contentType: 'text'} )
  // split on regex and then don't render string
  //  APPSTATE.words
  const parsedWords = []
  const words = content.split(" ").forEach(word => {
    const periodIndex = word.indexOf('.')
    let cleanedWords = []
    // not 0 or -1 since we don't want to
    // split up something like U.S. Grant either
    if (periodIndex > 1) {
      const firstWord = word.substring(0, periodIndex+1)
      const secondWord = word.substring(periodIndex+1)
      cleanedWords.push(firstWord)
      cleanedWords.push(secondWord)
    } else {
      cleanedWords.push(word)
    }

    // sometimes content comes with these characters inside
    cleanedWords = cleanedWords.map(word => word.replace(/[\n\t\s]+/, ''))

    cleanedWords.forEach(word => parsedWords.push(word))
  })

  APPSTATE.words = parsedWords
  console.log('content', content)
}

async function start() {
  // TODO handle error
  await parse(APPSTATE.url)
  clearInterval(APPSTATE.intervalId)
  APPSTATE.intervalId = setInterval(blip, calculateInterval())
}

function control(e) {
  e.preventDefault()

  const isInitial = e.currentTarget.dataset.initial === 'true'

  // TODO handle error
  // TODO is button always target of click?
  const [img] = Array.from(e.currentTarget.children)

  if (isInitial) {
    APPSTATE.paused = false
    e.currentTarget.dataset.initial = 'false'
    img.setAttribute('src', 'pause.svg')
    start()
  } else if (APPSTATE.paused) {
    clearInterval(APPSTATE.intervalId)
    APPSTATE.intervalId = setInterval(blip, calculateInterval())
    APPSTATE.paused = false
    img.setAttribute('src', 'pause.svg')
  } else {
    clearInterval(APPSTATE.intervalId)
    APPSTATE.intervalId = null
    APPSTATE.paused = true
    img.setAttribute('src', 'play.svg')
  }
}

function adjustSpeed(amount) {
  return (e) => {
    e.preventDefault()

    // In our main setInterval callback, we cancel the interval
    // and run a setTimeout in order to extend the time we spend
    // on a word ending in a period, question mark, etc. Once done
    // we reset the interval. Unfortuantely the use can still click
    // buttons in this period, so what happens is that we set a new
    // interval based on button click, then set a second interval
    // in our main callback once the delay is over. This check prevents
    // that since that delay is the only time intervalID would be null
    // without being paused
    if (!APPSTATE.paused && APPSTATE.intervalId === null) return

    APPSTATE.wpm += amount

    if (APPSTATE.paused) {
      // so wpm updates in ui. If not pased, our
      // setInterval callback handles the render
      render(buildWord(APPSTATE.words[APPSTATE.count-1]))
    } else {
      clearInterval(APPSTATE.intervalId)
      APPSTATE.intervalId = setInterval(blip, calculateInterval())
    }
  }
}

function handleHover(iconFile) {
  return e => {
    const [img] = Array.from(e.currentTarget.children)
    img.setAttribute('src', `${iconFile}`)
  }
}

function handleControlHover(playIcon, pauseIcon) {
  return e => {
    handleHover(APPSTATE.paused ? playIcon : pauseIcon)(e)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const incButton = document.getElementById('inc-wpm')
  const decButton = document.getElementById('dec-wpm')
  const controlButton = document.getElementById('control')
  incButton.addEventListener('mouseover', handleHover('incr-hover.svg'))
  incButton.addEventListener('mouseout', handleHover('incr.svg'))
  decButton.addEventListener('mouseover', handleHover('decr-hover.svg'))
  decButton.addEventListener('mouseout', handleHover('decr.svg'))
  controlButton.addEventListener('mouseover', handleControlHover('play-hover.svg', 'pause-hover.svg'))
  controlButton.addEventListener('mouseout', handleControlHover('play.svg', 'pause.svg'))
  incButton.addEventListener('click', adjustSpeed(10))
  decButton.addEventListener('click', adjustSpeed(-10))
  controlButton.addEventListener('click', control)
  chrome.storage.local.get(['wpm', 'url'], ( { wpm, url } ) => {
    APPSTATE.wpm = Number(wpm) || 320
    APPSTATE.url = url
    renderInitial()
  })
})
