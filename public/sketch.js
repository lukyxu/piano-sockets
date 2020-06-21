let rects = []
const canvasWidth = 400;
const canvasHeight = 400;
const keyWidth = 50
const keyHeight = 100
let env
let sinOsc
// console.log(socket)
let socket

function setup() {
  // let person = prompt("Please enter your name");
  socket=io()
  env = new p5.Env(0.1, 0.7, 0.3, 0.1);
  sinOsc = new p5.Oscillator('sine')
  createCanvas(canvasWidth, canvasHeight);

  let freqTable = [261.626, 293.665, 329.628, 349.228, 391.995, 440.000, 493.883, 523.251]

  for (let i = 0; i < canvasWidth; i+=keyWidth) {
    rects.push(new Key(i, canvasHeight-keyHeight, freqTable[i/keyWidth]))
  }

  socket.on('play_note', (obj) => {
    console.log("playing from elsewhere")
    console.log(obj.freq)
    console.log(freqTable.indexOf(obj.freq))
    rects[freqTable.indexOf(obj.freq)].playNote()
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
    this.onHover = false;
    this.pressed = false;
  }
  
  display() {
    stroke(0)
    
    if (this.pressed) {
      fill(150)
    } else if ((mouseX > this.x && mouseX < this.x + keyWidth && mouseY > this.y && mouseY < this.y+keyHeight)) {
      this.onHover = true
      fill(200)
    } else {
      this.onHover = false
      fill(255)
    }
    rect(this.x, this.y, this.width, this.height)
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