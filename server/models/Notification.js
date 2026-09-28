const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // recipient
  type: { type: String, enum: ['like', 'comment', 'sale', 'follow', 'feature'], required: true },
  actorName: { type: String, required: true },
  actorUsername: { type: String },
  text: { type: String, required: true },
  targetTitle: { type: String },
  targetId: { type: String },
  targetPrice: { type: Number },
  targetColor: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now() }
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

module.exports = mongoose.model('Notification', notificationSchema);
