const mongoose = require('mongoose');

// An invitation to co-create an artwork. The invitee must accept before they appear on the artwork.
// sharePercent is each collaborator's cut of future sales; the owner keeps the rest. Shares are private to
// the owner and the invitee, which is why invites live here instead of on the (public) artwork document.
const collabInviteSchema = new mongoose.Schema({
  artworkId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String },
  name: { type: String },
  role: { type: String, required: true, maxlength: 60 },
  sharePercent: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  invitedAt: { type: Number, default: () => Date.now() },
  respondedAt: { type: Number, default: null }
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

module.exports = mongoose.model('CollabInvite', collabInviteSchema);
