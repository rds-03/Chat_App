export interface Message {
  user: string;
  message: string;
  timestamp: string;
}

export interface ServerToClientEvents {
  messageToRoom: (msg: Message) => void;
  roomUsers: (users: string[]) => void;
  errorMessage: (error: string) => void;
  userTyping: (username: string) => void;
  userStoppedTyping: (username: string) => void;
  systemMessage: (text: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (roomId: string, username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
  message: (msg: Pick<Message, 'user' | 'message'>) => void;
  typing: () => void;
  stopTyping: () => void;
}

export interface InterServerEvents {}

export interface SocketData {
  username: string;
  roomId: string;
}
