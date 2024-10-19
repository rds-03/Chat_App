const express = require("express");
const app = express();
const port = 3000;
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected..");

  socket.on("createRoom", (roomId, username) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
      rooms[roomId].push(username);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;

      io.to(roomId).emit("roomUsers", rooms[roomId]);
      console.log(`${username} created ${roomId}`);
    }
  });

  socket.on("joinRoom", (roomId, username) => {
    if (rooms[roomId]) {
      rooms[roomId].push(username);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;

      io.to(roomId).emit("roomUsers", rooms[roomId]);
      console.log(`${username} joined room ${roomId}`);
    } else {
      socket.emit("errorMessage", "Room not found.");
    }
  });

  socket.on("message", (msg) => {
    const roomId = socket.roomId;
    if (roomId) {
      socket.broadcast.to(roomId).emit("messageToRoom", {
        // Corrected event name
        user: socket.username,
        message: msg.message, // Fixed to send message content
      });
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId) {
      rooms[roomId] = rooms[roomId].filter((user) => user !== socket.username);
      io.to(roomId).emit("roomUsers", rooms[roomId]);
      console.log(`${socket.username} disconnected from ${roomId}`);
    }
  });
});

http.listen(port, () => console.log(`Example app listening on port ${port}!`));
