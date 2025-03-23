# API Documentation Guide

This guide explains how to document API endpoints when adding new routes to the application.

## Swagger/OpenAPI

We use Swagger/OpenAPI for API documentation. Documentation is automatically generated from JSDoc comments in the route files.

## How to Document a New Route

When adding a new route, include Swagger JSDoc comments above the route definition. Here's an example:

```javascript
/**
 * @swagger
 * /path/to/endpoint:
 *   method:
 *     summary: Short description of what the endpoint does
 *     tags: [CategoryName]
 *     parameters:
 *       - in: path
 *         name: paramName
 *         schema:
 *           type: string
 *         required: true
 *         description: Description of the parameter
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requiredField
 *             properties:
 *               field1:
 *                 type: string
 *                 description: Description of field1
 *               field2:
 *                 type: number
 *                 description: Description of field2
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     property1:
 *                       type: string
 *                     property2:
 *                       type: number
 *       400:
 *         description: Bad request error description
 *       401:
 *         description: Unauthorized error description
 *       500:
 *         description: Server error description
 */
router.method("/path/to/endpoint", controller);
```

## Common Components

For reusable schemas (like User, Post, etc.), define them under the `components` section. Usually, these are defined at the top of the relevant route file:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     ModelName:
 *       type: object
 *       required:
 *         - requiredField1
 *         - requiredField2
 *       properties:
 *         field1:
 *           type: string
 *           description: Description of field1
 *         field2:
 *           type: number
 *           description: Description of field2
 */
```

## Authentication Documentation

For protected routes that require authentication, include the security object:

```javascript
/**
 * @swagger
 * /protected/endpoint:
 *   get:
 *     summary: Protected endpoint
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Not authenticated
 */
```

## Data Types

Common data types to use in your documentation:

- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `object`

For dates, use:

```
type: string
format: date-time
```

## Accessing the Documentation

The API documentation is available at `/api-docs` when the server is running.

## Example Tags

Group your endpoints under meaningful tags:

- Authentication
- Users
- Health
- Posts
- Comments
- etc.

## Best Practices

1. Always document all parameters, request bodies, and response schemas
2. Include all possible response status codes
3. Group related endpoints under the same tag
4. Use clear, concise summaries and descriptions
5. Include examples where helpful
6. Reference common schemas using `$ref: '#/components/schemas/ModelName'`
7. Document both success and error responses
