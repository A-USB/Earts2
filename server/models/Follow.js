const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: { type: String, required: true, index: true },
  followingId: { type: String, required: true, index: true },
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

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
