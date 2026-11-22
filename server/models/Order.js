const mongoose = require('mongoose');

// Snapshot of how the sale is divided between the owner and accepted co-creators at the time of purchase
const splitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String },
  name: { type: String },
  role: { type: String },
  percent: { type: Number, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyerId: { type: String, required: true, index: true },
  artworkId: { type: String, required: true, index: true },
  sellerId: { type: String, index: true },
  split: { type: [splitSchema], default: [] },
  participantIds: { type: [String], default: [], index: true }, // seller + accepted co-creators
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
