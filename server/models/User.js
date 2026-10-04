const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: false },
  googleId: { type: String, sparse: true, default: null },
  role: { type: String, default: 'Artist' },
  accountType: { type: String, enum: ['artist', 'collector'], default: 'artist' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  workplace: { type: String, default: '' },
  avatar: { type: String, default: null },
  tags: [{ type: String }],
  tools: [{ type: String }],
  availableFor: [{ type: String }],
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  artworksSold: { type: Number, default: 0 },
  coverColor: { type: String, default: 'linear-gradient(135deg, #5B4BF5 0%, #FF6B9D 100%)' },
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
