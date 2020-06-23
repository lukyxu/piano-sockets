var express = require('express');
var app = express()
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || '3000';
let userMap = new Map();
let songMap = new Map();
let colours = ['Aqua', 'Aquamarine', 'Blue', 'BlueViolet', 'Brown', 'Coral', 'Crimson', 'Cyan', 'DarkBlue', 'DarkCyan', 'DarkGoldenRod', 'DarkGreen', 'DarkGreen', 'DarkOliveGreen', 'DarkMagenta', 'DeepSkyBlue']

// 0.55 '\\', 'x','v','x'
songMap.set("Kataware", ['m','m','m','m','v','x', 'x','\\', 'v', '\\', 'm', 'm', '\\', '9', '8', '.', 'm', 'm', '.', 'm', 'v', 'b', 'v', 'x', '\\', 'm', 'm', 'm', 'm','v', 'x', 'x', '\\', 'v', 'k', '\\', 'x','v','x','\\', '\\', ';','\\','\\','\\', 'k', '\\', 'x','v','x','k','\\','m', '\\', 'x', 'k'])
songMap.set("Piano for brother",['x','n','x','n','x','n','\\','v','\\','d','j','d','j','d','j','a','g','a','d','p','d','x','d','k','k','p',']','a','p',']','a','d','k','j',']',']','d','d','a',']','g','d','a',']','a','g','#',';','k','k','#','#',';','k','a','d','#','#',';','k','a','d','#',';','k'])
songMap.set("Fur Elise", ['v','c','v','c','v','#','x','\\',';','a','g',';','#','g','l','#','\\','g','v','c','v','c','v','#','x','\\',';','a','g',';','#','g','\\','#',';','#','\\','x','v','k','b','v','x','b','v','x','\\','g','x','\\','#'])
songMap.set("Pachelbels Canon in D Major", ['x',';','#','j','k','d','k',';','n','v','x','z','#',';','#','z','x','z','#',';','k','j','k','g','d','j',';','k','j','d','j','g','d',']','d',';','k','#',';','k','j','d','g','z','x','n','.',';','#','k',';','j','d','x','x','z','x','z','c','d','s',';','g','j','d','x','z','#','z','n','.','8','m','n','v','m','n','v','x','z','#',';','k','j','g','k','j','g','d','g','j','k',';','g',';','k','j','#',';','k',';','k','j','g','d',']','#','z','#',';','k','j','g','#',';','#',';','k','j','n','v'])
songMap.set("Mary Had A Little Lamb", ['g','d','a','d','g','g','g','d','d','d','g','g','g','g','d','a','d','g','g','g','a','d','d','g','d','a'])

app.use(express.static('public'))

app.get('/', (req, res) => {
  let pathname = req.url;
  
  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }
  
  // Ok what's our file extension
  let ext = path.extname(pathname);

  // Map extension to file type
  const typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };

  // What is it?  Default to plain text
  let contentType = typeExt[ext] || 'text/plain';

  // Now read and write back the file with the appropriate content type
  fs.readFile(__dirname + pathname,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Dynamically setting content type
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    if (userMap.get(socket.id)) {
      colours.push(userMap.get(socket.id).colour)
      userMap.delete(socket.id)
      io.emit('all_users', Array.from(userMap.values()))
    }

    console.log(userMap)
    console.log('user disconnected');
  });

  socket.on('queue_note', (freq) => {
    if (userMap.get(socket.id) == null) {
      socket.emit('update_username')
      return
    }
    console.log(freq);
    socket.broadcast.emit('play_note', freq, userMap.get(socket.id).colour)
  });

  socket.on('queue_song', (songName) => {
    songNotes = songMap.get(songName)
    if (songNotes == null) {
      return
    }
    io.emit('play_song', {songName, songNotes, position: 0})
  });

  socket.on('new_user', (username) => {
    const colour = colours.splice(Math.floor(Math.random() * colours.length), 1)[0];
    userMap.set(socket.id, {username, colour, id: socket.id})
    console.log(userMap)
    io.emit('all_users', Array.from(userMap.values()))
    io.emit('all_songs', Array.from(songMap.keys()))
    const users = Array.from(userMap.values()).filter(u => u.cursorX != null && u.cursorY != null)
    socket.broadcast.emit('update_cursors', users)
  });

  socket.on('update_cursor', (x,y) => {
    if (userMap.get(socket.id) == null) {
      return
    }
    userMap.get(socket.id).cursorX = x
    userMap.get(socket.id).cursorY = y
    
    const users = Array.from(userMap.values()).filter(u => u.cursorX != null && u.cursorY != null)
    socket.broadcast.emit('update_cursors', users)
  });

  socket.on('add_song', (songNames, keys) => {
    songMap.set(songNames, keys)
    io.emit('all_songs', Array.from(songMap.keys()))
  });

});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});