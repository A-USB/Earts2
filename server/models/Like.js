const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  artworkId: { type: String, required: true, index: true },
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

likeSchema.index({ userId: 1, artworkId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
