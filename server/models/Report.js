const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterId: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['artwork', 'user'], required: true, index: true },
  targetId: { type: String, required: true, index: true },
  reason: { type: String, enum: ['copyright', 'harassment', 'inappropriate', 'spam', 'other'], required: true },
  details: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['open', 'reviewed', 'actioned', 'dismissed'], default: 'open', index: true },
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

module.exports = mongoose.model('Report', reportSchema);
