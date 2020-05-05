/* eslint-env browser */
/* global io, ClipboardJS */

function getCookie (name) {
  var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
  return v ? v[2] : null
}

const boardID = location.href.substr(-36)
const canDraw = boardID === getCookie('owner')
const socket = io()
const toolbar = document.getElementById('toolbar')
const canvas = document.getElementById('draw')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth - 2
canvas.height = window.innerHeight - toolbar.getBoundingClientRect().height - 14
ctx.strokeStyle = '#BADA55'
ctx.lineJoin = 'round'
ctx.lineCap = 'round'
// ctx.globalCompositeOperation = 'multiply';

const DESCRIPTION = 'Digital [White|Black]Boards with Real-Time support'
const BLACK = '#002635'
const WHITE = '#FFFFFF'

let theme = 'dark'
let backgroundColor = BLACK
let borderColor = WHITE

let isRainbowMode = false
let isDrawing = false
let currentColor = '#000'
let hue = 0
let currentLineSize = 10

let lastPressure = '0.5'
let lastX = 0
let lastY = 0

function clearCanvas () {
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  canvas.style.borderColor = borderColor
}

function drawLine (line) {
  ctx.strokeStyle = line.color
  ctx.lineWidth = line.size * line.pressure
  ctx.beginPath()
  ctx.moveTo(line.beginX, line.beginY)
  ctx.lineTo(line.endX, line.endY)
  ctx.stroke()
}

function draw (event) {
  event.preventDefault()
  if (!isDrawing || !canDraw) return
  let color = currentColor

  if (isRainbowMode) {
    color = `hsl(${hue}, 100%, 50%)`
    hue++
    hue = hue % 361
  }

  const newLine = {
    beginX: lastX,
    beginY: lastY,
    endX: event.clientX,
    endY: event.clientY,
    color: color,
    size: currentLineSize,
    pressure: event.pressure || lastPressure
  }

  drawLine(newLine);
  [lastX, lastY] = [event.clientX, event.clientY]
  lastPressure = event.lastPressure
  socket.emit('newline', boardID, newLine)
}

function movimentStarted (event) {
  event.preventDefault()
  isDrawing = true;
  [lastX, lastY] = [event.clientX, event.clientY]
}

function movementEnded (event) {
  event.preventDefault()
  isDrawing = false
}

function downloadImage () {
  var link = document.createElement('a')
  link.download = 'liveboard.png'
  link.href = canvas.toDataURL()
  link.click()
}

function goToURL (url) {
  var link = document.createElement('a')
  link.href = url
  link.click()
}

function toggleTheme () {
  const element = document.body
  switch (element.dataset.theme) {
    case 'ligth':
      element.dataset.theme = 'dark'
      backgroundColor = BLACK
      borderColor = WHITE
      break
    case 'dark':
      element.dataset.theme = 'ligth'
      backgroundColor = WHITE
      borderColor = BLACK
      break
  }
  localStorage.setItem('theme', element.dataset.theme)
}

document.addEventListener('DOMContentLoaded', function () {
  theme = localStorage.getItem('theme') || 'ligth'
  document.body.dataset.theme = theme

  socket.emit('create', boardID)

  canvas.addEventListener('pointerdown', movimentStarted)
  canvas.addEventListener('pointermove', draw)
  canvas.addEventListener('pointerup', movementEnded)
  canvas.addEventListener('pointerout', movementEnded)

  socket.on('drawline', function (line) {
    drawLine(line)
  })
  socket.on('clear', function (msg) {
    clearCanvas()
  })

  const themeButton = document.getElementById('themeButton')
  themeButton.addEventListener('click', toggleTheme)

  const newButton = document.getElementById('newButton')
  newButton.addEventListener('click', function (event) {
    goToURL('/new')
  })

  const shareButton = document.getElementById('shareButton')
  if (navigator.share) {
    shareButton.addEventListener('click', async function (event) {
      const url = location.href

      const shareData = {
        title: document.title,
        text: DESCRIPTION,
        url: url
      }
      navigator.share(shareData).then(
        function () {
          console.info('Shared!')
        },
        function (err) {
          console.error(err)
        })
    })
  } else {
    const clipboard = new ClipboardJS(
      shareButton,
      {
        text: function (trigger) {
          return location.href
        }
      }
    )
    clipboard.on('success', function (e) {
      alert('Url copiada com sucesso!')
    })
  }

  const downloadButton = document.getElementById('downloadButton')
  downloadButton.addEventListener('click', function (event) {
    downloadImage()
  })

  const rainbowControl = document.getElementById('rainbowControl')
  rainbowControl.addEventListener('click', function (event) {
    isRainbowMode = rainbowControl.checked
  })

  const colorInput = document.getElementById('colorInput')
  colorInput.addEventListener('change', function (event) {
    currentColor = event.target.value
  })
  currentColor = colorInput.value

  const sizeInput = document.getElementById('sizeInput')
  sizeInput.addEventListener('change', function (event) {
    currentLineSize = event.target.value
  })
  currentLineSize = sizeInput.value

  const refreshButton = document.getElementById('refreshButton')
  refreshButton.addEventListener('click', function (event) {
    location.reload()
  })

  const clearButton = document.getElementById('clearButton')
  clearButton.addEventListener('click', function (event) {
    if (confirm('Tem certeza que deseja limpar o quadro?')) {
      clearCanvas()
      socket.emit('clear', boardID)
    }
  })

  const editorToolbarItens = [clearButton, colorInput, sizeInput]
  editorToolbarItens.forEach(function (element) {
    if (!canDraw) {
      element.classList.add('is-hidden')
    }
  })
})
