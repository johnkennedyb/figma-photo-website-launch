const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @route   GET api/messages/:userId
// @desc    Get chat history with a specific user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id },
      ],
    }).populate('sender', 'name role').populate('receiver', 'name role').sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/messages
// @desc    Get all conversations for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
      { $sort: { timestamp: -1 } },
      {
        $addFields: {
          withUserId: {
            $cond: {
              if: { $eq: ['$sender', userId] },
              then: '$receiver',
              else: '$sender',
            },
          },
        },
      },
      {
        $group: {
          _id: '$withUserId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'withUserArray',
        },
      },
      { $unwind: '$withUserArray' },
      {
        $project: {
          _id: 0,
          lastMessage: 1,
          withUser: {
            _id: '$withUserArray._id',
            name: '$withUserArray.name',
            role: '$withUserArray.role',
            profilePicture: '$withUserArray.profilePicture',
          },
        },
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
    ]);
    
    // The aggregation result has `lastMessage` as a raw document.
    // We need to populate the sender and receiver fields within it for the frontend.
    const populatedConversations = await Message.populate(conversations, {
      path: 'lastMessage.sender lastMessage.receiver',
      select: 'name role'
    });

    res.json(populatedConversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});



// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
  const { receiver, content } = req.body;

  try {
    let message = new Message({
      sender: req.user.id,
      receiver,
      content,
    });

    await message.save();

    // Populate sender and receiver details for the client
    message = await message.populate('sender', 'name');
    message = await message.populate('receiver', 'name');

    // Emit the message to the recipient and sender via WebSocket
    const recipientSocketId = req.userSocketMap[receiver];
    if (recipientSocketId) {
      req.io.to(recipientSocketId).emit('receive-message', message);
    }
    const senderSocketId = req.userSocketMap[req.user.id];
    if (senderSocketId) {
        req.io.to(senderSocketId).emit('receive-message', message);
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
