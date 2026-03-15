import { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  Message,
} from '../../types/events';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const rooms: Record<string, string[]> = {};

export function registerHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on('createRoom', (roomId, username) => {
    if (rooms[roomId]) {
      socket.emit('errorMessage', 'Room already exists. Try joining instead.');
      return;
    }

    rooms[roomId] = [username];
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.join(roomId);

    io.to(roomId).emit('roomUsers', rooms[roomId]);
    io.to(roomId).emit('systemMessage', `${username} created the room`);
    console.log(`[room] "${username}" created room "${roomId}"`);
  });

  socket.on('joinRoom', (roomId, username) => {
    if (!rooms[roomId]) {
      socket.emit('errorMessage', 'Room not found. Create it instead.');
      return;
    }

    if (rooms[roomId].includes(username)) {
      socket.emit('errorMessage', 'Username already taken in this room. Try a different name.');
      return;
    }

    rooms[roomId].push(username);
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.join(roomId);

    io.to(roomId).emit('roomUsers', rooms[roomId]);
    io.to(roomId).emit('systemMessage', `${username} joined the room`);
    console.log(`[room] "${username}" joined room "${roomId}"`);
  });

  socket.on('message', (msg) => {
    const { roomId, username } = socket.data;
    if (!roomId || !username) return;

    const fullMessage: Message = {
      ...msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.broadcast.to(roomId).emit('messageToRoom', fullMessage);
  });

  socket.on('rejoinRoom', (roomId, username) => {
    if (!rooms[roomId]) rooms[roomId] = [];
    if (!rooms[roomId].includes(username)) rooms[roomId].push(username);

    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.join(roomId);

    io.to(roomId).emit('roomUsers', rooms[roomId]);
    io.to(roomId).emit('systemMessage', `${username} reconnected`);
    console.log(`[room] "${username}" rejoined room "${roomId}"`);
  });

  socket.on('typing', () => {
    const { roomId, username } = socket.data;
    if (!roomId || !username) return;
    socket.broadcast.to(roomId).emit('userTyping', username);
  });

  socket.on('stopTyping', () => {
    const { roomId, username } = socket.data;
    if (!roomId || !username) return;
    socket.broadcast.to(roomId).emit('userStoppedTyping', username);
  });

  socket.on('disconnect', () => {
    const { roomId, username } = socket.data;
    if (!roomId || !username || !rooms[roomId]) return;

    rooms[roomId] = rooms[roomId].filter((u) => u !== username);
    io.to(roomId).emit('roomUsers', rooms[roomId]);

    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
      console.log(`[room] "${roomId}" deleted (empty)`);
    } else {
      io.to(roomId).emit('systemMessage', `${username} left the room`);
      console.log(`[room] "${username}" left room "${roomId}"`);
    }
  });
}
