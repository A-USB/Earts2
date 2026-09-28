const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  artistId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  artworkIds: [{ type: String }],
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

module.exports = mongoose.model('Collection', collectionSchema);
