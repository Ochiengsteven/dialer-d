# DrunkDial WebSocket Authentication Integration

This document explains how the WebSocket authentication is integrated with the existing user authentication system in the DrunkDial application.

## Overview

The WebSocket implementation uses the same JWT tokens generated during the user authentication process to authenticate WebSocket connections. This provides a seamless authentication experience and ensures that only authenticated users can establish WebSocket connections.

## JWT Integration

### Server-Side Implementation

1. **Same JWT Secret:** The WebSocket service uses the same `JWT_SECRET` from the environment variables that is used for the REST API authentication.

2. **Token Verification:** When a client connects to the WebSocket server, it sends its JWT token in the handshake authentication object. The server verifies this token using the same JWT verification process used in the REST API.

3. **User Association:** After successful verification, the WebSocket connection is associated with the authenticated user by storing the user ID and other relevant data in the socket object.

### Client-Side Implementation

1. **Token Reuse:** The client reuses the same JWT token received during login for WebSocket authentication.

2. **Handshake Authentication:** When establishing a WebSocket connection, the client sends the JWT token in the handshake auth object.

3. **Token Management:** The client handles token expiration and refresh for both API requests and WebSocket connections, ensuring continuous authenticated communication.

## Code Examples

### Server-Side WebSocket Authentication

The WebSocket service authenticates users using the JWT token:

```javascript
// In socket.service.js
this.io.use(async (socket, next) => {
  try {
    // Extract token from the handshake auth
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    // Verify the token using the JWT_SECRET from env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to socket
    socket.userId = decoded.id;
    socket.user = decoded;

    // ... continue with connection setup
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    return next(new Error("Authentication error"));
  }
});
```

### Client-Side Integration

In the client application, the same JWT token from login is used for WebSocket connections:

```javascript
// Example of getting and using the token
async function loginUser(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.token) {
    // Save the JWT token
    localStorage.setItem("authToken", data.token);

    // Use the same token for WebSocket connection
    const socketClient = new DrunkDialClient("http://localhost", data.token);
    socketClient.connect();
  }
}
```

## Authentication Flow

1. **User Login:**

   - User authenticates through the REST API
   - Server generates and returns a JWT token
   - Client stores the token

2. **WebSocket Connection:**

   - Client establishes WebSocket connection with the stored JWT token
   - Server validates the token and associates the socket with the user
   - Connection is established if authentication is successful

3. **Token Expiration:**
   - If the token expires, the server will reject WebSocket messages
   - Client detects authentication failure and refreshes the token
   - Client reconnects with the new token

## Benefits of This Approach

- **Single Authentication System:** Uses the same authentication mechanism for both REST API and WebSockets
- **Reduced Complexity:** No need for separate WebSocket authentication logic
- **Improved Security:** Consistent token validation across all communication channels
- **Better User Experience:** Seamless authentication without requiring additional user input

## Implementation Considerations

- **Token Storage:** The JWT token should be securely stored on the client (localStorage in the example, but consider more secure options for production)
- **Token Refresh:** Implement proper token refresh logic to handle token expiration
- **Error Handling:** Add robust error handling for authentication failures
- **Security:** Consider using HTTPS for all communications to protect the token in transit

This implementation ensures that WebSocket connections are properly authenticated using the same JWT-based system already in place for the REST API, providing a secure and seamless user experience.
