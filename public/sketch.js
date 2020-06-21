let rects = []
const canvasWidth = 1100;
const canvasHeight = 400;
const keyWidth = 50
const keyHeight = 100
let env
let sinOsc
// console.log(socket)
let socket

function setup() {
  let person = prompt("Please enter your name");
  socket = io()

  socket.emit('new_user', person)

  env = new p5.Env(0.1, 0.7, 0.3, 0.1);
  sinOsc = new p5.Oscillator('sine');
  const canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('sketch-holder');

  let freqTable = [
    130.813, 146.832, 164.814, 174.614, 195.998, 220.000, 246.942,
    261.626, 293.665, 329.628, 349.228, 391.995, 440.000, 493.883, 
    523.251, 587.330, 659.255, 698.456, 783.991, 880.000, 987.767,
    1046.502]

  for (let i = 0; i < canvasWidth; i += keyWidth) {
    rects.push(new Key(i, canvasHeight - keyHeight, freqTable[i / keyWidth]))
  }

  socket.on('all_users', (users) => {
    $("#names").html("<h2> Users </h2><ul>" + users.map(u => `<li style=color:${u.colour}>${u.username}</li>`).join('') + '</ul>')
  })

  socket.on('play_note', (freq, colour) => {
    const key = rects[freqTable.indexOf(freq)]
    key.setColour(colour)
    key.playNote()
  })
}

function draw() {
  background(204);
  for (let i = 0; i < rects.length; i++) {
    rects[i].display()
    // rects[i].checkHover()
  }
}

class Key {
  constructor(x, y, freq) {
    this.x = x;
    this.y = y;
    this.freq = freq;
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

  playNote() {
    sinOsc.start()
    sinOsc.freq(this.freq)
    env.play(sinOsc)
    this.pressed = false
  }
}

function mousePressed() {
  for (let i = 0; i < rects.length; i++) {
    if (rects[i].onHover) {
      rects[i].pressed = true
      socket.emit('queue_note', rects[i].freq)
      rects[i].playNote()
    }
  }
}