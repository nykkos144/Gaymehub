const crypto = require('crypto');

const { createServer } = require("http");
const express = require("express");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = createServer(app);
const io = socketIo(server, { 
  cors: { 
    origin: "*" 
  }, 
});

const path = require("path");

app.use(express.static(path.join(__dirname + "/public")));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});


const chessIo = io.of('/CHESS');

var chessLobby = [];
var chessDict = {

};
var chessPlayerCount = 0;

chessIo.on("connection", (socket) => {

  let room = null;

  console.log("New client connected to >> CHESS << " + socket.id);


  ///////////////////// CHESS CONNECT /////////////////////

  socket.on('create', () => {
    const id = crypto.randomBytes(5).toString("hex");

    socket.join('GAY' + id);
    socket.emit('roomNum', 'GAY' + id);

    room = 'GAY' + id;
  });

  socket.on('join', (currRoom) => {
    if (chessIo.adapter.rooms.get(currRoom)) {
      if (chessIo.adapter.rooms.get(currRoom).size === 1) {
        socket.join(currRoom);
        socket.to(currRoom).emit('joined');
        room = currRoom;
      }
      else {
        socket.emit('roomFull');
      }
    }
    else {
      socket.emit('invalidRoom');
    }
  });

  socket.on('changePlayer', (player) => {
    socket.to(room).emit('changePlayer', player);
  });

  socket.on('changeMode', (mode) => {
    socket.to(room).emit('changeMode', mode);
  });


  ///////////////////// CHESS START GAME /////////////////////

  socket.on('startGame', () => {
    chessIo.to(room).emit('startGame');
  });

  socket.on('playOnline', (mode) => {
    // let roomName = crypto.randomBytes(2).toString("hex") + '-' + mode;
    // // let roomName = mode;
    // socket.join(roomName);
    // room = mode;

    // if (chessLobby.includes(room)) {
    //   socket.emit('changePlayer', 2);
    //   chessIo.to(room).emit('startGame');
    //   chessLobby.pop(chessLobby.indexOf(room));
    //   chessPlayerCount--;
    // }
    // else {
    //   socket.emit('changePlayer', 1);
    //   chessLobby.push(room);
    //   chessPlayerCount++;
    // }

    let gameRoom = null;
    for (let i = 0; i < chessLobby.length; i++) {
      if (chessLobby[i].split('-')[1] === mode) {
        gameRoom = chessLobby[i];
        break
      }
    }

    if (gameRoom) {
      room = gameRoom;
      socket.join(gameRoom);

      socket.emit('changePlayer', 2);
      chessIo.to(room).emit('startGame');
      chessLobby.pop(chessLobby.indexOf(room));
      // chessPlayerCount--;
  }
    else {
      room = crypto.randomBytes(5).toString("hex") + '-' + mode;
      socket.join(room);

      socket.emit('changePlayer', 1);
      chessLobby.push(room);
      chessPlayerCount++;
    }

    
    console.log(chessLobby)
  })

  socket.on('cancelSearch', () => {
    if (chessLobby.indexOf(room) > 0) {
      chessLobby.pop(chessLobby.indexOf(room));
    }
    else {
      chessLobby.shift();
    }
    chessPlayerCount--;
    socket.leave(room);
    room = null;

    console.log(chessLobby)
  });

  ///////////////////// CHESS GAME CONTROL /////////////////////

  socket.on('updateTime', (min, sec) => {
    socket.to(room).emit('updateTime', min, sec);
  });

  socket.on('move', (start, end, move) => {
    let revStart = [7 - start[0], 7 - start[1]];
    let revEnd = [7 - end[0], 7 - end[1]];

    socket.to(room).emit('move', revStart, revEnd, move);
  });
  
  socket.on('pawnChange', (pos, piece) => {
    let revPos = [7 - pos[0], 7 - pos[1]];

    socket.to(room).emit('pawnChange', revPos, piece);
  });

  socket.on('changeTurn', (turn) => {
    let res = (turn === 1 ? 2 : 1);
    chessIo.to(room).emit('changeTurn', res);
  })

  socket.on('check', (pos) => {
    let revPos = [7 - pos[0], 7 - pos[1]];

    socket.to(room).emit('check', revPos);
  });

  socket.on('end', (res) => {
    socket.to(room).emit('end', res);
  });

  socket.on('kingMove', (pos) => {
    let revPos = [7 - pos[0], 7 - pos[1]];

    socket.to(room).emit('kingMove', revPos);
  });

  socket.on('playAgain', () => {
    socket.to(room).emit('playAgain');
  });
  socket.on('reset', () => {
    chessIo.to(room).emit('reset');
  });

  socket.on('refresh', () => {
    socket.leave(room);
    socket.to(room).emit('left');
    room = null;
  });

  socket.on('drawRequest', () => {
    socket.to(room).emit('drawRequest');
  });
  socket.on('acceptDraw', () => {
    chessIo.to(room).emit('end', 'draw');
  });
  socket.on('declineDraw', () => {
    socket.to(room).emit('declineDraw');
  });

  socket.on("disconnect", () => {
    if (chessIo.adapter.rooms.get(room)) {
      if (chessIo.adapter.rooms.get(room).size >= 0) {
        socket.to(room).emit('left');
      }
    }
    for (let i = 0; i < chessLobby.length; i++) {
      if (chessLobby[i].split('-')[0] === room) {
        if (chessLobby.indexOf(room) > 0) {
          chessLobby.pop(chessLobby.indexOf(room));
        }
        else {
          chessLobby.shift();
        }    
        break
      }
    }
    console.log("Client disconnected from >> CHESS <<");
  });

});


var tttLobby = [];
var tttPlayerCount = 0;

const tttIo = io.of('/TTT');

tttIo.on("connection", (socket) => {

  let room = null;

  console.log("New client connected  to >> TTT << " + socket.id);

  socket.on('create', () => {
    const id = crypto.randomBytes(5).toString("hex");

    socket.join('GAY' + id);
    socket.emit('roomNum', 'GAY' + id);

    room = 'GAY' + id;
  });
  socket.on('join', (currRoom) => {
    if (tttIo.adapter.rooms.get(currRoom)) {
      if (tttIo.adapter.rooms.get(currRoom).size === 1) {
        socket.join(currRoom);
        socket.to(currRoom).emit('joined');
        room = currRoom;
      }
      else {
        socket.emit('roomFull');
      }
    }
    else {
      socket.emit('invalidRoom');
    }
  });
  
  socket.on('changeShape', (shape) => {
    socket.to(room).emit('changeShape', shape);
  });
  socket.on('changeOppShape', (shape) => {
    socket.to(room).emit('changeOppShape', shape);
  });
  socket.on('changePlayer', (player) => {
    socket.to(room).emit('changePlayer', player);
  });

  ///////////////////// TTT START GAME /////////////////////

  socket.on('startGame', () => {
    tttIo.to(room).emit('startGame');
  });
  socket.on('playOnline', (shape) => {
    // let roomName = Math.floor(tttPlayerCount / 2);
    // console.log('before -> ' + tttPlayerCount)
    // socket.join(roomName);
    // room = roomName;

    let name = shape.split('/').pop().split('.')[0];

    // if (tttLobby.includes(room)) {
    //   socket.emit('changeData', (name === 'x' || name === 'o' ? null : shape), 2);
    //   tttIo.to(room).emit('startGame');
    //   tttLobby.pop(tttLobby.indexOf(room));
    //   tttPlayerCount++;
    //   // tttPlayerCount--;
    // }
    // else {
    //   socket.emit('changeData', (name === 'x' || name === 'o' ? null : shape), 1);
    //   tttLobby.push(room);
    //   tttPlayerCount++;
    // }

    // console.log('after -> ' + tttPlayerCount)

    if (tttLobby.length > 0) {
      room = tttLobby[0];
      socket.join(room);

      socket.emit('changeData', (name === 'x' || name === 'o' ? null : shape), 2);
      tttIo.to(room).emit('startGame');
      tttLobby.shift();
      tttPlayerCount++;
      // tttPlayerCount--;
    }
    else {
      room = crypto.randomBytes(5).toString("hex");
      socket.join(room);

      socket.emit('changeData', (name === 'x' || name === 'o' ? null : shape), 1);
      tttLobby.push(room);
      tttPlayerCount++;
    }

    console.log(tttLobby)
  })

  socket.on('cancelSearch', () => {
    if (tttLobby.indexOf(room) > 0) {
      tttLobby.pop(tttLobby.indexOf(room));
    }
    else {
      tttLobby.shift();
    }
    tttPlayerCount--;
    socket.leave(room);
    room = null;

    console.log(tttLobby)
  });

  ///////////////////// TTT GAME CONTROL /////////////////////

  socket.on('move', (row, col) => {
    console.log(room)
    socket.to(room).emit('move', row, col);
  });
  socket.on('changeTurn', () => {
    tttIo.to(room).emit('changeTurn');
  });
  socket.on('lose', () => {
    socket.to(room).emit('lose');
  })
  socket.on('draw', () => {
    socket.to(room).emit('draw');
  })
  socket.on('playAgainReady', () => {
    socket.to(room).emit('playAgainReady');
  })
  socket.on('playAgain', () => {
    socket.to(room).emit('playAgain');
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected from >> TTT <<");
  });

});


// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/index.html'));
// });

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("public/"));
// }

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`LISTENING ON PORT: ${ PORT }`);
});
