// src/services/socket.service.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Call = require('../models/call.model');
const { v4: uuidv4 } = require('uuid');

// Store active users and their socket connections
const activeUsers = new Map();
// Store active calls
const activeCalls = new Map();

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const initializeSocketServer = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*', // In production, restrict this to your frontend domain
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      // Find user by ID
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.user = {
        id: user.id,
        username: user.username,
        gender: user.gender
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user.id})`);
    
    // Add user to active users map
    activeUsers.set(socket.user.id, {
      socket: socket,
      user: socket.user,
      status: 'online'
    });
    
    // Update user's online status
    socket.broadcast.emit('user_status_change', {
      userId: socket.user.id,
      status: 'online'
    });
    
    // Handle call initiation
    socket.on('initiate_call', async (data) => {
      try {
        const { receiverId } = data;
        
        // Check if receiver exists and is online
        const receiver = activeUsers.get(receiverId);
        
        if (!receiver) {
          return socket.emit('call_error', {
            message: 'User is not online or does not exist'
          });
        }
        
        // Generate call ID
        const callId = uuidv4();
        
        // Create call record in database
        const call = await Call.create({
          id: callId,
          caller_id: socket.user.id,
          receiver_id: receiverId,
          status: 'pending',
          start_time: new Date()
        });
        
        // Store call in active calls map
        activeCalls.set(callId, {
          id: callId,
          callerId: socket.user.id,
          receiverId: receiverId,
          status: 'pending',
          startTime: new Date(),
          signalData: {}
        });
        
        // Send call request to receiver
        receiver.socket.emit('incoming_call', {
          callId: callId,
          caller: {
            id: socket.user.id,
            username: socket.user.username,
            gender: socket.user.gender
          }
        });
        
        // Notify caller that call request has been sent
        socket.emit('call_initiated', {
          callId: callId,
          receiver: {
            id: receiverId,
            username: receiver.user.username,
            gender: receiver.user.gender
          }
        });
      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('call_error', {
          message: 'Failed to initiate call'
        });
      }
    });
    
    // Handle call acceptance
    socket.on('accept_call', async (data) => {
      try {
        const { callId } = data;
        
        // Check if call exists
        const call = activeCalls.get(callId);
        
        if (!call) {
          return socket.emit('call_error', {
            message: 'Call does not exist or has ended'
          });
        }
        
        // Update call status
        call.status = 'active';
        activeCalls.set(callId, call);
        
        // Update call record in database
        await Call.update(
          { status: 'active' },
          { where: { id: callId } }
        );
        
        // Get caller socket
        const caller = activeUsers.get(call.callerId);
        
        if (!caller) {
          return socket.emit('call_error', {
            message: 'Caller has disconnected'
          });
        }
        
        // Notify caller that call has been accepted
        caller.socket.emit('call_accepted', {
          callId: callId,
          receiver: {
            id: socket.user.id,
            username: socket.user.username
          }
        });
        
        // Notify receiver that call is now active
        socket.emit('call_connected', {
          callId: callId,
          caller: {
            id: caller.user.id,
            username: caller.user.username
          }
        });
      } catch (error) {
        console.error('Error accepting call:', error);
        socket.emit('call_error', {
          message: 'Failed to accept call'
        });
      }
    });
    
    // Handle call rejection
    socket.on('reject_call', async (data) => {
      try {
        const { callId } = data;
        
        // Check if call exists
        const call = activeCalls.get(callId);
        
        if (!call) {
          return socket.emit('call_error', {
            message: 'Call does not exist or has ended'
          });
        }
        
        // Update call record in database
        await Call.update(
          { 
            status: 'rejected',
            end_time: new Date()
          },
          { where: { id: callId } }
        );
        
        // Get caller socket
        const caller = activeUsers.get(call.callerId);
        
        if (caller) {
          // Notify caller that call has been rejected
          caller.socket.emit('call_rejected', {
            callId: callId,
            receiver: {
              id: socket.user.id,
              username: socket.user.username
            }
          });
        }
        
        // Remove call from active calls
        activeCalls.delete(callId);
        
        // Confirm rejection to receiver
        socket.emit('call_ended', { callId });
      } catch (error) {
        console.error('Error rejecting call:', error);
        socket.emit('call_error', {
          message: 'Failed to reject call'
        });
      }
    });
    
    // Handle WebRTC signaling
    socket.on('signal', (data) => {
      try {
        const { callId, signal, to } = data;
        
        // Check if call exists and is active
        const call = activeCalls.get(callId);
        
        if (!call || call.status !== 'active') {
          return socket.emit('call_error', {
            message: 'Call does not exist or is not active'
          });
        }
        
        // Get recipient socket
        const recipient = activeUsers.get(to);
        
        if (!recipient) {
          return socket.emit('call_error', {
            message: 'Recipient has disconnected'
          });
        }
        
        // Forward signal to recipient
        recipient.socket.emit('signal', {
          callId,
          signal,
          from: socket.user.id
        });
      } catch (error) {
        console.error('Error handling signal:', error);
        socket.emit('call_error', {
          message: 'Failed to relay signal'
        });
      }
    });
    
    // Handle call end
    socket.on('end_call', async (data) => {
      try {
        const { callId } = data;
        
        // Check if call exists
        const call = activeCalls.get(callId);
        
        if (!call) {
          return socket.emit('call_error', {
            message: 'Call does not exist or has already ended'
          });
        }
        
        // Calculate call duration
        const endTime = new Date();
        const startTime = new Date(call.startTime);
        const durationInSeconds = Math.floor((endTime - startTime) / 1000);
        
        // Update call record in database
        await Call.update(
          { 
            status: 'completed',
            end_time: endTime,
            duration: durationInSeconds
          },
          { where: { id: callId } }
        );
        
        // Determine other participant
        const otherParticipantId = call.callerId === socket.user.id ? call.receiverId : call.callerId;
        const otherParticipant = activeUsers.get(otherParticipantId);
        
        if (otherParticipant) {
          // Notify other participant that call has ended
          otherParticipant.socket.emit('call_ended', {
            callId,
            duration: durationInSeconds
          });
        }
        
        // Confirm end call to initiator
        socket.emit('call_ended', {
          callId,
          duration: durationInSeconds
        });
        
        // Remove call from active calls
        activeCalls.delete(callId);
      } catch (error) {
        console.error('Error ending call:', error);
        socket.emit('call_error', {
          message: 'Failed to end call'
        });
      }
    });
    
    // Handle call rating
    socket.on('rate_call', async (data) => {
      try {
        const { callId, rating } = data;
        
        // Validate rating
        if (rating < 1 || rating > 5) {
          return socket.emit('rating_error', {
            message: 'Rating must be between 1 and 5'
          });
        }
        
        // Find call in database
        const call = await Call.findByPk(callId);
        
        if (!call) {
          return socket.emit('rating_error', {
            message: 'Call not found'
          });
        }
        
        // Determine if user is caller or receiver
        if (call.caller_id === socket.user.id) {
          await call.update({ caller_rating: rating });
        } else if (call.receiver_id === socket.user.id) {
          await call.update({ receiver_rating: rating });
        } else {
          return socket.emit('rating_error', {
            message: 'You were not a participant in this call'
          });
        }
        
        // Confirm rating submission
        socket.emit('rating_submitted', { callId });
      } catch (error) {
        console.error('Error rating call:', error);
        socket.emit('rating_error', {
          message: 'Failed to submit rating'
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.user.id})`);
      
      // Remove user from active users
      activeUsers.delete(socket.user.id);
      
      // Update user's online status
      io.emit('user_status_change', {
        userId: socket.user.id,
        status: 'offline'
      });
      
      // End any active calls involving this user
      for (const [callId, call] of activeCalls.entries()) {
        if (call.callerId === socket.user.id || call.receiverId === socket.user.id) {
          // Calculate call duration
          const endTime = new Date();
          const startTime = new Date(call.startTime);
          const durationInSeconds = Math.floor((endTime - startTime) / 1000);
          
          // Update call record in database
          await Call.update(
            { 
              status: call.status === 'pending' ? 'missed' : 'completed',
              end_time: endTime,
              duration: durationInSeconds
            },
            { where: { id: callId } }
          );
          
          // Determine other participant
          const otherParticipantId = call.callerId === socket.user.id ? call.receiverId : call.callerId;
          const otherParticipant = activeUsers.get(otherParticipantId);
          
          if (otherParticipant) {
            // Notify other participant that call has ended
            otherParticipant.socket.emit('call_ended', {
              callId,
              reason: 'participant_disconnected'
            });
          }
          
          // Remove call from active calls
          activeCalls.delete(callId);
        }
      }
    });
  });

  return io;
};

module.exports = {
  initializeSocketServer
};
