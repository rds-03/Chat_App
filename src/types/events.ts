export interface Message {
  user: string;
  message: string;
  timestamp: string;
}

export interface ServerToClientEvents {
  messageToRoom: (msg: Message) => void;
  roomUsers: (users: string[]) => void;
  errorMessage: (error: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (roomId: string, username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
  message: (msg: Pick<Message, 'user' | 'message'>) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  username: string;
  roomId: string;
}
