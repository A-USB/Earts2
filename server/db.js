const dns = require('dns');
// Set robust public DNS servers to resolve MongoDB Atlas SRV records properly
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in restricted environments
}

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

    console.log('✅ MongoDB database seeded successfully! Demo password: password123');
  } catch (err) {
    console.error('⚠️ Error seeding database:', err.message);
  }
}

async function connectDB() {
  // Always seed in-memory store so the app is instantly responsive
  await seedMemoryStore();

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/earts';
  try {
    console.log(`🔌 Connecting to MongoDB at: ${uri.split('@').pop() || uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`🚀 Connected to MongoDB at: ${uri.split('@').pop()}`);
    await seedDatabase();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection note: ${err.message}`);
    console.log(`✨ Running in High-Speed Resilient Mode (Instant fallback active, demo login ready).`);
  }
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
  memoryStore
};
