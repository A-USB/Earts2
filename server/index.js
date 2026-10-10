require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { CATEGORIES, ROLES, text: validateText, email: validateEmail, signupPassword, enumValue, stringArray, safeImage, price: validatePrice } = require('./validation');

const EXPLORER_INTERESTS = new Set(['Painting', 'Digital Art', 'Illustration', 'Photography', 'Sculpture', 'Mixed Media', 'Watercolour', 'Abstract']);

const {
  connectDB,
  User,
  Artwork,
  Comment,
  Order,
  Follow,
  Like,
  Collection,
  SavedArtwork,
  Notification,
  Product
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'earts_secret_2024');
if (!SECRET) throw new Error('JWT_SECRET must be set in production');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
app.set('trust proxy', 1);

// CORS configuration (allow deployed domains or localhost during development)
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '4.5mb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true, parameterLimit: 50 }));

const authRateLimits = new Map();
function limitAuthRequests(maxRequests, windowMs) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.path}:${req.ip}`;
    const current = authRateLimits.get(key);
    if (!current || current.expiresAt <= now) {
      authRateLimits.set(key, { count: 1, expiresAt: now + windowMs });
    } else if (current.count >= maxRequests) {
      res.set('Retry-After', String(Math.ceil((current.expiresAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    } else {
      current.count += 1;
    }
    if (authRateLimits.size > 10000) {
      for (const [entry, value] of authRateLimits) {
        if (value.expiresAt <= now) authRateLimits.delete(entry);
      }
    }
    next();
  };
}

async function sendPasswordResetEmail(email, resetUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Password reset email is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'Earts <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your Earts password',
      text: `We received a request to reset your Earts password. Use this link within 30 minutes: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>We received a request to reset your Earts password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>`
    })
  });
  if (!response.ok) throw new Error(`Resend rejected the email request (${response.status})`);
}

function getClientOrigin() {
  const configuredOrigin = process.env.CLIENT_ORIGIN?.split(',')[0]?.trim();
  const origin = configuredOrigin || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');
  if (!origin) throw new Error('CLIENT_ORIGIN must be configured to send password reset links');
  const parsed = new URL(origin);
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error('CLIENT_ORIGIN must use HTTPS in production');
  }
  return parsed.origin;
}

// Connect to MongoDB
connectDB();

app.use('/api', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();

  try {
    const connected = await connectDB();
    if (!connected) {
      return res.status(503).json({ error: 'Database temporarily unavailable' });
    }
    next();
  } catch {
    res.status(503).json({ error: 'Database temporarily unavailable' });
  }
});

app.use('/api', (req, res, next) => {
  if (req.body !== undefined && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }
  if (req.body === undefined) req.body = {};
  next();
});

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

function validateArtworkPayload(payload, { partial = false } = {}) {
  const allowed = new Set(['title', 'description', 'category', 'medium', 'year', 'color', 'imageUrl', 'status', 'price', 'collaborators']);
  const unknown = Object.keys(payload).find(key => !allowed.has(key));
  if (unknown) return 'One or more artwork fields are not allowed';
  const errors = [
    payload.title !== undefined || !partial ? validateText(payload.title, 'Title', 120, { required: true }) : null,
    payload.description !== undefined ? validateText(payload.description, 'Description', 3000, { multiline: true }) : null,
    payload.category !== undefined || !partial ? enumValue(payload.category, CATEGORIES, 'category') : null,
    payload.medium !== undefined ? validateText(payload.medium, 'Medium', 80) : null,
    payload.year !== undefined && (!Number.isInteger(Number(payload.year)) || Number(payload.year) < 1000 || Number(payload.year) > new Date().getFullYear() + 1)
      ? 'Year must be a valid year'
      : null,
    payload.color !== undefined && (typeof payload.color !== 'string' || !/^#[\da-f]{3,8}$/i.test(payload.color))
      ? 'Choose a valid artwork color'
      : null,
    payload.imageUrl !== undefined ? safeImage(payload.imageUrl) : null,
    payload.status !== undefined && !['for_sale', 'not_for_sale', 'sold'].includes(payload.status)
      ? 'Choose a valid artwork status'
      : null,
    payload.price !== undefined ? validatePrice(payload.price, { required: payload.status === 'for_sale' }) : null,
    payload.collaborators !== undefined && (!Array.isArray(payload.collaborators) || payload.collaborators.length > 10)
      ? 'An artwork can have at most 10 collaborators'
      : null
  ].filter(Boolean);
  if (errors.length) return errors[0];
  if (payload.collaborators) {
    for (const collaborator of payload.collaborators) {
      if (!collaborator || typeof collaborator !== 'object') return 'Collaborator details are invalid';
      const collaboratorError = [
        validateText(collaborator.id || collaborator.userId || '', 'Collaborator ID', 100, { required: true }),
        validateText(collaborator.username || '', 'Collaborator username', 40, { required: true }),
        validateText(collaborator.name || '', 'Collaborator name', 100, { required: true }),
        validateText(collaborator.role || '', 'Collaborator role', 60, { required: true })
      ].find(Boolean);
      if (collaboratorError) return collaboratorError;
    }
  }
  return null;
}

function validateChoiceArray(values, choices, label) {
  const arrayError = stringArray(values, label, { maxItems: choices.size, itemLength: 40 });
  if (arrayError) return arrayError;
  return values.every(value => choices.has(value)) ? null : `Choose valid ${label.toLowerCase()}`;
}

function validateToolString(value) {
  const error = validateText(value, 'Tools', 300);
  if (error) return error;
  const tools = value.split(',').map(tool => tool.trim()).filter(Boolean);
  if (tools.length > 10) return 'Choose at most 10 tools';
  return tools.some(tool => tool.length > 40) ? 'Each tool must be 40 characters or fewer' : null;
}

// ================= AUTH ROUTES =================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, accountType, workplace = '', location = '', tools = '', bio = '', interests = [] } = req.body;
    const errors = [
      validateText(firstName, 'First name', 30, { required: true }),
      validateText(lastName, 'Last name', 30, { required: true }),
      validateEmail(email, 60),
      signupPassword(password),
      enumValue(accountType, new Set(['artist', 'collector']), 'account type'),
      accountType === 'artist' ? enumValue(role, ROLES, 'role') : null,
      accountType === 'artist' ? validateText(workplace, 'Workplace', 100) : null,
      validateText(location, 'Location', 100),
      validateText(bio, 'Bio', 300, { multiline: true }),
      accountType === 'collector' ? validateChoiceArray(interests, EXPLORER_INTERESTS, 'Interests') : null,
      accountType === 'artist' && typeof tools === 'string'
        ? validateToolString(tools)
        : accountType === 'artist' ? stringArray(tools, 'Tools', { maxItems: 10, itemLength: 40 }) : null
    ].filter(Boolean);
    if (errors.length) return res.status(400).json({ error: errors[0] });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const baseUser = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`.replace(/[^a-z0-9_]/g, '').slice(0, 34);
    const username = `${baseUser}_${Date.now().toString().slice(-4)}`;

    const parsedTools = accountType === 'artist' && Array.isArray(tools)
      ? tools 
      : (accountType === 'artist' && typeof tools === 'string' && tools.trim() ? tools.split(',').map(t => t.trim()).filter(Boolean) : []);

    const user = await User.create({
      username,
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: accountType === 'collector' ? 'Collector' : role,
      accountType,
      workplace: accountType === 'artist' ? workplace.trim() : '',
      location: location.trim(),
      tools: parsedTools,
      bio: bio.trim(),
      tags: accountType === 'collector' ? interests : []
    });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', limitAuthRequests(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = [validateEmail(email), validateText(password, 'Password', 128, { required: true, minLength: 1 })].filter(Boolean);
    if (errors.length) return res.status(400).json({ error: errors[0] });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.post('/api/auth/forgot-password', limitAuthRequests(5, 15 * 60 * 1000), async (req, res) => {
  const genericResponse = {
    message: 'If an account exists for that email, we’ll send a password reset link.'
  };
  try {
    const { email } = req.body;
    const emailError = validateEmail(email, 60);
    if (emailError) return res.status(400).json({ error: emailError });
    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({ error: 'Password reset email is not configured yet.' });
    }
    let clientOrigin;
    try {
      clientOrigin = getClientOrigin();
    } catch {
      return res.status(503).json({ error: 'Password reset email is not configured yet.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    try {
      const resetUrl = new URL('/reset-password', clientOrigin);
      resetUrl.hash = new URLSearchParams({ token: rawToken }).toString();
      await sendPasswordResetEmail(user.email, resetUrl.toString());
    } catch (emailError) {
      console.error(`Password reset email delivery failed: ${emailError.message}`);
    }
    res.json(genericResponse);
  } catch (err) {
    console.error('Password reset request failed:', err.message);
    res.json(genericResponse);
  }
});

app.post('/api/auth/reset-password', limitAuthRequests(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'This reset link is invalid or expired. Request a new one.' });
    }
    const passwordError = signupPassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ error: 'This reset link is invalid or expired. Request a new one.' });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    res.json({ message: 'Your password has been reset. You can now sign in.' });
  } catch (err) {
    console.error('Password reset failed:', err.message);
    res.status(500).json({ error: 'Unable to reset your password right now. Please try again.' });
  }
});

app.post('/api/auth/google', limitAuthRequests(20, 15 * 60 * 1000), async (req, res) => {
  try {
    const { credential, accountType, role } = req.body;
    if (!GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google sign-in is not configured' });
    if (typeof credential !== 'string' || credential.length > 12000) {
      return res.status(400).json({ error: 'A valid Google credential is required' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Google sign-in could not verify your account. Please try again.' });
    }
    if (!payload?.email || payload.email_verified !== true || !payload.sub) {
      return res.status(401).json({ error: 'Use a verified Google account to sign in.' });
    }

    const email = payload.email;
    const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Creator';
    const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';
    const avatar = payload.picture || null;
    const googleId = payload.sub;
    const googleErrors = [
      validateEmail(email, 60),
      validateText(firstName || 'Creator', 'First name', 30, { required: true }),
      validateText(lastName || '', 'Last name', 30),
      enumValue(accountType || 'artist', new Set(['artist', 'collector']), 'account type'),
      (accountType || 'artist') === 'artist' ? enumValue(role || 'Artist', ROLES, 'role') : null,
      avatar != null && (typeof avatar !== 'string' || avatar.length > 2048 || !/^https:\/\//i.test(avatar))
        ? 'Google profile image URL is invalid'
        : null,
    ].filter(Boolean);
    if (googleErrors.length) return res.status(400).json({ error: googleErrors[0] });

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Google has verified control of this email, so linking is safe.
      let updated = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) await user.save();
    } else {
      // Create new user via Google
      const cleanFirst = (firstName || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanLast = (lastName || 'artist').toLowerCase().replace(/[^a-z0-9]/g, '');
      const baseUser = `${cleanFirst}_${cleanLast}`.slice(0, 34) || 'creator';
      let username = `${baseUser}_${Date.now().toString().slice(-4)}`;

      // Ensure username uniqueness
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        username = `${baseUser}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await User.create({
        username,
        firstName: firstName || 'Creator',
        lastName: lastName || '',
        email: normalizedEmail,
        avatar: avatar || null,
        googleId: googleId || null,
        role: role || 'Artist',
        accountType: accountType === 'collector' ? 'collector' : 'artist'
      });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= USERS ROUTES =================
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ followers: -1 });
    res.json(users.map(u => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const artworks = await Artwork.find({
      $or: [{ artistId: user.id }, { artistUsername: user.username }]
    }).sort({ pinned: -1, createdAt: -1 });

    res.json({ ...user.toJSON(), artworks: artworks.map(a => a.toJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/me', auth, async (req, res) => {
  try {
    const allowedFields = new Set(['firstName', 'lastName', 'bio', 'location', 'role', 'tags', 'tools', 'availableFor', 'coverColor']);
    const unknownField = Object.keys(req.body).find(key => !allowedFields.has(key));
    if (unknownField) return res.status(400).json({ error: 'One or more profile fields are not editable' });
    const currentUser = await User.findById(req.userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });
    if (currentUser.accountType === 'collector' && ['role', 'tools', 'availableFor'].some(field => field in req.body)) {
      return res.status(400).json({ error: 'Explorer profiles cannot edit artist-only fields' });
    }
    const updates = { ...req.body };
    const errors = [
      updates.firstName !== undefined ? validateText(updates.firstName, 'First name', 30, { required: true }) : null,
      updates.lastName !== undefined ? validateText(updates.lastName, 'Last name', 30, { required: true }) : null,
      updates.bio !== undefined ? validateText(updates.bio, 'Bio', 500, { multiline: true }) : null,
      updates.location !== undefined ? validateText(updates.location, 'Location', 100) : null,
      updates.role !== undefined ? enumValue(updates.role, ROLES, 'role') : null,
      updates.tags !== undefined ? validateChoiceArray(updates.tags, new Set(['Painting', 'Digital Art', 'Illustration', 'Photography', 'Sculpture', 'Mixed Media', 'Watercolour', 'Abstract', 'Digital art', 'Oil', 'Printmaking']), 'Tags') : null,
      updates.tools !== undefined ? validateChoiceArray(updates.tools, new Set(['Procreate', 'Photoshop', 'Illustrator', 'Ink', 'Watercolour', 'Oil paint', 'Canvas', 'Clay', 'Metal', 'Wood']), 'Tools') : null,
      updates.availableFor !== undefined ? validateChoiceArray(updates.availableFor, new Set(['Commissions', 'Collaborations', 'Workshop', 'Exhibitions', 'Residencies']), 'Availability') : null,
      updates.coverColor !== undefined && (typeof updates.coverColor !== 'string' || updates.coverColor.length > 160 || !/^(#[\da-f]{3,8}|linear-gradient\([\d\s.,%#a-f()deg-]+\))$/i.test(updates.coverColor))
        ? 'Choose a valid profile cover color'
        : null
    ].filter(Boolean);
    if (errors.length) return res.status(400).json({ error: errors[0] });
    for (const field of ['firstName', 'lastName', 'bio', 'location']) {
      if (typeof updates[field] === 'string') updates[field] = updates[field].trim();
    }
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Follow / Unfollow
app.get('/api/users/me/following', auth, async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.userId });
    res.json(follows.map(f => f.followingId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:username/follow', auth, async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ error: 'Target user not found' });
    if (target.accountType === 'collector') return res.status(403).json({ error: 'Explorer profiles cannot be followed' });
    if (target.id === req.userId) return res.status(400).json({ error: "Can't follow yourself" });

    const existing = await Follow.findOne({ followerId: req.userId, followingId: target.id });
    if (existing) {
      return res.json({ following: true, followers: target.followers });
    }

    await Follow.create({ followerId: req.userId, followingId: target.id });
    target.followers = (target.followers || 0) + 1;
    await target.save();

    await User.findByIdAndUpdate(req.userId, { $inc: { following: 1 } });

    // Send notification
    const currentUser = await User.findById(req.userId);
    if (currentUser) {
      await Notification.create({
        userId: target.id,
        type: 'follow',
        actorName: `${currentUser.firstName} ${currentUser.lastName}`,
        actorUsername: currentUser.username,
        text: 'started following your creative portfolio'
      });
    }

    res.json({ following: true, followers: target.followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:username/unfollow', auth, async (req, res) => {
  try {
    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ error: 'Target user not found' });

    const removed = await Follow.findOneAndDelete({ followerId: req.userId, followingId: target.id });
    if (removed) {
      target.followers = Math.max(0, (target.followers || 1) - 1);
      await target.save();
      await User.findByIdAndUpdate(req.userId, { $inc: { following: -1 } });
    }

    res.json({ following: false, followers: target.followers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me/likes', auth, async (req, res) => {
  try {
    const likes = await Like.find({ userId: req.userId });
    res.json(likes.map(l => l.artworkId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me/saved', auth, async (req, res) => {
  try {
    const savedRecords = await SavedArtwork.find({ userId: req.userId }).sort({ createdAt: -1 });
    const artworkIds = savedRecords.map(record => record.artworkId);
    const saved = await Artwork.find({ _id: { $in: artworkIds } });
    res.json(saved.map(a => a.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me/saved/ids', auth, async (req, res) => {
  try {
    const saved = await SavedArtwork.find({ userId: req.userId });
    res.json(saved.map(record => record.artworkId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/me/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.userId }).sort({ createdAt: -1 });
    const enriched = await Promise.all(orders.map(async (o) => {
      const artwork = await Artwork.findById(o.artworkId);
      return {
        ...o.toJSON(),
        artwork: artwork ? artwork.toJSON() : null
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ARTWORKS ROUTES =================
app.get('/api/artworks', async (req, res) => {
  try {
    const { category, trending, featured, artistId, search } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (trending === 'true') filter.trending = true;
    if (featured === 'true') filter.featured = true;
    if (artistId) filter.artistId = artistId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
        { medium: { $regex: search, $options: 'i' } }
      ];
    }

    const artworks = await Artwork.find(filter).sort({ pinned: -1, createdAt: -1 });
    res.json(artworks.map(a => a.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/artworks/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    let artist = await User.findById(artwork.artistId);
    if (!artist && artwork.artistUsername) {
      artist = await User.findOne({ username: artwork.artistUsername });
    }

    res.json({
      ...artwork.toJSON(),
      artist: artist ? artist.toJSON() : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.accountType === 'collector') return res.status(403).json({ error: 'Explorer accounts cannot upload artwork' });
    const validationError = validateArtworkPayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    const artistName = `${user.firstName} ${user.lastName}`;
    const artistUsername = user.username;

    const artwork = await Artwork.create({
      ...req.body,
      artistId: req.userId,
      artistName,
      artistUsername,
      likes: 0,
      trending: false,
      featured: false,
      pinned: false,
      createdAt: Date.now()
    });

    const followers = await Follow.find({ followingId: req.userId });
    if (followers.length) {
      await Notification.insertMany(followers.map(({ followerId }) => ({
        userId: followerId,
        type: 'new_artwork',
        actorName: `${user.firstName} ${user.lastName}`,
        actorUsername: user.username,
        text: 'shared a new artwork',
        targetTitle: artwork.title,
        targetId: artwork.id,
        targetColor: artwork.color
      })));
    }

    res.status(201).json(artwork.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create artwork' });
  }
});

app.post('/api/artworks/:id/save', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    const existing = await SavedArtwork.findOne({ userId: req.userId, artworkId: artwork.id });
    if (existing) {
      await SavedArtwork.findOneAndDelete({ userId: req.userId, artworkId: artwork.id });
      return res.json({ saved: false });
    }
    await SavedArtwork.create({ userId: req.userId, artworkId: artwork.id });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save artwork' });
  }
});

app.patch('/api/artworks/:id', auth, async (req, res) => {
  try {
    const validationError = validateArtworkPayload(req.body, { partial: true });
    if (validationError) return res.status(400).json({ error: validationError });
    const artwork = await Artwork.findOneAndUpdate(
      { _id: req.params.id, artistId: req.userId },
      req.body,
      { new: true }
    );
    if (!artwork) return res.status(404).json({ error: 'Artwork not found or unauthorized' });
    res.json(artwork.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/artworks/:id', auth, async (req, res) => {
  try {
    const removed = await Artwork.findOneAndDelete({ _id: req.params.id, artistId: req.userId });
    if (!removed) return res.status(404).json({ error: 'Artwork not found or unauthorized' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pin artwork
app.post('/api/artworks/:id/pin', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findOne({ _id: req.params.id, artistId: req.userId });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found or unauthorized' });

    if (artwork.pinned) {
      artwork.pinned = false;
      await artwork.save();
      return res.json({ pinned: false });
    }

    await Artwork.updateMany({ artistId: req.userId }, { pinned: false });
    artwork.pinned = true;
    await artwork.save();
    res.json({ pinned: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like / Unlike artwork
app.post('/api/artworks/:id/like', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const existing = await Like.findOne({ userId: req.userId, artworkId: artwork.id });
    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      artwork.likes = Math.max(0, (artwork.likes || 1) - 1);
      await artwork.save();
      return res.json({ liked: false, likes: artwork.likes });
    }

    await Like.create({ userId: req.userId, artworkId: artwork.id });
    artwork.likes = (artwork.likes || 0) + 1;
    await artwork.save();

    // Send notification to the artist (if not self)
    if (artwork.artistId !== req.userId) {
      const currentUser = await User.findById(req.userId);
      if (currentUser) {
        await Notification.create({
          userId: artwork.artistId,
          type: 'like',
          actorName: `${currentUser.firstName} ${currentUser.lastName}`,
          actorUsername: currentUser.username,
          text: 'liked your piece',
          targetTitle: artwork.title,
          targetId: artwork.id,
          targetColor: artwork.color
        });
      }
    }

    res.json({ liked: true, likes: artwork.likes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= COMMENTS ROUTES =================
app.get('/api/artworks/:id/comments', async (req, res) => {
  try {
    const list = await Comment.find({ artworkId: req.params.id }).sort({ createdAt: 1 });
    res.json(list.map(c => c.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks/:id/comments', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

    const user = await User.findById(req.userId);
    const textError = validateText(req.body.text, 'Comment', 600, { required: true, multiline: true });
    if (textError) return res.status(400).json({ error: textError });
    const text = req.body.text.trim();

    const comment = await Comment.create({
      artworkId: artwork.id,
      userId: req.userId,
      userName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      text,
      createdAt: Date.now()
    });

    // Notify artist
    if (artwork.artistId !== req.userId) {
      await Notification.create({
        userId: artwork.artistId,
        type: 'comment',
        actorName: `${user.firstName} ${user.lastName}`,
        actorUsername: user.username,
        text: `commented: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}" on`,
        targetTitle: artwork.title,
        targetId: artwork.id,
        targetColor: artwork.color
      });
    }

    res.status(201).json(comment.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= COLLECTIONS ROUTES =================
app.get('/api/users/:username/collections', async (req, res) => {
  try {
    const artist = await User.findOne({ username: req.params.username });
    if (!artist) return res.status(404).json({ error: 'Artist not found' });

    const list = await Collection.find({ artistId: artist.id }).sort({ createdAt: -1 });
    const enriched = await Promise.all(list.map(async (c) => {
      const artworks = await Artwork.find({ _id: { $in: c.artworkIds } });
      return {
        ...c.toJSON(),
        artworks: artworks.map(a => a.toJSON())
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/collections', auth, async (req, res) => {
  try {
    const nameError = validateText(req.body.name, 'Collection name', 60, { required: true });
    if (nameError) return res.status(400).json({ error: nameError });
    const name = req.body.name.trim();
    if (req.body.artworkIds !== undefined && (!Array.isArray(req.body.artworkIds) || req.body.artworkIds.length > 100 || req.body.artworkIds.some(id => typeof id !== 'string' || id.length > 100))) {
      return res.status(400).json({ error: 'A collection can contain at most 100 valid artwork IDs' });
    }

    const collection = await Collection.create({
      artistId: req.userId,
      name,
      artworkIds: Array.isArray(req.body.artworkIds) ? req.body.artworkIds : [],
      createdAt: Date.now()
    });

    res.status(201).json(collection.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/collections/:id', auth, async (req, res) => {
  try {
    if (Object.keys(req.body).some(key => !['name', 'artworkIds'].includes(key))) {
      return res.status(400).json({ error: 'One or more collection fields are not editable' });
    }
    if (req.body.name !== undefined) {
      const nameError = validateText(req.body.name, 'Collection name', 60, { required: true });
      if (nameError) return res.status(400).json({ error: nameError });
    }
    if (req.body.artworkIds !== undefined && (!Array.isArray(req.body.artworkIds) || req.body.artworkIds.length > 100 || req.body.artworkIds.some(id => typeof id !== 'string' || id.length > 100))) {
      return res.status(400).json({ error: 'A collection can contain at most 100 valid artwork IDs' });
    }
    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, artistId: req.userId },
      req.body,
      { new: true }
    );
    if (!collection) return res.status(404).json({ error: 'Collection not found or unauthorized' });
    res.json(collection.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/collections/:id', auth, async (req, res) => {
  try {
    const removed = await Collection.findOneAndDelete({ _id: req.params.id, artistId: req.userId });
    if (!removed) return res.status(404).json({ error: 'Collection not found or unauthorized' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= FEED ROUTE =================
app.get('/api/feed', auth, async (req, res) => {
  try {
    const follows = await Follow.find({ followerId: req.userId });
    const followingIds = follows.map(f => f.followingId);

    const followingArtworks = await Artwork.find({
      artistId: { $in: followingIds }
    }).sort({ createdAt: -1 });

    const otherArtworks = await Artwork.find({
      artistId: { $nin: [...followingIds, req.userId] }
    }).limit(20).sort({ createdAt: -1 });

    const combined = [...followingArtworks, ...otherArtworks].slice(0, 30);
    res.json(combined.map(a => a.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PURCHASE ROUTE =================
app.post('/api/artworks/:id/purchase', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    if (artwork.status !== 'for_sale') return res.status(400).json({ error: 'This piece is not for sale' });

    const { cardName, cardNumber, expiry, cvv } = req.body;
    const cleanNumber = typeof cardNumber === 'string' ? cardNumber.replace(/[\s-]/g, '') : '';
    const paymentErrors = [
      validateText(cardName, 'Name on card', 80, { required: true }),
      !/^\d{12,19}$/.test(cleanNumber) ? 'Enter a valid card number' : null,
      typeof expiry !== 'string' || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) ? 'Enter a valid expiry date (MM/YY)' : null,
      typeof cvv !== 'string' || !/^\d{3,4}$/.test(cvv) ? 'Enter a valid security code' : null
    ].filter(Boolean);
    if (paymentErrors.length) return res.status(400).json({ error: paymentErrors[0] });

    const order = await Order.create({
      buyerId: req.userId,
      artworkId: artwork.id,
      price: artwork.price || 0,
      cardLast4: cleanNumber.slice(-4),
      createdAt: Date.now()
    });

    artwork.status = 'sold';
    await artwork.save();

    await User.findByIdAndUpdate(artwork.artistId, { $inc: { artworksSold: 1 } });

    // Send sale notification to artist
    const buyer = await User.findById(req.userId);
    if (buyer) {
      await Notification.create({
        userId: artwork.artistId,
        type: 'sale',
        actorName: `${buyer.firstName} ${buyer.lastName}`,
        actorUsername: buyer.username,
        text: 'purchased your artwork',
        targetTitle: artwork.title,
        targetId: artwork.id,
        targetPrice: artwork.price,
        targetColor: artwork.color
      });
      await Notification.create({
        userId: buyer.id,
        type: 'purchase',
        actorName: 'Earts',
        text: 'Your purchase was confirmed for',
        targetTitle: artwork.title,
        targetId: artwork.id,
        targetPrice: artwork.price,
        targetColor: artwork.color
      });
    }

    res.json({ success: true, order: order.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= NOTIFICATIONS ROUTES =================
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const types = user.accountType === 'collector'
      ? ['purchase', 'new_artwork']
      : ['like', 'comment', 'sale', 'follow', 'feature', 'new_artwork'];
    const list = await Notification.find({ userId: req.userId, type: { $in: types } }).sort({ createdAt: -1 }).limit(50);
    res.json(list.map(n => n.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );
    res.json(notif ? notif.toJSON() : { success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= PRODUCTS & STATS =================
app.get('/api/products', async (req, res) => {
  try {
    const prods = await Product.find();
    res.json(prods.map(p => p.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    artists: '12k+',
    countries: '80+',
    earned: '$200k+',
    artworks: '48k+'
  });
});

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large. Artwork images must be 3 MB or smaller.' });
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) return res.status(400).json({ error: 'Request contains invalid JSON' });
  console.error('Unhandled request error:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`✨ Earts server running on port ${PORT}`);
});
