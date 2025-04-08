// Simple test script for WebSocket calling functionality
const { io } = require('socket.io-client');
const readline = require('readline');

// User credentials and tokens
const users = [
  {
    id: '3ae982e6-8766-47b5-811f-a3478309f38a',
    username: 'Friend76122',
    email: 'testuser1@example.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNhZTk4MmU2LTg3NjYtNDdiNS04MTFmLWEzNDc4MzA5ZjM4YSIsImlhdCI6MTc0MzA4NDcyNiwiZXhwIjoxNzQzMTcxMTI2fQ.pVwqFRTT93tNgeUFYynviRjojTu3-PCPaisvOLrV5lo'
  },
  {
    id: '78db33fb-c54e-4860-aaa9-33134cc671e6',
    username: 'Member53165',
    email: 'testuser2@example.com',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc4ZGIzM2ZiLWM1NGUtNDg2MC1hYWE5LTMzMTM0Y2M2NzFlNiIsImlhdCI6MTc0MzA4NDczNSwiZXhwIjoxNzQzMTcxMTM1fQ.1C3vH60rkA-xUHrw6qhV0TH0Mk_V_kSGW609RTIO30U'
  }
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to WebSocket server as both users
const sockets = users.map(user => {
  const socket = io('http://localhost:3000', {
    auth: {
      token: user.token
    }
  });

  // Set up event listeners
  socket.on('connect', () => {
    console.log(`[${user.username}] Connected to WebSocket server`);
  });

  socket.on('connect_error', (error) => {
    console.error(`[${user.username}] Connection error:`, error.message);
  });

  socket.on('incoming_call', (data) => {
    console.log(`[${user.username}] Incoming call from ${data.caller.username} (${data.caller.id})`);
    console.log(`[${user.username}] Call ID: ${data.callId}`);
    
    // Automatically accept the call after a short delay
    setTimeout(() => {
      console.log(`[${user.username}] Accepting call ${data.callId}`);
      socket.emit('accept_call', { callId: data.callId });
    }, 2000);
  });

  socket.on('call_initiated', (data) => {
    console.log(`[${user.username}] Call initiated to ${data.receiver.username} (${data.receiver.id})`);
    console.log(`[${user.username}] Call ID: ${data.callId}`);
  });

  socket.on('call_accepted', (data) => {
    console.log(`[${user.username}] Call accepted by ${data.receiver.username} (${data.receiver.id})`);
    console.log(`[${user.username}] Call ID: ${data.callId}`);
    
    // End the call after a short delay
    setTimeout(() => {
      console.log(`[${user.username}] Ending call ${data.callId}`);
      socket.emit('end_call', { callId: data.callId });
    }, 5000);
  });

  socket.on('call_connected', (data) => {
    console.log(`[${user.username}] Call connected with ${data.caller.username} (${data.caller.id})`);
    console.log(`[${user.username}] Call ID: ${data.callId}`);
  });

  socket.on('call_rejected', (data) => {
    console.log(`[${user.username}] Call rejected by ${data.receiver.username} (${data.receiver.id})`);
    console.log(`[${user.username}] Call ID: ${data.callId}`);
  });

  socket.on('call_ended', (data) => {
    console.log(`[${user.username}] Call ended`);
    console.log(`[${user.username}] Call ID: ${data.callId}`);
    console.log(`[${user.username}] Duration: ${data.duration || 'N/A'} seconds`);
    
    // Rate the call after it ends
    setTimeout(() => {
      const rating = Math.floor(Math.random() * 5) + 1; // Random rating between 1 and 5
      console.log(`[${user.username}] Rating call ${data.callId} with ${rating} stars`);
      socket.emit('rate_call', { callId: data.callId, rating });
    }, 1000);
  });

  socket.on('rating_submitted', (data) => {
    console.log(`[${user.username}] Rating submitted for call ${data.callId}`);
  });

  socket.on('call_error', (data) => {
    console.error(`[${user.username}] Call error:`, data.message);
  });

  socket.on('rating_error', (data) => {
    console.error(`[${user.username}] Rating error:`, data.message);
  });

  socket.on('user_status_change', (data) => {
    console.log(`[${user.username}] User ${data.userId} is now ${data.status}`);
  });

  return {
    user,
    socket
  };
});

// Function to initiate a call
function initiateCall(callerIndex, receiverIndex) {
  const caller = sockets[callerIndex];
  const receiver = sockets[receiverIndex];
  
  console.log(`\nInitiating call from ${caller.user.username} to ${receiver.user.username}`);
  caller.socket.emit('initiate_call', { receiverId: receiver.user.id });
}

// Main menu
function showMenu() {
  console.log('\n=== WebSocket Call Test ===');
  console.log('1. Initiate call from User 1 to User 2');
  console.log('2. Initiate call from User 2 to User 1');
  console.log('3. Exit');
  
  rl.question('Select an option: ', (answer) => {
    switch (answer) {
      case '1':
        initiateCall(0, 1);
        setTimeout(showMenu, 10000);
        break;
      case '2':
        initiateCall(1, 0);
        setTimeout(showMenu, 10000);
        break;
      case '3':
        console.log('Exiting...');
        sockets.forEach(s => s.socket.disconnect());
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('Invalid option');
        showMenu();
        break;
    }
  });
}

// Start the test
console.log('Connecting to WebSocket server...');
setTimeout(showMenu, 2000);
