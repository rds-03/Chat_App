import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Message } from '../types/events';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// DOM elements
const loginModal = document.getElementById('login-modal') as HTMLDivElement;
const chatContainer = document.getElementById('chat-container') as HTMLDivElement;
const usernameInput = document.getElementById('username-input') as HTMLInputElement;
const roomIdInput = document.getElementById('room-id-input') as HTMLInputElement;
const createRoomBtn = document.getElementById('create-room-btn') as HTMLButtonElement;
const joinRoomBtn = document.getElementById('join-room-btn') as HTMLButtonElement;
const modalError = document.getElementById('modal-error') as HTMLParagraphElement;
const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
const messageSection = document.getElementById('message-section') as HTMLDivElement;
const membersSection = document.getElementById('members-section') as HTMLDivElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const roomTitle = document.getElementById('room-title') as HTMLSpanElement;
const typingIndicator = document.getElementById('typing-indicator') as HTMLDivElement;

let currentUser = '';
let pendingRoomId = '';
let inChat = false;

// Typing state
const typingUsers = new Set<string>();
let isTyping = false;
let typingTimeout: ReturnType<typeof setTimeout> | null = null;

const socket: AppSocket = io();

// ── Socket listeners ──────────────────────────────────────────────────────────

socket.on('roomUsers', (users) => {
  if (!inChat) {
    inChat = true;
    enterChat(pendingRoomId);
  }
  updateMembers(users);
});

socket.on('messageToRoom', (msg) => {
  addMessage(msg, 'incoming');
  scrollToBottom();
});

socket.on('errorMessage', (error) => {
  showModalError(error);
});

socket.on('systemMessage', (text) => {
  addSystemMessage(text);
  scrollToBottom();
});

socket.on('userTyping', (username) => {
  typingUsers.add(username);
  updateTypingIndicator();
});

socket.on('userStoppedTyping', (username) => {
  typingUsers.delete(username);
  updateTypingIndicator();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function showModalError(msg: string): void {
  modalError.textContent = msg;
  modalError.style.display = 'block';
}

function clearModalError(): void {
  modalError.textContent = '';
  modalError.style.display = 'none';
}

function enterChat(roomId: string): void {
  loginModal.style.display = 'none';
  chatContainer.style.display = 'flex';
  roomTitle.textContent = roomId;
}

function updateMembers(users: string[]): void {
  membersSection.innerHTML = '';
  users.forEach((user) => {
    const tag = document.createElement('span');
    tag.classList.add('member-tag');
    tag.textContent = user;
    membersSection.appendChild(tag);
  });
}

function addMessage(msg: Message, type: 'incoming' | 'outgoing'): void {
  const div = document.createElement('div');
  div.classList.add('message', type);

  if (type === 'incoming') {
    const sender = document.createElement('h4');
    sender.textContent = msg.user;
    div.appendChild(sender);
  }

  const content = document.createElement('p');
  content.textContent = msg.message;

  const timestamp = document.createElement('span');
  timestamp.classList.add('timestamp');
  timestamp.textContent = msg.timestamp;

  div.appendChild(content);
  div.appendChild(timestamp);
  messageSection.appendChild(div);
}

function scrollToBottom(): void {
  messageSection.scrollTop = messageSection.scrollHeight;
}

function addSystemMessage(text: string): void {
  const div = document.createElement('div');
  div.classList.add('system-message');
  div.textContent = text;
  messageSection.appendChild(div);
}

function updateTypingIndicator(): void {
  if (typingUsers.size === 0) {
    typingIndicator.textContent = '';
    typingIndicator.style.display = 'none';
  } else if (typingUsers.size === 1) {
    typingIndicator.textContent = `${[...typingUsers][0]} is typing...`;
    typingIndicator.style.display = 'block';
  } else {
    typingIndicator.textContent = `${typingUsers.size} people are typing...`;
    typingIndicator.style.display = 'block';
  }
}

function sendMessage(): void {
  const message = messageInput.value.trim();
  if (!message) return;

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  addMessage({ user: currentUser, message, timestamp }, 'outgoing');
  socket.emit('message', { user: currentUser, message });

  messageInput.value = '';
  messageInput.style.height = 'auto';

  if (isTyping) {
    isTyping = false;
    if (typingTimeout) clearTimeout(typingTimeout);
    socket.emit('stopTyping');
  }

  scrollToBottom();
}

function getLoginInputs(): { username: string; roomId: string } | null {
  const username = usernameInput.value.trim();
  const roomId = roomIdInput.value.trim();

  if (!username || !roomId) {
    showModalError('Please enter both a name and a room ID.');
    return null;
  }

  return { username, roomId };
}

// ── Event listeners ───────────────────────────────────────────────────────────

createRoomBtn.addEventListener('click', () => {
  clearModalError();
  const inputs = getLoginInputs();
  if (!inputs) return;

  currentUser = inputs.username;
  pendingRoomId = inputs.roomId;
  socket.emit('createRoom', inputs.roomId, inputs.username);
});

joinRoomBtn.addEventListener('click', () => {
  clearModalError();
  const inputs = getLoginInputs();
  if (!inputs) return;

  currentUser = inputs.username;
  pendingRoomId = inputs.roomId;
  socket.emit('joinRoom', inputs.roomId, inputs.username);
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = `${this.scrollHeight}px`;

  if (!inChat) return;

  if (!isTyping) {
    isTyping = true;
    socket.emit('typing');
  }

  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    socket.emit('stopTyping');
  }, 1500);
});
