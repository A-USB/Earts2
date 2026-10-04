const bcrypt = require('bcryptjs');

const DAY = 86400000;
const seedNow = Date.now();

const INITIAL_USERS = [
  {
    id: 'user_jane_murungi',
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
    id: 'user_nadia_reyes',
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
    id: 'user_arahibris',
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
    id: 'user_hussina_patel',
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
    id: 'user_arahirwa_bright',
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
  { id: 'art_1', title: 'A Calm Day In Rome', artistUsername: 'nadia_reyes', price: 120, likes: 23700, category: 'Painting', status: 'for_sale', color: '#F4D03F', trending: true, featured: true, description: 'A peaceful afternoon captured in warm Mediterranean tones.', medium: 'Oil on Canvas', year: 2024, createdAt: seedNow - 14 * DAY },
  { id: 'art_2', title: 'The Starry Night', artistUsername: 'arahibris2011', price: 85, likes: 490, category: 'Digital', status: 'for_sale', color: '#00BCD4', trending: true, featured: false, description: 'A digital reimagining of the night sky.', medium: 'Digital', year: 2023, createdAt: seedNow - 13 * DAY },
  { id: 'art_3', title: 'Guernica', artistUsername: 'hussina_patel', price: 230, likes: 11600, category: 'Mixed Media', status: 'for_sale', color: '#9B59B6', trending: true, featured: true, description: 'An homage to the iconic anti-war statement.', medium: 'Mixed Media', year: 2024, createdAt: seedNow - 12 * DAY },
  { id: 'art_4', title: 'Creation of Adam', artistUsername: 'arahibris2011', price: 44.99, likes: 6774, category: 'Digital', status: 'for_sale', color: '#A9D18E', trending: true, featured: false, description: 'A modern digital take on the Sistine Chapel masterpiece.', medium: 'Digital', year: 2023, createdAt: seedNow - 11 * DAY },
  { id: 'art_5', title: 'Sun 2', artistUsername: 'arahirwa_bright', price: 79.99, likes: 340, category: 'Sculpture', status: 'for_sale', color: '#FF6B9D', trending: true, featured: true, pinned: true, description: 'Sculptural study of radiant heat and organic geometry.', medium: 'Clay & Metal', year: 2024, createdAt: seedNow - 2 * DAY },
  { id: 'art_6', title: 'Form & Shadow', artistUsername: 'arahirwa_bright', price: 110, likes: 580, category: 'Sculpture', status: 'for_sale', color: '#5B4BF5', trending: false, featured: false, description: 'Minimalist curved sculpture exploring spatial balance.', medium: 'Wood', year: 2024, createdAt: seedNow - 5 * DAY },
  { id: 'art_7', title: 'Golden Ochre', artistUsername: 'arahirwa_bright', price: 65, likes: 210, category: 'Mixed Media', status: 'for_sale', color: '#E59866', trending: false, featured: false, description: 'Textured mixed media panel with earthy ochre pigments.', medium: 'Mixed Media', year: 2023, createdAt: seedNow - 8 * DAY },
  { id: 'art_8', title: 'Roots and Rythm III', artistUsername: 'jane_murungi', price: 60, likes: 1200, category: 'Illustration', status: 'for_sale', color: '#F5CBA7', trending: false, featured: true, description: 'Exploring African rhythms through visual storytelling.', medium: 'Procreate', year: 2024, createdAt: seedNow - 10 * DAY },
  { id: 'art_9', title: 'Bloom Series III', artistUsername: 'jane_murungi', price: 45.99, likes: 890, category: 'Illustration', status: 'for_sale', color: '#58D68D', trending: false, featured: false, description: 'Third piece in the Bloom series — nature in full expression.', medium: 'Watercolour', year: 2024, createdAt: seedNow - 9 * DAY },
  { id: 'art_10', title: 'Still Water', artistUsername: 'jane_murungi', price: 89.99, likes: 2100, category: 'Watercolour', status: 'for_sale', color: '#C0A882', trending: false, featured: true, description: 'Calm and contemplative — a meditation on stillness.', medium: 'Watercolour', year: 2023, createdAt: seedNow - 8 * DAY },
  { id: 'art_11', title: 'Mona Lisa', artistUsername: 'jane_murungi', price: 74.89, likes: 3400, category: 'Digital', status: 'for_sale', color: '#5B8CDB', trending: false, featured: false, description: 'A fresh digital take on the world\'s most famous portrait.', medium: 'Digital', year: 2022, createdAt: seedNow - 7 * DAY },
  { id: 'art_12', title: 'Golden Hour', artistUsername: 'jane_murungi', price: 56.79, likes: 780, category: 'Illustration', status: 'for_sale', color: '#7D7D7D', trending: false, featured: false, description: 'Capturing the magic of dusk in vibrant color.', medium: 'Procreate', year: 2024, createdAt: seedNow - 6 * DAY },
  { id: 'art_13', title: 'Dream State', artistUsername: 'jane_murungi', price: null, likes: 560, category: 'Illustration', status: 'not_for_sale', color: '#D4A574', trending: false, featured: false, description: 'A surreal journey through the subconscious.', medium: 'Mixed Media', year: 2024, createdAt: seedNow - 5 * DAY },
  { id: 'art_14', title: 'Music Lesson', artistUsername: 'jane_murungi', price: 35.49, likes: 1100, category: 'Illustration', status: 'for_sale', color: '#E8734A', trending: false, featured: false, description: 'Celebrating music education in African communities.', medium: 'Illustration', year: 2023, createdAt: seedNow - 4 * DAY },
  { id: 'art_15', title: 'Salvator Mundi', artistUsername: 'jane_murungi', price: null, likes: 4200, category: 'Digital', status: 'not_for_sale', color: '#D4AF37', trending: false, featured: true, description: 'A spiritual exploration through digital art.', medium: 'Digital', year: 2022, createdAt: seedNow - 3 * DAY },
  { id: 'art_16', title: 'Abstract Flow', artistUsername: 'nadia_reyes', price: 95, likes: 5600, category: 'Abstract', status: 'for_sale', color: '#FF6B9D', trending: false, featured: true, description: 'Fluid shapes dancing in harmony.', medium: 'Acrylic', year: 2024, createdAt: seedNow - 2 * DAY },
  { id: 'art_17', title: 'City Lights', artistUsername: 'arahibris2011', price: 150, likes: 8900, category: 'Digital', status: 'for_sale', color: '#1A1A3E', trending: false, featured: true, description: 'Urban energy distilled into pixels.', medium: 'Digital', year: 2023, createdAt: seedNow - 1 * DAY },
];

const INITIAL_PRODUCTS = [
  { id: 'prod_1', name: 'Artist Starter Kit', description: 'Everything you need to begin your digital art journey on Earts.', price: 29, type: 'subscription', features: ['10 artwork uploads/month', 'Basic analytics', 'Community access', 'Standard storefront'], popular: false, color: '#5B4BF5' },
  { id: 'prod_2', name: 'Creator Pro', description: 'For serious artists ready to grow their audience and income.', price: 79, type: 'subscription', features: ['Unlimited uploads', 'Advanced analytics', 'Priority support', 'Custom storefront', 'Featured placement', 'Commission tools'], popular: true, color: '#FF6B9D' },
  { id: 'prod_3', name: 'Studio Enterprise', description: 'For galleries, collectives, and professional studios.', price: 199, type: 'subscription', features: ['Multi-artist management', 'White-label storefront', 'Bulk upload tools', 'Revenue sharing', 'Dedicated manager', 'API access'], popular: false, color: '#FF6B35' },
  { id: 'prod_4', name: 'Print-on-Demand', description: 'Turn your digital art into physical products automatically.', price: 0, type: 'addon', features: ['Mugs, prints, canvases', 'No upfront costs', '15% commission per sale', 'Worldwide shipping'], popular: false, color: '#00BCD4' },
  { id: 'prod_5', name: 'Promotion Boost', description: 'Get your artwork seen by thousands of new collectors.', price: 15, type: 'addon', features: ['Homepage feature slot', '7-day campaign', 'Email newsletter inclusion', 'Social promotion'], popular: false, color: '#F4D03F' },
];

class MemoryDoc {
  constructor(data, store) {
    Object.assign(this, data);
    if (!this.id && !this._id) {
      this.id = 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    } else if (this._id && !this.id) {
      this.id = this._id.toString();
    }
    this._id = this.id;
    if (!this.createdAt) this.createdAt = new Date();
    Object.defineProperty(this, '_store', { value: store, enumerable: false, writable: true });
  }

  toJSON() {
    const copy = { ...this };
    copy.id = this.id;
    delete copy._id;
    delete copy.__v;
    if (copy.password) delete copy.password;
    return copy;
  }

  async save() {
    if (this._store) {
      const idx = this._store.findIndex(d => d.id === this.id);
      if (idx !== -1) {
        this._store[idx] = this;
      } else {
        this._store.push(this);
      }
    }
    return this;
  }
}

function matchQuery(doc, query = {}) {
  if (!query || Object.keys(query).length === 0) return true;

  for (const [key, val] of Object.entries(query)) {
    if (key === '$or' && Array.isArray(val)) {
      const anyMatch = val.some(subQ => matchQuery(doc, subQ));
      if (!anyMatch) return false;
      continue;
    }

    const docVal = (key === '_id' || key === 'id') ? (doc.id || doc._id) : doc[key];

    if (val && typeof val === 'object' && !(val instanceof Date)) {
      if (val.$in && Array.isArray(val.$in)) {
        const inMatch = val.$in.some(target => String(target) === String(docVal));
        if (!inMatch) return false;
        continue;
      }
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || '');
        if (!regex.test(String(docVal || ''))) return false;
        continue;
      }
      if (val.$ne !== undefined) {
        if (docVal === val.$ne) return false;
        continue;
      }
    }

    if (key === '_id' || key === 'id') {
      if (String(docVal) !== String(val)) return false;
    } else if (typeof val === 'string' && typeof docVal === 'string') {
      if (docVal.toLowerCase() !== val.toLowerCase()) return false;
    } else if (docVal !== val) {
      return false;
    }
  }

  return true;
}

function sortDocs(docs, sortObj = {}) {
  if (!sortObj || Object.keys(sortObj).length === 0) return docs;
  const entries = Object.entries(sortObj);
  return [...docs].sort((a, b) => {
    for (const [key, dir] of entries) {
      const valA = a[key] ?? 0;
      const valB = b[key] ?? 0;
      if (valA < valB) return dir === 1 || dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 1 || dir === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

class QueryCursor extends Promise {
  constructor(executor, getDocs) {
    super(executor);
    this._getDocs = getDocs;
    this._sortObj = null;
    this._limitNum = null;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  limit(num) {
    this._limitNum = num;
    return this;
  }

  then(onFulfilled, onRejected) {
    let docs = this._getDocs();
    if (this._sortObj) docs = sortDocs(docs, this._sortObj);
    if (this._limitNum) docs = docs.slice(0, this._limitNum);
    return Promise.resolve(docs).then(onFulfilled, onRejected);
  }
}

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  find(filter = {}) {
    const getDocs = () => {
      return this.data.filter(doc => matchQuery(doc, filter));
    };
    return new QueryCursor(
      (resolve) => resolve(getDocs()),
      getDocs
    );
  }

  async findOne(filter = {}) {
    const doc = this.data.find(d => matchQuery(d, filter));
    return doc || null;
  }

  async findById(id) {
    if (!id) return null;
    return this.findOne({ _id: id });
  }

  async findByIdAndUpdate(id, updates = {}, options = {}) {
    const doc = await this.findById(id);
    if (!doc) return null;

    if (updates.$inc) {
      for (const [k, v] of Object.entries(updates.$inc)) {
        doc[k] = (doc[k] || 0) + v;
      }
    }
    for (const [k, v] of Object.entries(updates)) {
      if (k !== '$inc' && k !== '$set') doc[k] = v;
      if (k === '$set') Object.assign(doc, v);
    }
    await doc.save();
    return doc;
  }

  async findOneAndUpdate(filter = {}, updates = {}, options = {}) {
    const doc = await this.findOne(filter);
    if (!doc) return null;
    if (updates.$inc) {
      for (const [k, v] of Object.entries(updates.$inc)) {
        doc[k] = (doc[k] || 0) + v;
      }
    }
    for (const [k, v] of Object.entries(updates)) {
      if (k !== '$inc' && k !== '$set') doc[k] = v;
      if (k === '$set') Object.assign(doc, v);
    }
    await doc.save();
    return doc;
  }

  async findOneAndDelete(filter = {}) {
    const idx = this.data.findIndex(d => matchQuery(d, filter));
    if (idx === -1) return null;
    const [deleted] = this.data.splice(idx, 1);
    return deleted;
  }

  async findByIdAndDelete(id) {
    return this.findOneAndDelete({ _id: id });
  }

  async create(docData) {
    const doc = new MemoryDoc(docData, this.data);
    this.data.push(doc);
    return doc;
  }

  async insertMany(docsData) {
    const created = docsData.map(d => new MemoryDoc(d, this.data));
    this.data.push(...created);
    return created;
  }

  async countDocuments(filter = {}) {
    return this.data.filter(d => matchQuery(d, filter)).length;
  }

  async deleteMany(filter = {}) {
    const initialLen = this.data.length;
    this.data = this.data.filter(d => !matchQuery(d, filter));
    return { deletedCount: initialLen - this.data.length };
  }
}

const memoryStore = {
  users: new MemoryCollection('users'),
  artworks: new MemoryCollection('artworks'),
  products: new MemoryCollection('products'),
  comments: new MemoryCollection('comments'),
  orders: new MemoryCollection('orders'),
  follows: new MemoryCollection('follows'),
  likes: new MemoryCollection('likes'),
  collections: new MemoryCollection('collections'),
  notifications: new MemoryCollection('notifications'),
};

let memorySeeded = false;

async function seedMemoryStore() {
  if (memorySeeded) return;
  memorySeeded = true;

  const defaultHashedPassword = await bcrypt.hash('password123', 10);
  const createdUsers = await memoryStore.users.insertMany(
    INITIAL_USERS.map(u => ({ ...u, password: defaultHashedPassword }))
  );

  const userMap = {};
  createdUsers.forEach(u => {
    userMap[u.username] = u;
  });

  const artworksToInsert = INITIAL_ARTWORKS.map(art => {
    const user = userMap[art.artistUsername] || createdUsers[0];
    return {
      ...art,
      artistId: user.id,
      artistName: `${user.firstName} ${user.lastName}`,
      artistUsername: user.username
    };
  });
  await memoryStore.artworks.insertMany(artworksToInsert);
  await memoryStore.products.insertMany(INITIAL_PRODUCTS);

  console.log('⚡ In-Memory demo store initialized! Demo accounts ready.');
}

// Model Proxy Helper: Routes calls to Mongoose if connected, else MemoryCollection
function createModelProxy(modelName, mongooseModel, memoryCollection) {
  return new Proxy(mongooseModel, {
    get(target, prop) {
      const isMongooseConnected = Boolean(
        target.db && target.db.readyState === 1
      );

      if (isMongooseConnected) {
        return target[prop];
      }

      // Delegate to memoryCollection
      if (typeof memoryCollection[prop] === 'function') {
        return (...args) => memoryCollection[prop](...args);
      }
      return target[prop];
    }
  });
}

module.exports = {
  memoryStore,
  seedMemoryStore,
  createModelProxy,
  INITIAL_USERS,
  INITIAL_ARTWORKS,
  INITIAL_PRODUCTS
};
