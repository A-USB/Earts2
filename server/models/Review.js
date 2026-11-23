const mongoose = require('mongoose');

// A buyer's rating of an artist. Only possible after a delivered order or a completed commission,
// and only once per order / commission, so ratings come from real transactions.
const reviewSchema = new mongoose.Schema({
  artistId: { type: String, required: true, index: true },
  reviewerId: { type: String, required: true, index: true },
  source: { type: String, enum: ['order', 'commission'], required: true },
  sourceId: { type: String, required: true, index: true },
  context: { type: String, default: '', maxlength: 120 },   // artwork or commission title, kept even if it is later removed
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 1000 },
  reply: { type: String, default: '', maxlength: 500 },
  repliedAt: { type: Number, default: null },
  edited: { type: Boolean, default: false },
  createdAt: { type: Number, default: () => Date.now(), index: true },
  updatedAt: { type: Number, default: () => Date.now() }
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

module.exports = mongoose.model('Review', reviewSchema);
