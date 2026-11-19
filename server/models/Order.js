const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: { type: String, required: true, index: true },
  artworkId: { type: String, required: true, index: true },
  sellerId: { type: String, index: true },
  price: { type: Number, required: true },
  // 'demo' = placed, nothing paid yet. Real payment statuses (pending/paid) are added when payments are wired in.
  status: { type: String, enum: ['demo', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'demo' },
  trackingNote: { type: String, maxlength: 200, default: '' },
  createdAt: { type: Number, default: () => Date.now() },
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

module.exports = mongoose.model('Order', orderSchema);
