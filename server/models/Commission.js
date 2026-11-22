const mongoose = require('mongoose');

// A commission request between a client and an artist: request -> quote -> work -> delivery -> completion.
// No payment is processed yet; the agreed price is only recorded.
const activitySchema = new mongoose.Schema({
  at: { type: Number, default: () => Date.now() },
  by: { type: String, enum: ['client', 'artist'], required: true },
  action: { type: String, required: true },
  note: { type: String, default: '', maxlength: 500 },
  price: { type: Number, default: null }
}, { _id: false });

const commissionSchema = new mongoose.Schema({
  clientId: { type: String, required: true, index: true },
  artistId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  brief: { type: String, required: true, trim: true, maxlength: 2000 },
  budget: { type: Number, default: null },
  deadline: { type: Number, default: null },
  status: {
    type: String,
    enum: ['requested', 'quoted', 'in_progress', 'delivered', 'completed', 'declined', 'cancelled'],
    default: 'requested'
  },
  quotePrice: { type: Number, default: null },
  quoteDays: { type: Number, default: null },
  quoteNote: { type: String, default: '', maxlength: 500 },
  activity: { type: [activitySchema], default: [] },
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

module.exports = mongoose.model('Commission', commissionSchema);
