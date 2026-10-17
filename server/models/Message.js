const mongoose = require('mongoose');

// Direct messages between two people. conversationId is the two user ids, sorted and joined,
// so both sides share one thread and a single indexed lookup returns it.
const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  read: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now(), index: true }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Message', messageSchema);
