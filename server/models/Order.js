const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: { type: String, required: true, index: true },
  artworkId: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  cardLast4: { type: String },
  status: { type: String, default: 'completed' },
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

module.exports = mongoose.model('Order', orderSchema);
