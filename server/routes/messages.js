const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticate, requireUser } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET /api/messages/conversations — List user's conversations
router.get('/conversations', authenticate, requireUser, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'displayName avatarUrl role')
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch conversations' } });
  }
});

// POST /api/messages/conversations — Create or get existing conversation
router.post('/conversations', authenticate, requireUser, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ error: { message: 'recipientId is required' } });
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ error: { message: 'Cannot message yourself' } });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: { message: 'User not found' } });

    // Find existing conversation between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    }).populate('participants', 'displayName avatarUrl role');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
      });
      conversation = await conversation.populate('participants', 'displayName avatarUrl role');
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create conversation' } });
  }
});

// GET /api/messages/conversations/:id/messages — Get messages in a conversation
router.get('/conversations/:id/messages', authenticate, requireUser, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: { message: 'Conversation not found' } });

    // Verify user is a participant
    if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: { message: 'Not a participant' } });
    }

    const page = Math.max(1, Math.min(100, parseInt(req.query.page) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 50));

    const messages = await Message.find({ conversationId: req.params.id })
      .populate('senderId', 'displayName avatarUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      { conversationId: req.params.id, senderId: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(req.params.id, {
      [`unreadCount.${req.user._id}`]: 0,
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch messages' } });
  }
});

// POST /api/messages/conversations/:id/messages — Send a message
router.post(
  '/conversations/:id/messages',
  authenticate,
  requireUser,
  [body('text').trim().notEmpty().isLength({ max: 2000 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const conversation = await Conversation.findById(req.params.id);
      if (!conversation) return res.status(404).json({ error: { message: 'Conversation not found' } });

      if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
        return res.status(403).json({ error: { message: 'Not a participant' } });
      }

      const message = await Message.create({
        conversationId: req.params.id,
        senderId: req.user._id,
        text: req.body.text,
        readBy: [req.user._id],
      });

      // Update conversation's last message
      conversation.lastMessage = {
        text: req.body.text,
        senderId: req.user._id,
        createdAt: new Date(),
      };

      // Increment unread for other participants
      conversation.participants.forEach(p => {
        if (p.toString() !== req.user._id.toString()) {
          const current = conversation.unreadCount.get(p.toString()) || 0;
          conversation.unreadCount.set(p.toString(), current + 1);
        }
      });

      await conversation.save();

      const populated = await message.populate('senderId', 'displayName avatarUrl');
      res.status(201).json({ message: populated });
    } catch (error) {
      res.status(500).json({ error: { message: 'Failed to send message' } });
    }
  }
);

// GET /api/messages/unread-count — Total unread messages for current user
router.get('/unread-count', authenticate, requireUser, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id });
    let total = 0;
    conversations.forEach(c => {
      total += c.unreadCount.get(req.user._id.toString()) || 0;
    });
    res.json({ unreadCount: total });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch unread count' } });
  }
});

module.exports = router;
