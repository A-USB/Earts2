const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Disable command buffering so Mongoose never hangs for 10s when offline/reconnecting
mongoose.set('bufferCommands', false);

const User = require('./models/User');
const Artwork = require('./models/Artwork');
const Product = require('./models/Product');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const Order = require('./models/Order');
const Follow = require('./models/Follow');
const Like = require('./models/Like');
const Collection = require('./models/Collection');
const SavedArtwork = require('./models/SavedArtwork');

const {
  memoryStore,
  seedMemoryStore,
  createModelProxy,
  INITIAL_USERS,
  INITIAL_ARTWORKS,
  INITIAL_PRODUCTS
} = require('./memoryStore');

const DAY = 86400000;
const seedNow = Date.now();

async function seedDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('🌱 Seeding initial demo data into MongoDB...');
    const defaultHashedPassword = await bcrypt.hash('password123', 10);

    // 1. Seed Users
    const createdUsers = await User.insertMany(
      INITIAL_USERS.map(u => ({ ...u, password: defaultHashedPassword }))
    );

    const userMap = {};
    createdUsers.forEach(u => {
      userMap[u.username] = u;
    });

    // 2. Seed Artworks with user references
    const artworksToInsert = INITIAL_ARTWORKS.map(art => {
      const user = userMap[art.artistUsername] || createdUsers[0];
      return {
        ...art,
        artistId: user.id,
        artistName: `${user.firstName} ${user.lastName}`,
        artistUsername: user.username
      };
    });
    await Artwork.insertMany(artworksToInsert);

    // 3. Seed Products
    await Product.insertMany(INITIAL_PRODUCTS);

    console.log('✅ MongoDB database seeded successfully.');
  } catch (err) {
    console.error('⚠️ Error seeding database:', err.message);
  }
}

let reconnectTimer = null;
let connectionPromise = null;
let reconnectDelayMs = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

async function connectDB() {
  await seedMemoryStore();

  if (mongoose.connection.readyState === 1) return true;
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/earts';
  connectionPromise = (async () => {
    try {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000
      });
      reconnectDelayMs = 1000;
      console.log('🚀 Connected to MongoDB. Persistent database is active.');
      await seedDatabase();
      return true;
    } catch (err) {
      console.warn(`⚠️ MongoDB connection note: ${err.message}`);
      console.log(`✨ Running in High-Speed Resilient Mode (Instant fallback active, demo login ready).`);
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectDB();
        }, reconnectDelayMs);
        reconnectTimer.unref?.();
      }
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS);
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

// Proxied Models that seamlessly fallback to in-memory store when MongoDB is disconnected
const ProxiedUser = createModelProxy('User', User, memoryStore.users);
const ProxiedArtwork = createModelProxy('Artwork', Artwork, memoryStore.artworks);
const ProxiedProduct = createModelProxy('Product', Product, memoryStore.products);
const ProxiedComment = createModelProxy('Comment', Comment, memoryStore.comments);
const ProxiedNotification = createModelProxy('Notification', Notification, memoryStore.notifications);
const ProxiedOrder = createModelProxy('Order', Order, memoryStore.orders);
const ProxiedFollow = createModelProxy('Follow', Follow, memoryStore.follows);
const ProxiedLike = createModelProxy('Like', Like, memoryStore.likes);
const ProxiedCollection = createModelProxy('Collection', Collection, memoryStore.collections);
const ProxiedSavedArtwork = createModelProxy('SavedArtwork', SavedArtwork, memoryStore.savedArtworks);

module.exports = {
  connectDB,
  seedDatabase,
  User: ProxiedUser,
  Artwork: ProxiedArtwork,
  Product: ProxiedProduct,
  Comment: ProxiedComment,
  Notification: ProxiedNotification,
  Order: ProxiedOrder,
  Follow: ProxiedFollow,
  Like: ProxiedLike,
  Collection: ProxiedCollection,
  SavedArtwork: ProxiedSavedArtwork,
  memoryStore
};
