const mongoose = require('mongoose');

// A work-in-progress update: one image, a caption, an optional stage label, optionally linked to a finished artwork.
const processPostSchema = new mongoose.Schema({
  artistId: { type: String, required: true, index: true },
  artworkId: { type: String, default: null, index: true },
  caption: { type: String, default: '', maxlength: 500 },
  stage: { type: String, default: '', maxlength: 40 },
  imageUrl: { type: String, required: true, maxlength: 4300000 },
  color: { type: String, default: '#6025EA' },
  createdAt: { type: Number, default: () => Date.now(), index: true }
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

module.exports = mongoose.model('ProcessPost', processPostSchema);
