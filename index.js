var express = require('express');
var app = express()
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const port = process.env.PORT || '3000';

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
    console.log('user disconnected');
  });

  socket.on('queue_note', (freq) => {
    console.log(freq);
    socket.broadcast.emit('play_note', {freq})
  });
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});