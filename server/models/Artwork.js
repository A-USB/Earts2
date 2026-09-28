const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema({
  userId: { type: String },
  username: { type: String },
  name: { type: String },
  role: { type: String }
}, { _id: false });

const artworkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  artistId: { type: String, required: true, index: true },
  artistName: { type: String, required: true },
  artistUsername: { type: String },
  price: { type: Number, default: null },
  category: { type: String, required: true, index: true },
  status: { type: String, enum: ['for_sale', 'not_for_sale', 'sold'], default: 'for_sale', index: true },
  color: { type: String, default: '#6025EA' },
  imageUrl: { type: String, default: null },
  medium: { type: String, default: '' },
  year: { type: Number, default: () => new Date().getFullYear() },
  likes: { type: Number, default: 0 },
  trending: { type: Boolean, default: false, index: true },
  featured: { type: Boolean, default: false, index: true },
  pinned: { type: Boolean, default: false },
  collaborators: [collaboratorSchema],
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

module.exports = mongoose.model('Artwork', artworkSchema);
