const express = require('express')
const compression = require('compression')
const uuidv4 = require('uuid').v4
const cookieParser = require('cookie-parser')
const path = require('path')

const DEFAULT_SECRET = process.env.SECRET || '70cf44d9-8aa2-4cdb-b391-cfdfe1a0247f'
const PORT = parseInt(process.env.PORT) || 3000

var app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

const TITLE = 'LiveBoards'
const DESCRIPTION = 'Digital [White|Black]Boards with Real-Time support'

app.set('view engine', 'ejs')

app.use(compression())

app.use(cookieParser(DEFAULT_SECRET))

app.use(express.static('public'))

app.use((req, res, next) => {
  res.locals.title = TITLE
  res.locals.description = DESCRIPTION
  next()
})

app.get('/', (req, res) => {
  res.render('index.html.ejs')
})

app.get('/new', (req, res) => {
  const id = uuidv4()
  res.cookie('owner', id)
  res.redirect(`/board/${id}`)
})

app.get('/board/:uuid', (req, res) => {
  res.render('board.html.ejs')
})

http.listen(PORT, () => {
  console.log('listening on *:' + PORT)
})

io.on('connection', (socket) => {
  socket.on('create', function (room) {
    socket.join(room)
  })
  socket.on('newline', (room, msg) => {
    socket.to(room).broadcast.emit('drawline', msg)
  })
  socket.on('clear', (room) => {
    socket.to(room).emit('clear', true)
  })
})
