// src/controllers/call.controller.js
const Call = require('../models/call.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');

/**
 * Get call history for the authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getCallHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0, status } = req.query;
    
    // Build query conditions
    const whereConditions = {
      [Op.or]: [
        { caller_id: userId },
        { receiver_id: userId }
      ]
    };
    
    // Add status filter if provided
    if (status) {
      whereConditions.status = status;
    }
    
    // Get calls from database
    const calls = await Call.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'caller_id', 'receiver_id', 'status', 
        'start_time', 'end_time', 'duration',
        'caller_rating', 'receiver_rating', 'createdAt'
      ]
    });
    
    // Get user details for all participants
    const userIds = new Set();
    calls.rows.forEach(call => {
      userIds.add(call.caller_id);
      userIds.add(call.receiver_id);
    });
    
    const users = await User.findAll({
      where: {
        id: Array.from(userIds)
      },
      attributes: ['id', 'username', 'gender']
    });
    
    // Create a map of user details
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = {
        id: user.id,
        username: user.username,
        gender: user.gender
      };
    });
    
    // Format response with user details
    const formattedCalls = calls.rows.map(call => {
      const caller = userMap[call.caller_id];
      const receiver = userMap[call.receiver_id];
      
      return {
        id: call.id,
        caller: caller || { id: call.caller_id, username: 'Unknown User' },
        receiver: receiver || { id: call.receiver_id, username: 'Unknown User' },
        status: call.status,
        start_time: call.start_time,
        end_time: call.end_time,
        duration: call.duration,
        rating: userId === call.caller_id ? call.caller_rating : call.receiver_rating,
        created_at: call.createdAt
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        calls: formattedCalls,
        total: calls.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch call history',
      error: error.message
    });
  }
};

/**
 * Get details of a specific call
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getCallDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { callId } = req.params;
    
    // Get call from database
    const call = await Call.findOne({
      where: {
        id: callId,
        [Op.or]: [
          { caller_id: userId },
          { receiver_id: userId }
        ]
      }
    });
    
    if (!call) {
      return res.status(404).json({
        status: 'error',
        message: 'Call not found or you do not have access to this call'
      });
    }
    
    // Get user details for participants
    const [caller, receiver] = await Promise.all([
      User.findByPk(call.caller_id, {
        attributes: ['id', 'username', 'gender']
      }),
      User.findByPk(call.receiver_id, {
        attributes: ['id', 'username', 'gender']
      })
    ]);
    
    // Format response
    const callDetails = {
      id: call.id,
      caller: caller ? {
        id: caller.id,
        username: caller.username,
        gender: caller.gender
      } : { id: call.caller_id, username: 'Unknown User' },
      receiver: receiver ? {
        id: receiver.id,
        username: receiver.username,
        gender: receiver.gender
      } : { id: call.receiver_id, username: 'Unknown User' },
      status: call.status,
      start_time: call.start_time,
      end_time: call.end_time,
      duration: call.duration,
      caller_rating: userId === call.caller_id ? call.caller_rating : undefined,
      receiver_rating: userId === call.receiver_id ? call.receiver_rating : undefined,
      created_at: call.createdAt,
      updated_at: call.updatedAt
    };
    
    res.status(200).json({
      status: 'success',
      data: callDetails
    });
  } catch (error) {
    console.error('Error fetching call details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch call details',
      error: error.message
    });
  }
};

/**
 * Rate a completed call
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const rateCall = async (req, res) => {
  try {
    const userId = req.userId;
    const { callId } = req.params;
    const { rating } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    // Get call from database
    const call = await Call.findOne({
      where: {
        id: callId,
        [Op.or]: [
          { caller_id: userId },
          { receiver_id: userId }
        ],
        status: 'completed'
      }
    });
    
    if (!call) {
      return res.status(404).json({
        status: 'error',
        message: 'Call not found, not completed, or you were not a participant'
      });
    }
    
    // Update rating based on user role in call
    if (call.caller_id === userId) {
      await call.update({ caller_rating: rating });
    } else {
      await call.update({ receiver_rating: rating });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Call rated successfully',
      data: {
        call_id: callId,
        rating
      }
    });
  } catch (error) {
    console.error('Error rating call:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to rate call',
      error: error.message
    });
  }
};

module.exports = {
  getCallHistory,
  getCallDetails,
  rateCall
};
