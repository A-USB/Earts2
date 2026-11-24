const mongoose = require('mongoose');

// An artist's application for the verified badge. A moderator approves or rejects it; an approved badge can be revoked later.
const verificationRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  statement: { type: String, required: true, maxlength: 600 },
  links: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'revoked'], default: 'pending', index: true },
  reviewerId: { type: String, default: null },
  reviewerNote: { type: String, default: '', maxlength: 300 },
  createdAt: { type: Number, default: () => Date.now(), index: true },
  resolvedAt: { type: Number, default: null }
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

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
