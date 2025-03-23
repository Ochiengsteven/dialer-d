/**
 * Example React component demonstrating how to integrate
 * authentication and WebSocket connections in a React app.
 *
 * This is for demonstration purposes only and should be adapted
 * to your specific application structure.
 */

import React, { useEffect, useState, useContext, createContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Import our WebSocket helper
const WebSocketAuthHelper = require("./websocket-auth-helper");

// Create a WebSocket context
const WebSocketContext = createContext(null);

/**
 * Provider component for WebSocket context
 */
export const WebSocketProvider = ({ children }) => {
  const [wsHelper, setWsHelper] = useState(null);
  const [socketClient, setSocketClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  // Initialize WebSocket helper
  useEffect(() => {
    const helper = new WebSocketAuthHelper();
    setWsHelper(helper);

    // Try to reconnect using stored token
    const client = helper.reconnect();
    if (client) {
      setSocketClient(client);

      // Override default event handlers
      client.onConnected = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      client.onDisconnected = (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          // Token might be expired, handle reconnection or logout
          handleTokenRefresh();
        }
      };
    }

    // Cleanup on unmount
    return () => {
      if (helper && helper.socketClient) {
        helper.socketClient.disconnect();
      }
    };
  }, []);

  /**
   * Handle user login
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token, refreshToken, user } = response.data;

      // Store tokens
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refreshToken);

      // Connect WebSocket using the token
      if (wsHelper) {
        const client = wsHelper.initFromLogin(token);
        setSocketClient(client);

        // Setup client event handlers
        if (client) {
          client.onConnected = () => {
            setIsConnected(true);
            navigate("/dashboard"); // Redirect after successful login
          };
        }
      }

      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  /**
   * Handle token refresh
   */
  const handleTokenRefresh = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        // No refresh token, redirect to login
        logout();
        return;
      }

      const response = await axios.post("/api/auth/refresh-token", {
        refreshToken,
      });
      const { token } = response.data;

      if (token && wsHelper) {
        localStorage.setItem("authToken", token);
        const client = wsHelper.initFromLogin(token);
        setSocketClient(client);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout(); // Force logout on refresh failure
    }
  };

  /**
   * Handle user logout
   */
  const logout = () => {
    if (wsHelper) {
      wsHelper.handleLogout();
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    setSocketClient(null);
    setIsConnected(false);

    navigate("/login");
  };

  /**
   * Join the queue with preferences
   */
  const joinQueue = (preferences = {}) => {
    if (socketClient && isConnected) {
      return socketClient.joinQueue(preferences);
    }
    return false;
  };

  /**
   * Leave the queue
   */
  const leaveQueue = () => {
    if (socketClient && isConnected) {
      return socketClient.leaveQueue();
    }
    return false;
  };

  // Context value
  const value = {
    isConnected,
    login,
    logout,
    joinQueue,
    leaveQueue,
    socketClient, // Expose for advanced use cases
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Custom hook to use WebSocket context
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

/**
 * Example Queue component using the WebSocket context
 */
export const QueueComponent = () => {
  const { isConnected, joinQueue, leaveQueue } = useWebSocket();
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [mood, setMood] = useState("neutral");
  const [genderPreference, setGenderPreference] = useState("any");

  // Join the queue
  const handleJoinQueue = () => {
    if (isConnected && !inQueue) {
      const success = joinQueue({
        mood,
        genderPreference,
      });

      if (success) {
        setInQueue(true);
      }
    }
  };

  // Leave the queue
  const handleLeaveQueue = () => {
    if (isConnected && inQueue) {
      const success = leaveQueue();

      if (success) {
        setInQueue(false);
        setQueuePosition(null);
      }
    }
  };

  // Example UI
  return (
    <div className="queue-container">
      <h2>Find a Call</h2>

      {!isConnected && (
        <div className="connection-status">Connecting to server...</div>
      )}

      {isConnected && !inQueue && (
        <div className="queue-form">
          <div className="form-group">
            <label htmlFor="mood">How are you feeling?</label>
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="excited">Excited</option>
              <option value="bored">Bored</option>
              <option value="lonely">Lonely</option>
              <option value="drunk">Drunk</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="genderPref">I'd like to talk to:</label>
            <select
              id="genderPref"
              value={genderPreference}
              onChange={(e) => setGenderPreference(e.target.value)}
            >
              <option value="any">Anyone</option>
              <option value="male">Men</option>
              <option value="female">Women</option>
            </select>
          </div>

          <button className="join-queue-btn" onClick={handleJoinQueue}>
            Find Someone to Talk To
          </button>
        </div>
      )}

      {isConnected && inQueue && (
        <div className="in-queue">
          <div className="queue-status">
            <h3>Looking for someone to talk to...</h3>
            {queuePosition && <p>You are #{queuePosition} in line</p>}
            <div className="loading-animation">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>

          <button className="leave-queue-btn" onClick={handleLeaveQueue}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Example Call component using the WebSocket context
 */
export const CallComponent = () => {
  const { socketClient } = useWebSocket();
  const [callActive, setCallActive] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Setup WebRTC event handlers
  useEffect(() => {
    if (socketClient) {
      socketClient.onCallMatched = (data) => {
        setCallActive(true);
        // WebRTC connection is handled internally by the client
      };

      socketClient.onCallEnded = () => {
        setCallActive(false);
        setRemoteStream(null);
      };

      socketClient.onLocalStreamReady = (stream) => {
        setLocalStream(stream);
      };

      socketClient.onRemoteTrackReceived = (stream) => {
        setRemoteStream(stream);
      };
    }
  }, [socketClient]);

  // End call handler
  const handleEndCall = () => {
    if (socketClient && callActive) {
      socketClient.endCall();
      setCallActive(false);
      setRemoteStream(null);
    }
  };

  return (
    <div className="call-container">
      {callActive ? (
        <div className="active-call">
          <div className="call-timer">00:00</div>

          <div className="streams-container">
            {remoteStream && (
              <audio
                ref={(audio) => {
                  if (audio) {
                    audio.srcObject = remoteStream;
                  }
                }}
                autoPlay
              />
            )}

            {localStream && (
              <audio
                ref={(audio) => {
                  if (audio) {
                    audio.srcObject = localStream;
                    audio.muted = true; // Mute local audio to prevent feedback
                  }
                }}
                autoPlay
              />
            )}
          </div>

          <div className="call-controls">
            <button
              className="mute-btn"
              onClick={() => {
                if (localStream) {
                  const audioTrack = localStream.getAudioTracks()[0];
                  audioTrack.enabled = !audioTrack.enabled;
                }
              }}
            >
              Mute
            </button>

            <button className="end-call-btn" onClick={handleEndCall}>
              End Call
            </button>
          </div>
        </div>
      ) : (
        <div className="no-call">
          <p>Join the queue to get matched with someone to talk to.</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example App component showing how to use the WebSocket provider
 */
const App = () => {
  return (
    <WebSocketProvider>
      <div className="app">
        <header>
          <h1>DrunkDial</h1>
        </header>

        <main>
          <QueueComponent />
          <CallComponent />
        </main>
      </div>
    </WebSocketProvider>
  );
};

export default App;
