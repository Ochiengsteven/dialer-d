// src/routes/call.routes.js
const express = require('express');
const {
  getCallHistory,
  getCallDetails,
  rateCall
} = require('../controllers/call.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/calls:
 *   get:
 *     summary: Get call history for the authenticated user
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of calls to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of calls to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, missed, rejected]
 *         description: Filter calls by status
 *     responses:
 *       200:
 *         description: Call history retrieved successfully
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
 *                     calls:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           caller:
 *                             type: object
 *                           receiver:
 *                             type: object
 *                           status:
 *                             type: string
 *                           start_time:
 *                             type: string
 *                           end_time:
 *                             type: string
 *                           duration:
 *                             type: integer
 *                           rating:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', protect, getCallHistory);

/**
 * @swagger
 * /api/calls/{callId}:
 *   get:
 *     summary: Get details of a specific call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the call to get details for
 *     responses:
 *       200:
 *         description: Call details retrieved successfully
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
 *                     id:
 *                       type: string
 *                     caller:
 *                       type: object
 *                     receiver:
 *                       type: object
 *                     status:
 *                       type: string
 *                     start_time:
 *                       type: string
 *                     end_time:
 *                       type: string
 *                     duration:
 *                       type: integer
 *                     caller_rating:
 *                       type: integer
 *                     receiver_rating:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Call not found
 *       500:
 *         description: Server error
 */
router.get('/:callId', protect, getCallDetails);

/**
 * @swagger
 * /api/calls/{callId}/rate:
 *   post:
 *     summary: Rate a completed call
 *     tags: [Calls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: callId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the call to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *     responses:
 *       200:
 *         description: Call rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Call rated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     call_id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *       400:
 *         description: Invalid rating
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Call not found or not completed
 *       500:
 *         description: Server error
 */
router.post('/:callId/rate', protect, rateCall);

module.exports = router;
