# DrunkDial WebSocket Implementation

This document explains the WebSocket implementation for the DrunkDial application, which provides real-time communication capabilities for the anonymous peer-to-peer voice connection platform.

## Overview

The WebSocket implementation uses Socket.IO for establishing and maintaining real-time connections between clients and the server. It handles various events such as user connection, queue management, and WebRTC signaling for establishing peer-to-peer voice calls.

## Server-Side Components

### 1. Socket Service (`server/src/services/socket.service.js`)

The core WebSocket functionality is implemented in this service, which:

- Initializes the Socket.IO server
- Authenticates users through JWT tokens
- Manages user connections and statuses
- Handles queue management events
- Facilitates WebRTC signaling between peers

### 2. Connection Model (`server/src/models/connection.model.js`)

Tracks the state of user connections, including:

- Socket ID associations
- Connection status (online, in_queue, in_call, offline)
- Queue information (position, preferences)
- User mood and preferences for matching

### 3. Call Model (`server/src/models/call.model.js`)

Records information about voice calls, including:

- Caller and receiver information
- Call duration and status
- Ratings and feedback

### 4. WebSocket Controller (`server/src/controllers/websocket.controller.js`)

Provides RESTful API endpoints to interact with the WebSocket system:

- Getting connection status
- Retrieving active connection counts

## NGINX Configuration

The NGINX configuration has been optimized to properly handle WebSocket connections, with:

- Proper upgrade headers for WebSocket protocol
- WebSocket-specific timeouts and buffer settings
- Connection upgrades for the `/socket.io/` path
- Sticky sessions through IP hashing for load balancing

## Key WebSocket Events

### Connection Events

- `connect`: Client successfully connected to the server
- `disconnect`: Client disconnected from the server

### Queue Management Events

- `join_queue`: Client joins the matching queue with preferences
- `leave_queue`: Client leaves the matching queue
- `queue_joined`: Server confirms client has joined the queue
- `queue_left`: Server confirms client has left the queue
- `queue_position_update`: Server updates client on queue position

### WebRTC Signaling Events

- `offer`: WebRTC offer for establishing a call connection
- `answer`: WebRTC answer in response to an offer
- `ice_candidate`: ICE candidate for WebRTC connection negotiation

### Call Management Events

- `call_matched`: Server notifies clients they've been matched for a call
- `call_ended`: Server notifies that a call has ended
- `end_call`: Client requests to end a call

## Client-Side Implementation

A reference client implementation is provided in `client-example/websocket-client.js`, which demonstrates:

- Establishing a connection with authentication
- Handling WebSocket events
- Managing the call queue
- WebRTC signaling for peer-to-peer voice calls
- Call management (starting, ending)

## Authentication

WebSocket connections are authenticated using JWT tokens:

1. The client connects with a token in the handshake auth object
2. The server validates the token and associates the socket with the user
3. Subsequent events are processed in the context of the authenticated user

## Next Steps

The WebSocket implementation serves as the foundation for the next phases of development:

1. Queue Management System with RabbitMQ (next sprint)
2. Matching Algorithm based on user preferences (next sprint)

These components will build upon the WebSocket infrastructure to provide the complete real-time experience for DrunkDial users.

## Testing the WebSocket Implementation

To test the WebSocket functionality:

1. Ensure the server is running with `docker-compose up`
2. Use a WebSocket testing tool like Socket.IO tester or Postman
3. Connect to `http://localhost/socket.io/` with the appropriate JWT token
4. Test the various events documented above

## Common Issues and Troubleshooting

- **Connection failures**: Ensure NGINX is properly configured for WebSockets
- **Authentication errors**: Verify the JWT token is valid and has not expired
- **WebRTC issues**: Check STUN/TURN server configuration for NAT traversal

For additional assistance, consult the Socket.IO and WebRTC documentation.
