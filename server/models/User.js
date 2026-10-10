const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  firstName: { type: String, required: true, trim: true, maxlength: 30 },
  lastName: { type: String, required: true, trim: true, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: false, maxlength: 128 },
  passwordResetTokenHash: { type: String, select: false, default: null },
  passwordResetExpiresAt: { type: Date, select: false, default: null },
  googleId: { type: String, sparse: true, default: null },
  role: { type: String, default: 'Artist' },
  accountType: { type: String, enum: ['artist', 'collector'], default: 'artist' },
  bio: { type: String, default: '', maxlength: 500 },
  location: { type: String, default: '', maxlength: 100 },
  workplace: { type: String, default: '', maxlength: 100 },
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
      delete ret.passwordResetTokenHash;
      delete ret.passwordResetExpiresAt;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
