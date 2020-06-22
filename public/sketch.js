const canvasWidth = 1100;
const canvasHeight = 450;
const whiteKeyWidth = 50
const whiteKeyHeight = 200
const blackKeyWidth = 36
const blackKeyHeight = 140

let socket

const whiteKeyIndex = [0, 2, 4, 5, 7, 9, 11]
const blackKeyIndex = [1, 3, 6, 8, 10]
const keyMap = new Map()
var users = []
var currentSong = null
var songNames = []

const keyMappings = ['q', 'w', 'e', 'r', 't', 'y', 'u','i','o','p','[',']','a','s','d','f','g','h','j','k','l',';','\'','#','\\','z','x','c','v','b','n','m',',','.','/', '8','9','0']

var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
player.loader.decodeAfterLoading(audioContext, '_tone_0000_JCLive_sf2_file');

function playNote(note) {
  if (currentSong != null && keyMap.get(note).letter == currentSong.songNotes[currentSong.position]) {
    currentSong.position++;
    if (currentSong.position >= currentSong.songNotes.length) {
      currentSong = null
    }
  }
  player.queueWaveTable(audioContext, audioContext.destination
    , _tone_0000_JCLive_sf2_file, 0, note, 1, 0.2);
  return false;
}

function setup() {
  let person = prompt("Please enter your name");
  socket = io()
  socket.emit('new_user', person)
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('sketch-holder');
  canvas.mouseMoved(updateCursor)

  for (let x = 0; x < canvasWidth; x += whiteKeyWidth) {
    const y = canvasHeight - whiteKeyHeight
    const whiteIndex = (x / whiteKeyWidth)
    const whiteOffset = whiteKeyIndex[whiteIndex % whiteKeyIndex.length]
    const note = (4 + (Math.floor(whiteIndex / whiteKeyIndex.length))) * 12 + whiteOffset
    // console.log(note)
    keyMap.set(note, newWhiteKey(x, y, note, whiteOffset))
  }

  let blackIndex = 0
  keyMap.forEach((key, note) => {
    const blackOffset = blackKeyIndex[blackIndex % blackKeyIndex.length]
    if (blackOffset === key.offset+1) {
      keyMap.set(note+1, newBlackKey(key.x+key.width-blackKeyWidth/2, key.y, note+1, blackOffset))
      blackIndex++
    }
  })
  

  socket.on('all_users', (users) => {
    $("#names").html("<ul>" + users.map(u => `<li style=color:${u.colour}>${u.username}</li>`).join('') + '</ul>')
  })

  socket.on('all_songs', (sn) => {
    songNames = sn
    $("#songs").html("<ul>" + sn.map(u => `<li>${u} <button value='${u}' onclick="playSong(this.value)">Play</button></li>`).join('') + '</ul>')
  })

  socket.on('play_note', (note, colour) => {
    const key = keyMap.get(note)
    key.setColour(colour)
    playNote(note)
  })

  socket.on('play_song', (song) => {
    currentSong = song
    console.log(currentSong)
  })

  socket.on('update_cursors', (usrs) => {
    console.log(usrs)
    users = usrs
  })

  socket.on('update_username', () => {
    let person = prompt("Please enter your name");
    socket.emit('new_user', person)
  })

  const s = $('#song-name')
  const k = $('#keys')
}

function playSong(songName) {
  console.log(songName)
  socket.emit('queue_song', songName)
}

function draw() {
  background(204);
  keyMap.forEach(k => k.display())
  users.filter(u => u.id != socket.id).forEach(u => { fill(u.colour); ellipse(u.cursorX, u.cursorY, 10,10)})

  if (currentSong != null) {
    textSize(200);
    textAlign(CENTER);
    text(currentSong.songNotes[currentSong.position], canvasWidth/2, canvasHeight/2.5);
  }
}

function newWhiteKey(x,y,note, offset) {
  return new Key(x, y, note, offset, whiteKeyWidth, whiteKeyHeight, false)
}

function newBlackKey(x,y,note, offset) {
  return new Key(x, y, note, offset, blackKeyWidth, blackKeyHeight, true)
}

function updateCursor() {
  socket.emit('update_cursor', mouseX, mouseY)
}

function updateCursor() {
  socket.emit('update_cursor', mouseX, mouseY)
}

class Key {
  constructor(x, y, note, offset, width, height, isBlack) {
    this.x = x;
    this.y = y;
    this.note = note;
    this.letter = keyMappings[note-48]
    this.offset = offset;
    this.width = width;
    this.height = height;
    this.isBlack = isBlack;
    this.colour = null;
    this.onHover = false;
  }

  display() {
    stroke(0)

    const blackNoteSelected = Array.from(keyMap.values()).filter(k => k.isBlack).some(k => k.onHover)
    if ((mouseX > this.x && mouseX < this.x + this.width && mouseY > this.y && mouseY < this.y + this.height) && !(blackNoteSelected && !this.isBlack)) {
      this.onHover = true
      fill(192)
    } else if (this.colour) {
      this.onHover = false
      fill(this.colour)
    } else {
      this.onHover = false
      if (this.isBlack) {
        fill(0)
      } else {
        fill(255)
      }
    }
    rect(this.x, this.y, this.width, this.height)
  }

  setColour(colour) {
    this.colour = colour
    setTimeout(() => { this.colour = null }, 600)
  }
}

function playKey(key) {
  key.pressed = true
  socket.emit('queue_note', key.note)
  playNote(key.note)
}

function addNewSong() {
  const songName = $('#song-name').val()
  const keys = $('#keys').val().split(',')
  const valid = keys.every(k => keyMappings.includes(k))
  if (!valid) {
    alert('Invalid keys')
  } else if (songNames.includes(songName)) {
    alert('Song name already taken')
  } else {
    socket.emit('add_song', songName, keys)
  }
  return false
}

function mousePressed() {
  keyMap.forEach(k => {
    if (k.onHover) {
      playKey(k)
    }
  })
}

function keyPressed() {
  const s = $('#song-name')
  const k = $('#keys')
  if (s.is(':focus') || k.is(':focus')) {
    return;
  }
  const index = keyMappings.indexOf(key)
  if (index != -1) {
    console.log(index+48)
    const key = keyMap.get(index+48)
    console.log(key)
    playKey(key)
    key.setColour('silver')
  }
}