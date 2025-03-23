# API Server

## API Documentation

The API documentation is automatically generated using Swagger/OpenAPI and is available at the following endpoints:

- Interactive UI: `http://localhost/api-docs` (when running with Docker)
- Interactive UI: `http://localhost:3000/api-docs` (when running the server directly)

### Generate Static Documentation

To generate static documentation files:

1. Install dependencies:

   ```
   npm install
   ```

2. Run the documentation generation script:

   ```
   node src/scripts/generateApiDocs.js
   ```

3. The generated files will be in the `docs` directory:
   - `docs/swagger.json` - The OpenAPI specification file
   - `docs/index.html` - Static HTML documentation that can be opened in a browser

## Adding Documentation For New Endpoints

When adding new endpoints, please follow the documentation guide in `docs/API_DOCUMENTATION_GUIDE.md` to ensure your endpoints are properly documented.

## Available Endpoints

### Authentication Endpoints

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login a user
- POST `/api/auth/refresh-token` - Refresh an access token
- GET `/api/auth/profile` - Get the current user's profile (requires authentication)
- POST `/api/auth/logout` - Logout a user (requires authentication)

### Health Check Endpoints

- GET `/api/health` - Basic server health check
- GET `/api/health/db` - Database connection health check

## Running with Docker

```bash
docker-compose up
```

## Running Locally

```bash
npm install
npm run dev
```
