const mongoose = require('mongoose');

// A themed contest. Entries are the artists' own artworks made after it starts; the community votes; the top 3 win.
const winnerSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  entryId: { type: String, required: true },
  artworkId: { type: String, required: true },
  artistId: { type: String, required: true },
  votes: { type: Number, default: 0 }
}, { _id: false });

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  tag: { type: String, required: true, index: true },        // gets added to entries so they are easy to browse
  startsAt: { type: Number, required: true },
  endsAt: { type: Number, required: true },
  createdBy: { type: String, required: true },
  winners: { type: [winnerSchema], default: [] },
  finalizedAt: { type: Number, default: null },
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

module.exports = mongoose.model('Challenge', challengeSchema);
