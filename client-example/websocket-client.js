/**
 * Example client-side code for connecting to the DrunkDial WebSocket server
 * This demonstrates how to establish a connection, authenticate, and handle events
 *
 * Requires:
 * - socket.io-client: npm install socket.io-client
 */

// Import socket.io client
const io = require("socket.io-client");

class DrunkDialClient {
  constructor(serverUrl, authToken) {
    this.serverUrl = serverUrl || "http://localhost";
    this.authToken = authToken;
    this.socket = null;
    this.connected = false;
    this.callInProgress = false;
    this.peerConnection = null; // WebRTC connection
  }

  /**
   * Connect to the WebSocket server
   * Uses the same JWT token from user authentication
   */
  connect() {
    console.log("Connecting to WebSocket server...");

    if (!this.authToken) {
      console.error(
        "Authentication token is required for WebSocket connection"
      );
      this.onError(new Error("Authentication token is required"));
      return;
    }

    // Connect to the server with authentication using the JWT from user auth
    this.socket = io(this.serverUrl, {
      path: "/socket.io",
      auth: {
        token: this.authToken, // This should be the JWT token from user authentication
      },
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the socket connection
   */
  setupEventListeners() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      this.connected = true;

      // Trigger connected event for the client
      this.onConnected();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`Disconnected from WebSocket server: ${reason}`);
      this.connected = false;

      // Trigger disconnected event for the client
      this.onDisconnected(reason);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
      this.onError(error);
    });

    // Queue management events
    this.socket.on("queue_joined", (data) => {
      console.log("Joined the queue:", data);
      this.onQueueJoined(data);
    });

    this.socket.on("queue_left", (data) => {
      console.log("Left the queue:", data);
      this.onQueueLeft(data);
    });

    this.socket.on("queue_position_update", (data) => {
      console.log("Queue position updated:", data);
      this.onQueuePositionUpdate(data);
    });

    // Call events
    this.socket.on("call_matched", (data) => {
      console.log("Matched with user:", data);
      this.callInProgress = true;
      this.onCallMatched(data);

      // Initialize WebRTC connection
      this.initializeWebRTC(data);
    });

    this.socket.on("call_ended", (data) => {
      console.log("Call ended:", data);
      this.callInProgress = false;
      this.onCallEnded(data);

      // Clean up WebRTC connection
      this.cleanupWebRTC();
    });

    // WebRTC signaling events
    this.socket.on("offer", (data) => {
      console.log("Received WebRTC offer");
      this.handleWebRTCOffer(data);
    });

    this.socket.on("answer", (data) => {
      console.log("Received WebRTC answer");
      this.handleWebRTCAnswer(data);
    });

    this.socket.on("ice_candidate", (data) => {
      console.log("Received ICE candidate");
      this.handleICECandidate(data);
    });
  }

  /**
   * Join the call queue
   */
  joinQueue(preferences = {}) {
    if (!this.connected) {
      console.error("Cannot join queue: not connected");
      return false;
    }

    const queueData = {
      mood: preferences.mood || "neutral",
      gender_preference: preferences.genderPreference || "any",
    };

    this.socket.emit("join_queue", queueData);
    return true;
  }

  /**
   * Leave the call queue
   */
  leaveQueue() {
    if (!this.connected) {
      console.error("Cannot leave queue: not connected");
      return false;
    }

    this.socket.emit("leave_queue");
    return true;
  }

  /**
   * End the current call
   */
  endCall(data = {}) {
    if (!this.callInProgress) {
      console.error("Cannot end call: no call in progress");
      return false;
    }

    const callData = {
      targetUserId: data.targetUserId,
      callId: data.callId,
      rating: data.rating,
      feedback: data.feedback,
    };

    this.socket.emit("end_call", callData);
    this.callInProgress = false;
    return true;
  }

  /**
   * Initialize WebRTC connection
   */
  initializeWebRTC(data) {
    // WebRTC setup code would go here
    // This is a simplified placeholder
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN servers for production
      ],
    });

    // Set up event handlers for the peer connection
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("ice_candidate", {
          targetUserId: data.targetUserId,
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      // Handle remote audio track
      this.onRemoteTrackReceived(event.streams[0]);
    };

    // Add local audio track
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        stream.getTracks().forEach((track) => {
          this.peerConnection.addTrack(track, stream);
        });
        this.onLocalStreamReady(stream);
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
        this.onError(error);
      });

    // Create and send offer if we're the caller
    if (data.isCaller) {
      this.peerConnection
        .createOffer()
        .then((offer) => this.peerConnection.setLocalDescription(offer))
        .then(() => {
          this.socket.emit("offer", {
            targetUserId: data.targetUserId,
            sdp: this.peerConnection.localDescription,
          });
        })
        .catch((error) => {
          console.error("Error creating offer:", error);
          this.onError(error);
        });
    }
  }

  /**
   * Handle incoming WebRTC offer
   */
  handleWebRTCOffer(data) {
    this.peerConnection
      .setRemoteDescription(new RTCSessionDescription(data.sdp))
      .then(() => this.peerConnection.createAnswer())
      .then((answer) => this.peerConnection.setLocalDescription(answer))
      .then(() => {
        this.socket.emit("answer", {
          targetUserId: data.from,
          sdp: this.peerConnection.localDescription,
        });
      })
      .catch((error) => {
        console.error("Error handling offer:", error);
        this.onError(error);
      });
  }

  /**
   * Handle incoming WebRTC answer
   */
  handleWebRTCAnswer(data) {
    this.peerConnection
      .setRemoteDescription(new RTCSessionDescription(data.sdp))
      .catch((error) => {
        console.error("Error handling answer:", error);
        this.onError(error);
      });
  }

  /**
   * Handle incoming ICE candidate
   */
  handleICECandidate(data) {
    this.peerConnection
      .addIceCandidate(new RTCIceCandidate(data.candidate))
      .catch((error) => {
        console.error("Error adding ICE candidate:", error);
        this.onError(error);
      });
  }

  /**
   * Clean up WebRTC connection
   */
  cleanupWebRTC() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Event handlers - Override these in your application
  onConnected() {}
  onDisconnected(reason) {}
  onError(error) {}
  onQueueJoined(data) {}
  onQueueLeft(data) {}
  onQueuePositionUpdate(data) {}
  onCallMatched(data) {}
  onCallEnded(data) {}
  onLocalStreamReady(stream) {}
  onRemoteTrackReceived(stream) {}

  // Example usage section update
  static getAuthExample() {
    return `
// In a real application, you would get the JWT token from your authentication process
// Example of using the JWT token from login:

// Login function
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.token) {
      // Save the JWT token
      localStorage.setItem('authToken', data.token);
      
      // Initialize the WebSocket connection with the same token
      const socketClient = new DrunkDialClient('http://localhost', data.token);
      socketClient.connect();
      
      // Now the WebSocket connection is authenticated with the same JWT
      return socketClient;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// If you already have a JWT token stored (e.g., from a previous login)
function reconnectSocket() {
  const savedToken = localStorage.getItem('authToken');
  if (savedToken) {
    const socketClient = new DrunkDialClient('http://localhost', savedToken);
    socketClient.connect();
    return socketClient;
  }
  return null;
}`;
  }
}

// Example usage:
/*
const client = new DrunkDialClient('http://localhost', 'your-auth-token');

// Override event handlers
client.onConnected = () => {
  console.log('Connected to DrunkDial server');
  
  // Join the queue with preferences
  client.joinQueue({
    mood: 'happy',
    genderPreference: 'any'
  });
};

client.onCallMatched = (data) => {
  console.log('You have been matched with someone!', data);
  // UI updates to show call screen
};

// Connect to the server
client.connect();
*/

module.exports = DrunkDialClient;
