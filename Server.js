const express = require("express");
const app = express();
const port = 3000;
const http = require("http").createServer(app);
// const cors = require("cors");
// app.use(cors);
const io = require("socket.io")(http);
app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

//socket
io.on("connection", (socket) => {
  console.log("connected..");
  socket.on("message", (msg) => {
    socket.broadcast.emit("messagetoAll", msg);
  });
  socket.on("disconnect", (socket) => {
    console.log("user disconected");
  });
});

http.listen(port, () => console.log(`Example app listening on port ${port}!`));
