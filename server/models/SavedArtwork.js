const mongoose = require('mongoose');

const savedArtworkSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  artworkId: { type: String, required: true, index: true },
  createdAt: { type: Number, default: () => Date.now() }
});

savedArtworkSchema.index({ userId: 1, artworkId: 1 }, { unique: true });

module.exports = mongoose.model('SavedArtwork', savedArtworkSchema);
