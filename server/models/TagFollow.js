const mongoose = require('mongoose');

// Someone following a tag, so artworks with that tag are lifted in their feed.
const tagFollowSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tag: { type: String, required: true, index: true },
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

module.exports = mongoose.model('TagFollow', tagFollowSchema);
