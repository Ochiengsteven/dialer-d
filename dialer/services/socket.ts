import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// WebSocket server URL
// Use the same IP address as the API service
const SOCKET_URL = 'http://192.168.100.55';

// Event emitter for handling WebSocket events across the app
export const socketEvents = new EventEmitter();

// Socket.IO instance
let socket: Socket | null = null;

// Connect to WebSocket server
export const connectSocket = async (): Promise<Socket | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.error('No token found, cannot connect to WebSocket server');
      return null;
    }
    
    // Initialize Socket.IO connection
    socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socketEvents.emit('connected');
    });
    
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      socketEvents.emit('connect_error', error.message);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      socketEvents.emit('disconnected', reason);
    });
    
    // Call event handlers
    socket.on('incoming_call', (data) => {
      console.log('Incoming call:', data);
      socketEvents.emit('incoming_call', data);
    });
    
    socket.on('call_initiated', (data) => {
      console.log('Call initiated:', data);
      socketEvents.emit('call_initiated', data);
    });
    
    socket.on('call_accepted', (data) => {
      console.log('Call accepted:', data);
      socketEvents.emit('call_accepted', data);
    });
    
    socket.on('call_connected', (data) => {
      console.log('Call connected:', data);
      socketEvents.emit('call_connected', data);
    });
    
    socket.on('call_rejected', (data) => {
      console.log('Call rejected:', data);
      socketEvents.emit('call_rejected', data);
    });
    
    socket.on('call_ended', (data) => {
      console.log('Call ended:', data);
      socketEvents.emit('call_ended', data);
    });
    
    socket.on('call_error', (data) => {
      console.error('Call error:', data.message);
      socketEvents.emit('call_error', data.message);
    });
    
    socket.on('rating_submitted', (data) => {
      console.log('Rating submitted:', data);
      socketEvents.emit('rating_submitted', data);
    });
    
    socket.on('rating_error', (data) => {
      console.error('Rating error:', data.message);
      socketEvents.emit('rating_error', data.message);
    });
    
    socket.on('user_status_change', (data) => {
      console.log('User status change:', data);
      socketEvents.emit('user_status_change', data);
    });
    
    socket.on('signal', (data) => {
      console.log('WebRTC signal received');
      socketEvents.emit('signal', data);
    });
    
    return socket;
  } catch (error) {
    console.error('Error connecting to WebSocket server:', error);
    return null;
  }
};

// Disconnect from WebSocket server
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Disconnected from WebSocket server');
  }
};

// Call functions
export const callFunctions = {
  // Initiate a call to another user
  initiateCall: (receiverId: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('initiate_call', { receiverId });
    return true;
  },
  
  // Accept an incoming call
  acceptCall: (callId: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('accept_call', { callId });
    return true;
  },
  
  // Reject an incoming call
  rejectCall: (callId: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('reject_call', { callId });
    return true;
  },
  
  // End an active call
  endCall: (callId: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return false;
    }
    
    try {
      socket.emit('end_call', { callId });
      return true;
    } catch (error) {
      console.warn('Error ending call:', error);
      // Return true anyway so the UI can clean up
      return true;
    }
  },
  
  // Rate a completed call
  rateCall: (callId: string, rating: number) => {
    if (!socket) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('rate_call', { callId, rating });
    return true;
  },
  
  // Send WebRTC signaling data
  sendSignal: (callId: string, signal: any, to: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('signal', { callId, signal, to });
    return true;
  },
};

export default {
  connectSocket,
  disconnectSocket,
  callFunctions,
  socketEvents,
};
