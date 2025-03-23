/**
 * Helper functions to integrate authentication with WebSockets
 * This demonstrates how to seamlessly use the same JWT token
 * from user authentication for WebSocket connections
 *
 * This file is for demonstration purposes and should be adapted
 * to your specific frontend framework (React, Vue, Angular, etc.)
 */

const DrunkDialClient = require("./websocket-client");

class WebSocketAuthHelper {
  constructor() {
    this.socketClient = null;
    this.authToken = localStorage.getItem("authToken");
  }

  /**
   * Initialize WebSocket connection after successful login
   * @param {string} token - JWT token received from login
   * @returns {DrunkDialClient} - The WebSocket client instance
   */
  initFromLogin(token) {
    if (!token) {
      console.error("No token provided");
      return null;
    }

    // Save the token for future use
    localStorage.setItem("authToken", token);
    this.authToken = token;

    // Initialize and connect the WebSocket client
    this.socketClient = new DrunkDialClient("http://localhost", token);
    this.socketClient.connect();

    this.setupSocketEventHandlers();
    return this.socketClient;
  }

  /**
   * Reconnect to WebSocket using stored token
   * @returns {DrunkDialClient|null} - WebSocket client or null if no token
   */
  reconnect() {
    if (!this.authToken) {
      console.warn("No auth token available, cannot connect");
      return null;
    }

    this.socketClient = new DrunkDialClient("http://localhost", this.authToken);
    this.socketClient.connect();

    this.setupSocketEventHandlers();
    return this.socketClient;
  }

  /**
   * Handle token expiration or invalidation
   * @param {Function} refreshTokenCallback - Function to refresh the token
   */
  async handleTokenExpiration(refreshTokenCallback) {
    try {
      // Call provided callback to refresh token
      const newToken = await refreshTokenCallback();

      if (newToken) {
        localStorage.setItem("authToken", newToken);
        this.authToken = newToken;

        // Reconnect with new token
        if (this.socketClient) {
          this.socketClient.disconnect();
        }

        return this.reconnect();
      }
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Handle failed token refresh (e.g., redirect to login)
      return null;
    }
  }

  /**
   * Setup some common event handlers for the socket client
   */
  setupSocketEventHandlers() {
    if (!this.socketClient) return;

    // Handle authentication errors which might indicate token issues
    this.socketClient.onError = (error) => {
      console.error("Socket error:", error);

      // If error is related to authentication, try to refresh token
      if (error.message && error.message.includes("Authentication")) {
        // Example of how you might handle token refresh
        this.handleTokenExpiration(() => {
          // This would be your actual token refresh logic
          return fetch("/api/auth/refresh-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refreshToken: localStorage.getItem("refreshToken"),
            }),
          })
            .then((response) => response.json())
            .then((data) => data.token);
        });
      }
    };

    // Handle disconnection which might be due to token expiration
    this.socketClient.onDisconnected = (reason) => {
      console.log(`Socket disconnected: ${reason}`);

      if (reason === "io server disconnect") {
        // Server disconnected the client, could be token expiration
        console.log(
          "Server disconnected the client, attempting to refresh token..."
        );
        this.handleTokenExpiration();
      }
    };
  }

  /**
   * Disconnect the socket when logging out
   */
  handleLogout() {
    if (this.socketClient) {
      this.socketClient.disconnect();
      this.socketClient = null;
    }

    localStorage.removeItem("authToken");
    this.authToken = null;
  }
}

module.exports = WebSocketAuthHelper;
