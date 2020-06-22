const canvasWidth = 1100;
const canvasHeight = 450;
const keyWidth = 50
const keyHeight = 200
let socket

const whiteKeyIndex = [0, 2, 4, 5, 7, 9, 11]
const blackKeyIndex = [1, 3, 6, 10]
const keyMap = new Map()

var AudioContextFunc = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContextFunc();
var player = new WebAudioFontPlayer();
player.loader.decodeAfterLoading(audioContext, '_tone_0000_JCLive_sf2_file');

function playNote(note) {
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

  for (let i = 0; i < canvasWidth; i += keyWidth) {
    const k = (i / keyWidth)
    const note = (4 + (Math.floor(k / whiteKeyIndex.length))) * 12 + whiteKeyIndex[k % whiteKeyIndex.length]
    console.log(note)
    keyMap.set(note, new Key(i, canvasHeight - keyHeight, note))
  }

  socket.on('all_users', (users) => {
    $("#names").html("<h2> Users </h2><ul>" + users.map(u => `<li style=color:${u.colour}>${u.username}</li>`).join('') + '</ul>')
  })

  socket.on('play_note', (note, colour) => {
    const key = keyMap.get(note)
    key.setColour(colour)
    playNote(note)
  })
}

function draw() {
  background(204);
  keyMap.forEach(k => k.display())
}

class Key {
  constructor(x, y, note) {
    this.x = x;
    this.y = y;
    this.note = note;
    this.width = keyWidth;
    this.height = keyHeight;
    this.colour = null;
    this.onHover = false;
  }

  display() {
    stroke(0)
    if ((mouseX > this.x && mouseX < this.x + keyWidth && mouseY > this.y && mouseY < this.y + keyHeight)) {
      this.onHover = true
      fill(200)
    } else if (this.colour) {
      fill(this.colour)
    }
    else {
      this.onHover = false
      fill(255)
    }
    rect(this.x, this.y, this.width, this.height)
  }

  setColour(colour) {
    this.colour = colour
    setTimeout(() => { this.colour = null }, 600)
  }
}

function mousePressed() {
  keyMap.forEach(k => {
    if (k.onHover) {
      k.pressed = true
      socket.emit('queue_note', k.note)
      console.log(k.note)
      playNote(k.note)
    }
  })
}