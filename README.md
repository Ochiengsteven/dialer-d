# VoiceBridge

A real-time voice calling application with WebSocket integration for seamless communication.

## Table of Contents

- [Introduction](#introduction)
- [Tech Stack](#tech-stack)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Running the Application](#running-the-application)
- [Core Features](#core-features)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Future Features](#future-features)
- [Issue Submission](#issue-submission)
- [License](#license)

## Introduction

VoiceBridge is a modern, real-time communication platform that enables users to make voice calls through a web interface. The application provides a secure authentication system, real-time call functionality using WebSockets, and a comprehensive call history tracking system.

## Tech Stack

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional event-based communication
- **Sequelize** - Promise-based ORM for PostgreSQL
- **JWT** - Authentication and authorization

### Database

- **PostgreSQL** - Primary database for storing user data and call history

### Message Broker

- **RabbitMQ** - Used for asynchronous communication between services

### Frontend

- **HTML/CSS/JavaScript** - Client-side interface
- **Socket.IO Client** - Real-time communication with the server

### DevOps

- **Docker** - Containerization of all services
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer

### Documentation

- **Swagger** - API documentation

## Setup and Installation

### Prerequisites

- Docker and Docker Compose
- Git

### Environment Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd dialer-d
   ```

2. Create environment variables or use the defaults provided in the docker-compose.yml

### Running the Application

1. Start all services using Docker Compose:

   ```bash
   docker-compose up -d
   ```

2. The application will be available at:

   - Web application: `http://localhost:80`
   - API documentation: `http://localhost:80/api-docs`
   - Test call page: `http://localhost:80/test-call`

3. To stop the application:
   ```bash
   docker-compose down
   ```

## Core Features

### User Authentication

- User registration with email, username, and password
- Secure login with JWT authentication
- Token refresh mechanism
- User profile management

### Real-time Communication

- WebSocket integration for real-time signaling
- Voice calling functionality
- Call status tracking (pending, active, completed, missed, rejected)

### Call Management

- Initiate calls to registered users
- Accept or reject incoming calls
- End ongoing calls
- Rate completed calls (1-5 stars)

### Call History

- Comprehensive call history tracking
- Filter calls by status
- View detailed call information
- Call analytics and metrics

## API Documentation

The API documentation is available through Swagger UI at `/api-docs` when the application is running. The documentation provides detailed information about all available endpoints, request parameters, and response formats.

## Project Structure

```
dialer-d/
├── dialer/                 # Client-side code
├── nginx/                  # Nginx configuration
│   └── nginx.conf          # Main Nginx configuration file
├── server/                 # Server-side code
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Utility scripts
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Main application entry point
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile.nginx        # Nginx container configuration
├── Dockerfile.server       # Server container configuration
└── README.md               # Project documentation
```

## Future Features

- Group calling capability
- Video calling integration
- End-to-end encryption
- Screen sharing functionality
- Message/chat system
- Mobile application (iOS/Android)
- User blocking and reporting
- Advanced call filtering
- Integration with third-party services

## Issue Submission

For bugs, feature requests, or any other issues, please follow these steps:

1. Check if the issue already exists in the issue tracker
2. If not, create a new issue with:
   - Clear and descriptive title
   - Detailed description of the issue/feature
   - Steps to reproduce (for bugs)
   - Expected behavior
   - Screenshots or code samples if applicable
   - Environment information (OS, browser, etc.)

## License

This project is private and proprietary. All rights reserved. Unauthorized copying, distribution, or use is strictly prohibited.

[View License](./LICENSE.md)
