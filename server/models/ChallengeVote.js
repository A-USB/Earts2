const mongoose = require('mongoose');

// One vote per person per challenge; voting again for another entry moves the vote.
const challengeVoteSchema = new mongoose.Schema({
  challengeId: { type: String, required: true, index: true },
  voterId: { type: String, required: true, index: true },
  entryId: { type: String, required: true, index: true },
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

module.exports = mongoose.model('ChallengeVote', challengeVoteSchema);
