/**
 * Script to generate static API documentation
 * This is useful for sharing documentation without running the server
 */
const fs = require("fs");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

// Import Swagger options from config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VoiceBridge API",
      version: "1.0.0",
      description: "API documentation for the VoiceBridge application",
      contact: {
        name: "API Support",
        email: "support@voicebridge.com",
      },
    },
    servers: [
      {
        url: "/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Convert to string
const swaggerSpecStr = JSON.stringify(swaggerSpec, null, 2);

// Ensure docs directory exists
const docsDir = path.join(__dirname, "../../docs");
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write to file
fs.writeFileSync(path.join(docsDir, "swagger.json"), swaggerSpecStr);

// Create HTML file with Swagger UI
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VoiceBridge API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    #swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        supportedSubmitMethods: []
      });
      window.ui = ui;
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(docsDir, "index.html"), htmlContent);

console.log("API documentation generated successfully!");
console.log(`- JSON: ${path.join(docsDir, "swagger.json")}`);
console.log(`- HTML: ${path.join(docsDir, "index.html")}`);
