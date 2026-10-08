const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  artworkId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  username: { type: String, required: true },
  text: { type: String, required: true, trim: true, maxlength: 600 },
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

module.exports = mongoose.model('Comment', commentSchema);
