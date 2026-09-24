const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// In-memory data store (replace with DB in production)
let users = [
  {
    id: '1', username: 'jane_murungi', firstName: 'Jane', lastName: 'Murungi',
    email: 'jane@earts.com', password: 'hashed', role: 'Sculptor', accountType: 'artist',
    bio: 'Illustrator and visual storyteller based in Nairobi. I create vibrant, culture-inspired art that bridges tradition and the digital world.',
    location: 'Kigali, Rwanda', avatar: null,
    tags: ['Illustration', 'Digital art', 'Watercolour', 'Sculpture'],
    tools: ['Procreate', 'Ink', 'Watercolour', 'Illustrator'],
    availableFor: ['Commissions', 'Collaborations', 'Workshop'],
    followers: 69500, following: 435, artworksSold: 71,
    coverColor: 'linear-gradient(135deg, #FF6B6B 0%, #C44FD8 50%, #5B4BF5 100%)'
  },
  {
    id: '2', username: 'nadia_reyes', firstName: 'Nadia', lastName: 'Reyes',
    email: 'nadia@earts.com', password: 'hashed', role: 'Painter', accountType: 'artist',
    bio: 'Artist and entrepreneur passionate about creative economies.',
    location: 'Madrid, Spain', avatar: null,
    tags: ['Painting', 'Oil', 'Abstract'],
    tools: ['Oil paint', 'Canvas'],
    availableFor: ['Commissions', 'Exhibitions'],
    followers: 23700, following: 120, artworksSold: 45,
    coverColor: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)'
  },
  {
    id: '3', username: 'arahibris2011', firstName: 'Ara', lastName: 'Hibris',
    email: 'ara@earts.com', password: 'hashed', role: 'Illustrator', accountType: 'artist',
    bio: 'Engineer & Illustrator building tools artists actually need.',
    location: 'Tokyo, Japan', avatar: null,
    tags: ['Digital', 'Illustration', 'Character design'],
    tools: ['Procreate', 'Photoshop'],
    availableFor: ['Collaborations'],
    followers: 15200, following: 320, artworksSold: 28,
    coverColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    id: '4', username: 'hussina_patel', firstName: 'Hussina', lastName: 'Patel',
    email: 'hussina@earts.com', password: 'hashed', role: 'Mixed Media', accountType: 'artist',
    bio: 'Bringing artists together across borders and disciplines.',
    location: 'Mumbai, India', avatar: null,
    tags: ['Mixed Media', 'Sculpture', 'Installation'],
    tools: ['Clay', 'Metal', 'Wood'],
    availableFor: ['Commissions', 'Collaborations', 'Workshop'],
    followers: 11600, following: 200, artworksSold: 19,
    coverColor: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  },
  {
    id: '5', username: 'arahirwa_bright', firstName: 'Arahirwa', lastName: 'Bright',
    email: 'bright@earts.com', password: 'hashed', role: 'Sculptor', accountType: 'artist',
    bio: 'Sculptor and mixed media creator crafting tactile visual experiences.',
    location: 'Kigali, Rwanda', avatar: null,
    tags: ['Sculpture', 'Mixed Media', 'Installation'],
    tools: ['Clay', 'Metal', 'Wood', 'Procreate'],
    availableFor: ['Commissions', 'Collaborations', 'Exhibitions'],
    followers: 1240, following: 85, artworksSold: 12,
    coverColor: 'linear-gradient(135deg, #5B4BF5 0%, #FF6B9D 100%)'
  }
];

const DAY = 86400000;
const seedNow = Date.now();
let artworks = [
  { id: '1', title: 'A Calm Day In Rome', artistId: '2', artistName: 'Nadia Reyes', price: 120, likes: 23700, category: 'Painting', status: 'for_sale', color: '#F4D03F', trending: true, featured: true, description: 'A peaceful afternoon captured in warm Mediterranean tones.', medium: 'Oil on Canvas', year: 2024, createdAt: seedNow - 14 * DAY },
  { id: '2', title: 'The Starry Night', artistId: '3', artistName: 'arahibris2011', price: 85, likes: 490, category: 'Digital', status: 'for_sale', color: '#00BCD4', trending: true, featured: false, description: 'A digital reimagining of the night sky.', medium: 'Digital', year: 2023, createdAt: seedNow - 13 * DAY },
  { id: '3', title: 'Guernica', artistId: '4', artistName: 'Hussina Patel', price: 230, likes: 11600, category: 'Mixed Media', status: 'for_sale', color: '#9B59B6', trending: true, featured: true, description: 'An homage to the iconic anti-war statement.', medium: 'Mixed Media', year: 2024, createdAt: seedNow - 12 * DAY },
  { id: '4', title: 'Creation of Adam', artistId: '3', artistName: 'John Brigg', price: 44.99, likes: 6774, category: 'Digital', status: 'for_sale', color: '#A9D18E', trending: true, featured: false, description: 'A modern digital take on the Sistine Chapel masterpiece.', medium: 'Digital', year: 2023, createdAt: seedNow - 11 * DAY },
  { id: '15', title: 'Sun 2', artistId: '5', artistName: 'Arahirwa Bright', price: 79.99, likes: 340, category: 'Sculpture', status: 'for_sale', color: '#FF6B9D', trending: true, featured: true, pinned: true, description: 'Sculptural study of radiant heat and organic geometry.', medium: 'Clay & Metal', year: 2024, createdAt: seedNow - 2 * DAY },
  { id: '16', title: 'Form & Shadow', artistId: '5', artistName: 'Arahirwa Bright', price: 110, likes: 580, category: 'Sculpture', status: 'for_sale', color: '#5B4BF5', trending: false, featured: false, description: 'Minimalist curved sculpture exploring spatial balance.', medium: 'Wood', year: 2024, createdAt: seedNow - 5 * DAY },
  { id: '17', title: 'Golden Ochre', artistId: '5', artistName: 'Arahirwa Bright', price: 65, likes: 210, category: 'Mixed Media', status: 'for_sale', color: '#E59866', trending: false, featured: false, description: 'Textured mixed media panel with earthy ochre pigments.', medium: 'Mixed Media', year: 2023, createdAt: seedNow - 8 * DAY },
  { id: '5', title: 'Roots and Rythm III', artistId: '1', artistName: 'Jane Murungi', price: 60, likes: 1200, category: 'Illustration', status: 'for_sale', color: '#F5CBA7', trending: false, featured: true, description: 'Exploring African rhythms through visual storytelling.', medium: 'Procreate', year: 2024, createdAt: seedNow - 10 * DAY },
  { id: '6', title: 'Bloom Series III', artistId: '1', artistName: 'Jane Murungi', price: 45.99, likes: 890, category: 'Illustration', status: 'for_sale', color: '#58D68D', trending: false, featured: false, description: 'Third piece in the Bloom series — nature in full expression.', medium: 'Watercolour', year: 2024, createdAt: seedNow - 9 * DAY },
  { id: '7', title: 'Still Water', artistId: '1', artistName: 'Jane Murungi', price: 89.99, likes: 2100, category: 'Watercolour', status: 'for_sale', color: '#C0A882', trending: false, featured: true, description: 'Calm and contemplative — a meditation on stillness.', medium: 'Watercolour', year: 2023, createdAt: seedNow - 8 * DAY },
  { id: '8', title: 'Mona Lisa', artistId: '1', artistName: 'Jane Murungi', price: 74.89, likes: 3400, category: 'Digital', status: 'for_sale', color: '#5B8CDB', trending: false, featured: false, description: 'A fresh digital take on the world\'s most famous portrait.', medium: 'Digital', year: 2022, createdAt: seedNow - 7 * DAY },
  { id: '9', title: 'Golden Hour', artistId: '1', artistName: 'Jane Murungi', price: 56.79, likes: 780, category: 'Illustration', status: 'for_sale', color: '#7D7D7D', trending: false, featured: false, description: 'Capturing the magic of dusk in vibrant color.', medium: 'Procreate', year: 2024, createdAt: seedNow - 6 * DAY },
  { id: '10', title: 'Dream State', artistId: '1', artistName: 'Jane Murungi', price: null, likes: 560, category: 'Illustration', status: 'not_for_sale', color: '#D4A574', trending: false, featured: false, description: 'A surreal journey through the subconscious.', medium: 'Mixed Media', year: 2024, createdAt: seedNow - 5 * DAY },
  { id: '11', title: 'Music Lesson', artistId: '1', artistName: 'Jane Murungi', price: 35.49, likes: 1100, category: 'Illustration', status: 'for_sale', color: '#E8734A', trending: false, featured: false, description: 'Celebrating music education in African communities.', medium: 'Illustration', year: 2023, createdAt: seedNow - 4 * DAY },
  { id: '12', title: 'Salvator Mundi', artistId: '1', artistName: 'Jane Murungi', price: null, likes: 4200, category: 'Digital', status: 'not_for_sale', color: '#D4AF37', trending: false, featured: true, description: 'A spiritual exploration through digital art.', medium: 'Digital', year: 2022, createdAt: seedNow - 3 * DAY },
  { id: '13', title: 'Abstract Flow', artistId: '2', artistName: 'Nadia Reyes', price: 95, likes: 5600, category: 'Abstract', status: 'for_sale', color: '#FF6B9D', trending: false, featured: true, description: 'Fluid shapes dancing in harmony.', medium: 'Acrylic', year: 2024, createdAt: seedNow - 2 * DAY },
  { id: '14', title: 'City Lights', artistId: '3', artistName: 'arahibris2011', price: 150, likes: 8900, category: 'Digital', status: 'for_sale', color: '#1A1A3E', trending: false, featured: true, description: 'Urban energy distilled into pixels.', medium: 'Digital', year: 2023, createdAt: seedNow - 1 * DAY },
];

// Social/marketplace relationship stores
let follows = [];        // { followerId, followingId }
let artworkLikes = [];   // { userId, artworkId }
let comments = [];       // { id, artworkId, userId, userName, text, createdAt }
let orders = [];         // { id, buyerId, artworkId, price, createdAt }
let collections = [];    // { id, artistId, name, artworkIds: [], createdAt }

let products = [
  { id: '1', name: 'Artist Starter Kit', description: 'Everything you need to begin your digital art journey on Earts.', price: 29, type: 'subscription', features: ['10 artwork uploads/month', 'Basic analytics', 'Community access', 'Standard storefront'], popular: false, color: '#5B4BF5' },
  { id: '2', name: 'Creator Pro', description: 'For serious artists ready to grow their audience and income.', price: 79, type: 'subscription', features: ['Unlimited uploads', 'Advanced analytics', 'Priority support', 'Custom storefront', 'Featured placement', 'Commission tools'], popular: true, color: '#FF6B9D' },
  { id: '3', name: 'Studio Enterprise', description: 'For galleries, collectives, and professional studios.', price: 199, type: 'subscription', features: ['Multi-artist management', 'White-label storefront', 'Bulk upload tools', 'Revenue sharing', 'Dedicated manager', 'API access'], popular: false, color: '#FF6B35' },
  { id: '4', name: 'Print-on-Demand', description: 'Turn your digital art into physical products automatically.', price: 0, type: 'addon', features: ['Mugs, prints, canvases', 'No upfront costs', '15% commission per sale', 'Worldwide shipping'], popular: false, color: '#00BCD4' },
  { id: '5', name: 'Promotion Boost', description: 'Get your artwork seen by thousands of new collectors.', price: 15, type: 'addon', features: ['Homepage feature slot', '7-day campaign', 'Email newsletter inclusion', 'Social promotion'], popular: false, color: '#F4D03F' },
];

// Auth routes
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SECRET = 'earts_secret_2024';

app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, email, password, role, accountType } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now().toString().slice(-4)}`;
  const user = {
    id: String(users.length + 1), username, firstName, lastName, email,
    password: hashed, role: role || 'Artist', accountType: accountType === 'collector' ? 'collector' : 'artist',
    bio: '', location: '',
    avatar: null, tags: [], tools: [], availableFor: [],
    followers: 0, following: 0, artworksSold: 0,
    coverColor: 'linear-gradient(135deg, #5B4BF5 0%, #FF6B9D 100%)'
  };
  users.push(user);
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// Users routes
app.get('/api/users', (req, res) => {
  const safe = users.map(({ password: _, ...u }) => u);
  res.json(safe);
});

app.get('/api/users/:username', (req, res) => {
  const user = users.find(u => u.username === req.params.username);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password: _, ...safeUser } = user;
  const userArtworks = artworks.filter(a => a.artistId === user.id);
  res.json({ ...safeUser, artworks: userArtworks });
});

app.patch('/api/users/me', auth, (req, res) => {
  const idx = users.findIndex(u => u.id === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { password: _, ...rest } = req.body;
  users[idx] = { ...users[idx], ...rest };
  const { password: __, ...safeUser } = users[idx];
  res.json(safeUser);
});

// Follow / unfollow
app.get('/api/users/me/following', auth, (req, res) => {
  const ids = follows.filter(f => f.followerId === req.userId).map(f => f.followingId);
  res.json(ids);
});

app.post('/api/users/:username/follow', auth, (req, res) => {
  const target = users.find(u => u.username === req.params.username);
  if (!target) return res.status(404).json({ error: 'Not found' });
  if (target.id === req.userId) return res.status(400).json({ error: "Can't follow yourself" });
  const already = follows.find(f => f.followerId === req.userId && f.followingId === target.id);
  if (already) return res.json({ following: true, followers: target.followers });
  follows.push({ followerId: req.userId, followingId: target.id });
  target.followers += 1;
  const me = users.find(u => u.id === req.userId);
  if (me) me.following += 1;
  res.json({ following: true, followers: target.followers });
});

app.post('/api/users/:username/unfollow', auth, (req, res) => {
  const target = users.find(u => u.username === req.params.username);
  if (!target) return res.status(404).json({ error: 'Not found' });
  const idx = follows.findIndex(f => f.followerId === req.userId && f.followingId === target.id);
  if (idx !== -1) {
    follows.splice(idx, 1);
    target.followers = Math.max(0, target.followers - 1);
    const me = users.find(u => u.id === req.userId);
    if (me) me.following = Math.max(0, me.following - 1);
  }
  res.json({ following: false, followers: target.followers });
});

// Artworks routes
// Attach the owning artist's username to an artwork (needed for profile links/follow actions)
const withArtistUsername = (artwork) => {
  const artist = users.find(u => u.id === artwork.artistId);
  return { ...artwork, artistUsername: artist ? artist.username : null };
};

app.get('/api/artworks', (req, res) => {
  const { category, trending, featured, artistId, search } = req.query;
  let result = [...artworks];
  if (category && category !== 'All') result = result.filter(a => a.category === category);
  if (trending === 'true') result = result.filter(a => a.trending);
  if (featured === 'true') result = result.filter(a => a.featured);
  if (artistId) result = result.filter(a => a.artistId === artistId);
  if (search) result = result.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.artistName.toLowerCase().includes(search.toLowerCase()));
  res.json(result.map(withArtistUsername));
});

app.get('/api/artworks/:id', (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Not found' });
  const artist = users.find(u => u.id === artwork.artistId);
  const { password: _, ...safeArtist } = artist || {};
  res.json({ ...artwork, artist: safeArtist });
});

app.post('/api/artworks', auth, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  const artwork = {
    id: String(artworks.length + 1),
    artistId: req.userId,
    artistName: `${user.firstName} ${user.lastName}`,
    likes: 0, trending: false, featured: false, pinned: false, createdAt: Date.now(),
    ...req.body
  };
  artworks.push(artwork);
  res.status(201).json(artwork);
});

app.patch('/api/artworks/:id', auth, (req, res) => {
  const idx = artworks.findIndex(a => a.id === req.params.id && a.artistId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Not found or unauthorized' });
  artworks[idx] = { ...artworks[idx], ...req.body };
  res.json(artworks[idx]);
});

app.delete('/api/artworks/:id', auth, (req, res) => {
  const idx = artworks.findIndex(a => a.id === req.params.id && a.artistId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Not found or unauthorized' });
  artworks.splice(idx, 1);
  res.json({ success: true });
});

// Pin an artwork to the top of your profile — only one pinned piece per artist
app.post('/api/artworks/:id/pin', auth, (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id && a.artistId === req.userId);
  if (!artwork) return res.status(404).json({ error: 'Not found or unauthorized' });
  if (artwork.pinned) {
    artwork.pinned = false;
    return res.json({ pinned: false });
  }
  artworks.forEach(a => { if (a.artistId === req.userId) a.pinned = false; });
  artwork.pinned = true;
  res.json({ pinned: true });
});

// Collections: named groups of artworks, like a Pinterest board / Behance project
app.get('/api/users/:username/collections', (req, res) => {
  const artist = users.find(u => u.username === req.params.username);
  if (!artist) return res.status(404).json({ error: 'Not found' });
  const list = collections
    .filter(c => c.artistId === artist.id)
    .map(c => ({
      ...c,
      artworks: c.artworkIds.map(id => artworks.find(a => a.id === id)).filter(Boolean)
    }));
  res.json(list);
});

app.post('/api/collections', auth, (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Collection needs a name' });
  const collection = {
    id: String(collections.length + 1), artistId: req.userId, name,
    artworkIds: Array.isArray(req.body.artworkIds) ? req.body.artworkIds : [],
    createdAt: Date.now()
  };
  collections.push(collection);
  res.status(201).json(collection);
});

app.patch('/api/collections/:id', auth, (req, res) => {
  const idx = collections.findIndex(c => c.id === req.params.id && c.artistId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Not found or unauthorized' });
  collections[idx] = { ...collections[idx], ...req.body, id: collections[idx].id, artistId: collections[idx].artistId };
  res.json(collections[idx]);
});

app.delete('/api/collections/:id', auth, (req, res) => {
  const idx = collections.findIndex(c => c.id === req.params.id && c.artistId === req.userId);
  if (idx === -1) return res.status(404).json({ error: 'Not found or unauthorized' });
  collections.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/users/me/likes', auth, (req, res) => {
  const ids = artworkLikes.filter(l => l.userId === req.userId).map(l => l.artworkId);
  res.json(ids);
});

// Full artwork objects the current user has liked/saved
app.get('/api/users/me/saved', auth, (req, res) => {
  const ids = artworkLikes.filter(l => l.userId === req.userId).map(l => l.artworkId);
  const saved = artworks.filter(a => ids.includes(a.id)).map(withArtistUsername);
  res.json(saved);
});

// Purchase history for the current user, each order paired with the artwork it was for
app.get('/api/users/me/orders', auth, (req, res) => {
  const myOrders = orders.filter(o => o.buyerId === req.userId).sort((a, b) => b.createdAt - a.createdAt);
  const enriched = myOrders.map(o => ({
    ...o,
    artwork: artworks.find(a => a.id === o.artworkId) || null
  }));
  res.json(enriched);
});

app.post('/api/artworks/:id/like', auth, (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Not found' });
  const idx = artworkLikes.findIndex(l => l.userId === req.userId && l.artworkId === artwork.id);
  if (idx !== -1) {
    artworkLikes.splice(idx, 1);
    artwork.likes = Math.max(0, artwork.likes - 1);
    return res.json({ liked: false, likes: artwork.likes });
  }
  artworkLikes.push({ userId: req.userId, artworkId: artwork.id });
  artwork.likes += 1;
  res.json({ liked: true, likes: artwork.likes });
});

// Comments
app.get('/api/artworks/:id/comments', (req, res) => {
  const list = comments.filter(c => c.artworkId === req.params.id).sort((a, b) => a.createdAt - b.createdAt);
  res.json(list);
});

app.post('/api/artworks/:id/comments', auth, (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Not found' });
  const user = users.find(u => u.id === req.userId);
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Comment cannot be empty' });
  const comment = {
    id: String(comments.length + 1), artworkId: artwork.id, userId: req.userId,
    userName: `${user.firstName} ${user.lastName}`, username: user.username,
    text, createdAt: Date.now()
  };
  comments.push(comment);
  res.status(201).json(comment);
});

// Feed: posts from people you follow, padded with discovery content if you follow few people
app.get('/api/feed', auth, (req, res) => {
  const followingIds = follows.filter(f => f.followerId === req.userId).map(f => f.followingId);
  const following = artworks.filter(a => followingIds.includes(a.artistId));
  const rest = artworks
    .filter(a => !followingIds.includes(a.artistId) && a.artistId !== req.userId)
    .sort(() => Math.random() - 0.5);
  const combined = [...following, ...rest].slice(0, 20);
  combined.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(combined.map(withArtistUsername));
});

// Purchase (mock checkout — no real payment processing)
app.post('/api/artworks/:id/purchase', auth, (req, res) => {
  const artwork = artworks.find(a => a.id === req.params.id);
  if (!artwork) return res.status(404).json({ error: 'Not found' });
  if (artwork.status !== 'for_sale') return res.status(400).json({ error: 'This piece is not for sale' });
  const { cardName, cardNumber, expiry, cvv } = req.body;
  if (!cardName || !cardNumber || !expiry || !cvv) {
    return res.status(400).json({ error: 'All payment fields are required' });
  }
  if (cardNumber.replace(/\s/g, '').length < 12) {
    return res.status(400).json({ error: 'Enter a valid card number' });
  }
  const order = {
    id: String(orders.length + 1), buyerId: req.userId, artworkId: artwork.id,
    price: artwork.price, createdAt: Date.now()
  };
  orders.push(order);
  artwork.status = 'sold';
  const artist = users.find(u => u.id === artwork.artistId);
  if (artist) artist.artworksSold = (artist.artworksSold || 0) + 1;
  res.json({ success: true, order });
});

// Products routes
app.get('/api/products', (req, res) => res.json(products));

// Stats route
app.get('/api/stats', (req, res) => {
  res.json({
    artists: '12k+', countries: '80+',
    earned: '$200k+', artworks: '48k+'
  });
});

app.listen(PORT, () => console.log(`Earts server running on port ${PORT}`));
