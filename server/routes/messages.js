const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Session = require('../models/Session');
const Request = require('../models/Request');
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
  const senderId = req.user.id;

  if (!receiver || !content) {
    return res.status(400).json({ msg: 'Receiver and content are required.' });
  }

  try {
    // Authorization Check: A user can only message another user if they share a paid, completed, or rated session.
    if (req.user.role !== 'admin') {
      console.log(`[Chat Auth] Checking for active session between ${senderId} and ${receiver}`);
      const hasActiveSession = await Session.findOne({
        $or: [
          { client: senderId, counselor: receiver },
          { client: receiver, counselor: senderId },
        ],
        status: { $in: ['pending', 'paid', 'completed', 'rated'] },
      });

      if (!hasActiveSession) {
        // Fallback: allow chat if there is an accepted connection request
        const hasAcceptedRequest = await Request.findOne({
          $or: [
            { client: senderId, counselor: receiver },
            { client: receiver, counselor: senderId },
          ],
          status: 'accepted',
        });

        if (!hasAcceptedRequest) {
          console.log(`[Chat Auth] Failed: No active session or accepted request between ${senderId} and ${receiver}.`);
          return res.status(403).json({ msg: 'You can only message users with whom you have an active session or accepted request.' });
        }
        console.log('[Chat Auth] Success: Accepted request found.');
      }
      console.log(`[Chat Auth] Success: Active session found.`);
    }

    let message = new Message({
      sender: senderId,
      receiver,
      content,
    });

    await message.save();

    // Populate sender and receiver details for the client
    const populatedMessage = await Message.findById(message._id).populate('sender receiver', 'firstName lastName profilePicture');

    // Emit the message to the recipient and sender via WebSocket in a safe way
    try {
      if (req.io && req.userSocketMap) {
        const recipientSocketId = req.userSocketMap[receiver];
        if (recipientSocketId) {
          req.io.to(recipientSocketId).emit('receive-message', populatedMessage);
        }
        const senderSocketId = req.userSocketMap[senderId];
        if (senderSocketId) {
          req.io.to(senderSocketId).emit('receive-message', populatedMessage);
        }
      } else {
        console.log('[Socket.IO] Not configured, skipping real-time message emission.');
      }
    } catch (socketError) {
      console.error('[Socket.IO] Error emitting message:', socketError.message);
    }

    res.json(populatedMessage);
  } catch (err) {
    console.error('Error sending message:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
