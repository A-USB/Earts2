const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Artwork = require('./models/Artwork');
const Product = require('./models/Product');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

const DAY = 86400000;
const seedNow = Date.now();

const INITIAL_USERS = [
  {
    username: 'jane_murungi', firstName: 'Jane', lastName: 'Murungi',
    email: 'jane@earts.com', role: 'Sculptor', accountType: 'artist',
    bio: 'Illustrator and visual storyteller based in Nairobi. I create vibrant, culture-inspired art that bridges tradition and the digital world.',
    location: 'Kigali, Rwanda', avatar: null,
    tags: ['Illustration', 'Digital art', 'Watercolour', 'Sculpture'],
    tools: ['Procreate', 'Ink', 'Watercolour', 'Illustrator'],
    availableFor: ['Commissions', 'Collaborations', 'Workshop'],
    followers: 69500, following: 435, artworksSold: 71,
    coverColor: 'linear-gradient(135deg, #FF6B6B 0%, #C44FD8 50%, #5B4BF5 100%)'
  },
  {
    username: 'nadia_reyes', firstName: 'Nadia', lastName: 'Reyes',
    email: 'nadia@earts.com', role: 'Painter', accountType: 'artist',
    bio: 'Artist and entrepreneur passionate about creative economies.',
    location: 'Madrid, Spain', avatar: null,
    tags: ['Painting', 'Oil', 'Abstract'],
    tools: ['Oil paint', 'Canvas'],
    availableFor: ['Commissions', 'Exhibitions'],
    followers: 23700, following: 120, artworksSold: 45,
    coverColor: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)'
  },
  {
    username: 'arahibris2011', firstName: 'Ara', lastName: 'Hibris',
    email: 'ara@earts.com', role: 'Illustrator', accountType: 'artist',
    bio: 'Engineer & Illustrator building tools artists actually need.',
    location: 'Tokyo, Japan', avatar: null,
    tags: ['Digital', 'Illustration', 'Character design'],
    tools: ['Procreate', 'Photoshop'],
    availableFor: ['Collaborations'],
    followers: 15200, following: 320, artworksSold: 28,
    coverColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    username: 'hussina_patel', firstName: 'Hussina', lastName: 'Patel',
    email: 'hussina@earts.com', role: 'Mixed Media', accountType: 'artist',
    bio: 'Bringing artists together across borders and disciplines.',
    location: 'Mumbai, India', avatar: null,
    tags: ['Mixed Media', 'Sculpture', 'Installation'],
    tools: ['Clay', 'Metal', 'Wood'],
    availableFor: ['Commissions', 'Collaborations', 'Workshop'],
    followers: 11600, following: 200, artworksSold: 19,
    coverColor: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  },
  {
    username: 'arahirwa_bright', firstName: 'Arahirwa', lastName: 'Bright',
    email: 'bright@earts.com', role: 'Sculptor', accountType: 'artist',
    bio: 'Sculptor and mixed media creator crafting tactile visual experiences.',
    location: 'Kigali, Rwanda', avatar: null,
    tags: ['Sculpture', 'Mixed Media', 'Installation'],
    tools: ['Clay', 'Metal', 'Wood', 'Procreate'],
    availableFor: ['Commissions', 'Collaborations', 'Exhibitions'],
    followers: 1240, following: 85, artworksSold: 12,
    coverColor: 'linear-gradient(135deg, #5B4BF5 0%, #FF6B9D 100%)'
  }
];

const INITIAL_ARTWORKS = [
  { title: 'A Calm Day In Rome', artistUsername: 'nadia_reyes', price: 120, likes: 23700, category: 'Painting', status: 'for_sale', color: '#F4D03F', trending: true, featured: true, description: 'A peaceful afternoon captured in warm Mediterranean tones.', medium: 'Oil on Canvas', year: 2024, createdAt: seedNow - 14 * DAY },
  { title: 'The Starry Night', artistUsername: 'arahibris2011', price: 85, likes: 490, category: 'Digital', status: 'for_sale', color: '#00BCD4', trending: true, featured: false, description: 'A digital reimagining of the night sky.', medium: 'Digital', year: 2023, createdAt: seedNow - 13 * DAY },
  { title: 'Guernica', artistUsername: 'hussina_patel', price: 230, likes: 11600, category: 'Mixed Media', status: 'for_sale', color: '#9B59B6', trending: true, featured: true, description: 'An homage to the iconic anti-war statement.', medium: 'Mixed Media', year: 2024, createdAt: seedNow - 12 * DAY },
  { title: 'Creation of Adam', artistUsername: 'arahibris2011', price: 44.99, likes: 6774, category: 'Digital', status: 'for_sale', color: '#A9D18E', trending: true, featured: false, description: 'A modern digital take on the Sistine Chapel masterpiece.', medium: 'Digital', year: 2023, createdAt: seedNow - 11 * DAY },
  { title: 'Sun 2', artistUsername: 'arahirwa_bright', price: 79.99, likes: 340, category: 'Sculpture', status: 'for_sale', color: '#FF6B9D', trending: true, featured: true, pinned: true, description: 'Sculptural study of radiant heat and organic geometry.', medium: 'Clay & Metal', year: 2024, createdAt: seedNow - 2 * DAY },
  { title: 'Form & Shadow', artistUsername: 'arahirwa_bright', price: 110, likes: 580, category: 'Sculpture', status: 'for_sale', color: '#5B4BF5', trending: false, featured: false, description: 'Minimalist curved sculpture exploring spatial balance.', medium: 'Wood', year: 2024, createdAt: seedNow - 5 * DAY },
  { title: 'Golden Ochre', artistUsername: 'arahirwa_bright', price: 65, likes: 210, category: 'Mixed Media', status: 'for_sale', color: '#E59866', trending: false, featured: false, description: 'Textured mixed media panel with earthy ochre pigments.', medium: 'Mixed Media', year: 2023, createdAt: seedNow - 8 * DAY },
  { title: 'Roots and Rythm III', artistUsername: 'jane_murungi', price: 60, likes: 1200, category: 'Illustration', status: 'for_sale', color: '#F5CBA7', trending: false, featured: true, description: 'Exploring African rhythms through visual storytelling.', medium: 'Procreate', year: 2024, createdAt: seedNow - 10 * DAY },
  { title: 'Bloom Series III', artistUsername: 'jane_murungi', price: 45.99, likes: 890, category: 'Illustration', status: 'for_sale', color: '#58D68D', trending: false, featured: false, description: 'Third piece in the Bloom series — nature in full expression.', medium: 'Watercolour', year: 2024, createdAt: seedNow - 9 * DAY },
  { title: 'Still Water', artistUsername: 'jane_murungi', price: 89.99, likes: 2100, category: 'Watercolour', status: 'for_sale', color: '#C0A882', trending: false, featured: true, description: 'Calm and contemplative — a meditation on stillness.', medium: 'Watercolour', year: 2023, createdAt: seedNow - 8 * DAY },
  { title: 'Mona Lisa', artistUsername: 'jane_murungi', price: 74.89, likes: 3400, category: 'Digital', status: 'for_sale', color: '#5B8CDB', trending: false, featured: false, description: 'A fresh digital take on the world\'s most famous portrait.', medium: 'Digital', year: 2022, createdAt: seedNow - 7 * DAY },
  { title: 'Golden Hour', artistUsername: 'jane_murungi', price: 56.79, likes: 780, category: 'Illustration', status: 'for_sale', color: '#7D7D7D', trending: false, featured: false, description: 'Capturing the magic of dusk in vibrant color.', medium: 'Procreate', year: 2024, createdAt: seedNow - 6 * DAY },
  { title: 'Dream State', artistUsername: 'jane_murungi', price: null, likes: 560, category: 'Illustration', status: 'not_for_sale', color: '#D4A574', trending: false, featured: false, description: 'A surreal journey through the subconscious.', medium: 'Mixed Media', year: 2024, createdAt: seedNow - 5 * DAY },
  { title: 'Music Lesson', artistUsername: 'jane_murungi', price: 35.49, likes: 1100, category: 'Illustration', status: 'for_sale', color: '#E8734A', trending: false, featured: false, description: 'Celebrating music education in African communities.', medium: 'Illustration', year: 2023, createdAt: seedNow - 4 * DAY },
  { title: 'Salvator Mundi', artistUsername: 'jane_murungi', price: null, likes: 4200, category: 'Digital', status: 'not_for_sale', color: '#D4AF37', trending: false, featured: true, description: 'A spiritual exploration through digital art.', medium: 'Digital', year: 2022, createdAt: seedNow - 3 * DAY },
  { title: 'Abstract Flow', artistUsername: 'nadia_reyes', price: 95, likes: 5600, category: 'Abstract', status: 'for_sale', color: '#FF6B9D', trending: false, featured: true, description: 'Fluid shapes dancing in harmony.', medium: 'Acrylic', year: 2024, createdAt: seedNow - 2 * DAY },
  { title: 'City Lights', artistUsername: 'arahibris2011', price: 150, likes: 8900, category: 'Digital', status: 'for_sale', color: '#1A1A3E', trending: false, featured: true, description: 'Urban energy distilled into pixels.', medium: 'Digital', year: 2023, createdAt: seedNow - 1 * DAY },
];

const INITIAL_PRODUCTS = [
  { name: 'Artist Starter Kit', description: 'Everything you need to begin your digital art journey on Earts.', price: 29, type: 'subscription', features: ['10 artwork uploads/month', 'Basic analytics', 'Community access', 'Standard storefront'], popular: false, color: '#5B4BF5' },
  { name: 'Creator Pro', description: 'For serious artists ready to grow their audience and income.', price: 79, type: 'subscription', features: ['Unlimited uploads', 'Advanced analytics', 'Priority support', 'Custom storefront', 'Featured placement', 'Commission tools'], popular: true, color: '#FF6B9D' },
  { name: 'Studio Enterprise', description: 'For galleries, collectives, and professional studios.', price: 199, type: 'subscription', features: ['Multi-artist management', 'White-label storefront', 'Bulk upload tools', 'Revenue sharing', 'Dedicated manager', 'API access'], popular: false, color: '#FF6B35' },
  { name: 'Print-on-Demand', description: 'Turn your digital art into physical products automatically.', price: 0, type: 'addon', features: ['Mugs, prints, canvases', 'No upfront costs', '15% commission per sale', 'Worldwide shipping'], popular: false, color: '#00BCD4' },
  { name: 'Promotion Boost', description: 'Get your artwork seen by thousands of new collectors.', price: 15, type: 'addon', features: ['Homepage feature slot', '7-day campaign', 'Email newsletter inclusion', 'Social promotion'], popular: false, color: '#F4D03F' },
];

async function seedDatabase() {
  try {
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
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/earts';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`🚀 Connected to MongoDB at: ${uri.split('@').pop()}`);
    await seedDatabase();
  } catch (err) {
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.warn(`ℹ️ To connect to cloud MongoDB, set MONGODB_URI in your environment or .env file.`);
  }
}

module.exports = { connectDB, seedDatabase };
