const mongoose = require('mongoose');

const challengeEntrySchema = new mongoose.Schema({
  challengeId: { type: String, required: true, index: true },
  artworkId: { type: String, required: true, index: true },
  artistId: { type: String, required: true, index: true },
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

module.exports = mongoose.model('ChallengeEntry', challengeEntrySchema);
