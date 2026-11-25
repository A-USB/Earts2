const mongoose = require('mongoose');

// One row per artwork per day (UTC) with a counter, so analytics stay small however popular a piece is.
const artworkViewSchema = new mongoose.Schema({
  artworkId: { type: String, required: true, index: true },
  artistId: { type: String, required: true, index: true },
  day: { type: String, required: true },   // YYYY-MM-DD
  count: { type: Number, default: 0 }
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
artworkViewSchema.index({ artworkId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('ArtworkView', artworkViewSchema);
