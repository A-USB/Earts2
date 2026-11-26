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
  Product,
  Report,
  Message,
  Commission,
  CollabInvite,
  Review,
  VerificationRequest,
  ArtworkView,
  TagFollow
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'earts_secret_2024');
if (!SECRET) throw new Error('JWT_SECRET must be set in production');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const moderatorUserIds = new Set((process.env.MODERATOR_USER_IDS || '').split(',').map(value => value.trim()).filter(Boolean));
const AVATAR_SEEDS = new Set(Array.from({ length: 12 }, (_, index) => `earts-avatar-${String(index + 1).padStart(2, '0')}`));
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

const requireModerator = (req, res, next) => {
  if (!moderatorUserIds.has(req.userId)) return res.status(403).json({ error: 'Moderator access is not enabled for this account.' });
  next();
};

const COLLAB_ROLES = [
  'Co-Creator', 'Illustrator', 'Colorist', 'Line Artist',
  '3D Sculptor', 'Art Director', 'Concept Artist', 'Visual Designer'
];

// Tags are lowercase words (letters, numbers, hyphens), 2-24 characters, at most 5 per artwork
const MAX_TAGS = 5;
const TAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}-]{1,23}$/u;

function normalizeTag(raw) {
  return String(raw ?? '').trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/-$/, '');
}

function parseTags(raw) {
  if (!Array.isArray(raw)) return { error: 'Tags must be a list.' };
  if (raw.length > MAX_TAGS) return { error: `Use at most ${MAX_TAGS} tags.` };
  const tags = [];
  for (const item of raw) {
    if (typeof item !== 'string') return { error: 'Tags must be text.' };
    const tag = normalizeTag(item);
    if (!tag) continue;
    if (!TAG_PATTERN.test(tag)) return { error: `"${item.slice(0, 24)}" is not a valid tag. Use 2-24 letters, numbers or hyphens.` };
    if (!tags.includes(tag)) tags.push(tag);
  }
  return { tags };
}

function validateArtworkPayload(payload, { partial = false } = {}) {
  const allowed = new Set(['title', 'description', 'category', 'medium', 'year', 'color', 'imageUrl', 'status', 'price', 'collaborators', 'tags']);
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
    payload.tags !== undefined ? (parseTags(payload.tags).error || null) : null,
    payload.collaborators !== undefined && (!Array.isArray(payload.collaborators) || payload.collaborators.length > 10)
      ? 'An artwork can have at most 10 collaborators'
      : null
  ].filter(Boolean);
  if (errors.length) return errors[0];
  if (payload.collaborators) {
    const seen = new Set();
    let totalShare = 0;
    for (const collaborator of payload.collaborators) {
      if (!collaborator || typeof collaborator !== 'object') return 'Collaborator details are invalid';
      const id = String(collaborator.id || collaborator.userId || '');
      const idError = validateText(id, 'Collaborator', 100, { required: true });
      if (idError) return idError;
      if (seen.has(id)) return 'Each collaborator can only be added once';
      seen.add(id);
      if (!COLLAB_ROLES.includes(collaborator.role)) return 'Choose a valid collaborator role';
      const share = collaborator.sharePercent === undefined || collaborator.sharePercent === '' ? 0 : Number(collaborator.sharePercent);
      if (!Number.isInteger(share) || share < 0 || share > 100) return 'Revenue shares must be whole numbers between 0 and 100';
      totalShare += share;
    }
    if (totalShare > 100) return 'The revenue shares add up to more than 100%';
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
    const googleId = payload.sub;
    const googleErrors = [
      validateEmail(email, 60),
      validateText(firstName || 'Creator', 'First name', 30, { required: true }),
      validateText(lastName || '', 'Last name', 30),
      enumValue(accountType || 'artist', new Set(['artist', 'collector']), 'account type'),
      (accountType || 'artist') === 'artist' ? enumValue(role || 'Artist', ROLES, 'role') : null,
    ].filter(Boolean);
    if (googleErrors.length) return res.status(400).json({ error: googleErrors[0] });

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    const isNewUser = !user;

    if (user) {
      // Google has verified control of this email, so linking is safe.
      let updated = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (user.avatar && !user.avatarSeed) {
        user.avatar = null;
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
        avatar: null,
        avatarSeed: null,
        googleId: googleId || null,
        role: role || 'Artist',
        accountType: accountType === 'collector' ? 'collector' : 'artist'
      });
    }

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: user.toJSON(), isNewUser });
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

app.get('/api/users/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 100);
    const filter = { accountType: 'artist' };
    if (query) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(escapedQuery, 'i');
      filter.$or = [
        { username: match },
        { firstName: match },
        { lastName: match },
        { role: match },
        { location: match },
        { tags: match },
        { tools: match }
      ];
    }
    const artists = await User.find(filter)
      .select('username firstName lastName role accountType bio location avatar avatarSeed followers tags tools verified')
      .sort({ followers: -1, createdAt: -1 })
      .limit(40);
    const ids = artists.map(artist => artist.id);
    const allReviews = ids.length ? await Review.find({ artistId: { $in: ids } }) : [];
    res.json(artists.map(artist => {
      const { id, username, firstName, lastName, role, accountType, bio, location, avatar, avatarSeed, followers, tags, tools, verified } = artist.toJSON();
      const rating = summarizeReviews(allReviews.filter(review => review.artistId === id));
      return { id, username, firstName, lastName, role, accountType, bio, location, avatar, avatarSeed, followers, tags, tools, verified: Boolean(verified), ratingAverage: rating.average, ratingCount: rating.count };
    }));
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

    const rating = user.accountType === 'artist' ? summarizeReviews(await Review.find({ artistId: user.id })) : null;
    res.json({
      ...user.toJSON(),
      ratingAverage: rating ? rating.average : null,
      ratingCount: rating ? rating.count : 0,
      artworks: artworks.map(a => withImageUrl(req, a.toJSON()))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/me', auth, async (req, res) => {
  try {
    const allowedFields = new Set(['firstName', 'lastName', 'bio', 'location', 'role', 'tags', 'tools', 'availableFor', 'coverColor', 'avatar', 'avatarSeed']);
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
      updates.avatar !== undefined ? safeImage(updates.avatar) : null,
      typeof updates.avatar === 'string' && updates.avatar && Buffer.byteLength(updates.avatar.split(',')[1] || '', 'base64') > 128 * 1024
        ? 'Profile photos must be 128 KB or smaller after processing'
        : null,
      updates.avatarSeed !== undefined && updates.avatarSeed !== null && !AVATAR_SEEDS.has(updates.avatarSeed)
        ? 'Choose one of the available Earts avatars'
        : null,
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
    res.json(saved.map(a => withImageUrl(req, a.toJSON())));
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
        artwork: artwork ? withImageUrl(req, artwork.toJSON()) : null
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const ORDER_TRANSITIONS = {
  demo: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

const ORDER_STATUS_TEXT = {
  confirmed: 'confirmed your order for',
  shipped: 'marked your order as shipped:',
  delivered: 'marked your order as delivered:',
  cancelled: 'cancelled your order for'
};

// Orders for pieces the signed-in artist sells, plus orders where they hold a co-creator share
app.get('/api/users/me/sales', auth, async (req, res) => {
  try {
    const mine = await Artwork.find({ artistId: req.userId });
    const artworkIds = mine.map(a => String(a.id));
    const clauses = [{ sellerId: req.userId }, { participantIds: req.userId }];
    if (artworkIds.length) clauses.push({ artworkId: { $in: artworkIds } });
    const orders = await Order.find({ $or: clauses }).sort({ createdAt: -1 });

    const items = await Promise.all(orders.map(async (o) => {
      const [artwork, buyer] = await Promise.all([Artwork.findById(o.artworkId), User.findById(o.buyerId)]);
      const json = o.toJSON();
      const isSeller = json.sellerId === req.userId || artwork?.artistId === req.userId;
      const split = Array.isArray(json.split) ? json.split : [];
      const myShare = split.find(entry => String(entry.userId) === req.userId) || null;
      return {
        ...json,
        viewerRole: isSeller ? 'seller' : 'collaborator',
        allowedStatuses: isSeller ? (ORDER_TRANSITIONS[json.status] || []) : [],
        myShare,
        // What this person earns from the order: their snapshot share, or the full price for older orders
        myAmount: myShare ? myShare.amount : (isSeller ? Number(json.price) || 0 : 0),
        artwork: artwork ? (({ id, title, color, imageUrl, price }) => ({ id, title, color, imageUrl, price }))(withImageUrl(req, artwork.toJSON())) : null,
        buyer: buyer
          ? { id: buyer.id, username: buyer.username, firstName: buyer.firstName, lastName: buyer.lastName, avatar: buyer.avatar || null, avatarSeed: buyer.avatarSeed || null }
          : null
      };
    }));

    const counted = items.filter(o => o.status !== 'cancelled');
    res.json({
      items,
      summary: {
        total: items.length,
        open: items.filter(o => ['demo', 'confirmed', 'shipped'].includes(o.status)).length,
        delivered: items.filter(o => o.status === 'delivered').length,
        revenue: counted.reduce((sum, o) => sum + (Number(o.myAmount) || 0), 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller moves an order along: demo -> confirmed -> shipped -> delivered (or cancelled)
app.patch('/api/orders/:id/status', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const artwork = await Artwork.findById(order.artworkId);
    const isSeller = order.sellerId === req.userId || artwork?.artistId === req.userId;
    if (!isSeller) return res.status(403).json({ error: 'Only the seller can update this order.' });

    const next = req.body?.status;
    if (!(ORDER_TRANSITIONS[order.status] || []).includes(next)) {
      return res.status(400).json({ error: `An order that is ${order.status} cannot be changed to ${next}.` });
    }

    let trackingNote = order.trackingNote || '';
    if (req.body?.trackingNote !== undefined) {
      if (typeof req.body.trackingNote !== 'string' || req.body.trackingNote.length > 200) {
        return res.status(400).json({ error: 'Delivery note must be 200 characters or fewer.' });
      }
      trackingNote = req.body.trackingNote.trim();
    }

    order.status = next;
    order.trackingNote = trackingNote;
    order.sellerId = order.sellerId || req.userId;
    order.updatedAt = Date.now();
    await order.save();

    const seller = await User.findById(req.userId);
    await Notification.create({
      userId: order.buyerId,
      type: 'purchase',
      actorName: seller ? (`${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.username) : 'The artist',
      actorUsername: seller?.username,
      text: ORDER_STATUS_TEXT[next],
      targetTitle: artwork?.title || 'your artwork',
      targetId: order.artworkId,
      targetPrice: order.price,
      targetColor: artwork?.color
    });

    res.json({ success: true, order: { ...order.toJSON(), allowedStatuses: ORDER_TRANSITIONS[next] || [] } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= COMMISSIONS =================
// requested -> quoted -> in_progress -> delivered -> completed (or declined / cancelled along the way)
const COMMISSION_ACTIONS = {
  quote:    { from: ['requested', 'quoted'], by: 'artist', to: 'quoted' },
  decline:  { from: ['requested', 'quoted'], by: 'artist', to: 'declined' },
  accept:   { from: ['quoted'], by: 'client', to: 'in_progress' },
  deliver:  { from: ['in_progress'], by: 'artist', to: 'delivered' },
  revise:   { from: ['delivered'], by: 'client', to: 'in_progress' },
  complete: { from: ['delivered'], by: 'client', to: 'completed' },
  cancel:   { from: ['requested', 'quoted', 'in_progress'], by: 'either', to: 'cancelled' }
};

const COMMISSION_NOTIFICATION_TEXT = {
  request: 'sent you a commission request:',
  quote: 'sent you a quote for',
  decline: 'declined your commission request:',
  accept: 'accepted your quote for',
  deliver: 'delivered your commission:',
  revise: 'asked for changes on',
  complete: 'marked this commission as completed:',
  cancel: 'cancelled the commission'
};

const commissionAllowedActions = (commission, role) =>
  Object.entries(COMMISSION_ACTIONS)
    .filter(([, def]) => def.from.includes(commission.status) && (def.by === 'either' || def.by === role))
    .map(([action]) => action);

const commissionPerson = (user) => user
  ? {
      id: user.id,
      username: user.username,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      avatar: user.avatar || null,
      avatarSeed: user.avatarSeed || null
    }
  : null;

async function notifyCommission(recipientId, actor, kind, commission, price) {
  try {
    await Notification.create({
      userId: recipientId,
      type: 'commission',
      actorName: actor ? (`${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.username) : 'Someone',
      actorUsername: actor?.username,
      text: COMMISSION_NOTIFICATION_TEXT[kind],
      targetTitle: commission.title,
      targetPrice: typeof price === 'number' ? price : undefined
    });
  } catch (err) {
    console.error('Could not send commission notification:', err.message);
  }
}

// Open a commission request with an artist
app.post('/api/commissions', auth, async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = new Set(['artistId', 'title', 'brief', 'budget', 'deadline']);
    if (Object.keys(body).some(key => !allowed.has(key))) return res.status(400).json({ error: 'One or more fields are not allowed' });

    const titleError = validateText(body.title, 'Title', 100, { required: true });
    if (titleError) return res.status(400).json({ error: titleError });
    const briefError = validateText(body.brief, 'Brief', 2000, { required: true, multiline: true });
    if (briefError) return res.status(400).json({ error: briefError });
    if (String(body.title).trim().length < 3) return res.status(400).json({ error: 'Give your commission a short title (at least 3 characters).' });
    if (String(body.brief).trim().length < 20) return res.status(400).json({ error: 'Describe what you would like in at least 20 characters so the artist can quote properly.' });

    let budget = null;
    if (body.budget !== undefined && body.budget !== null && body.budget !== '') {
      budget = Number(body.budget);
      if (!Number.isFinite(budget) || budget < 1 || budget > 1000000) return res.status(400).json({ error: 'Budget must be between $1 and $1,000,000.' });
    }

    let deadline = null;
    if (body.deadline) {
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(body.deadline)) ? Date.parse(`${body.deadline}T23:59:59Z`) : NaN;
      if (!Number.isFinite(parsed)) return res.status(400).json({ error: 'Choose a valid deadline date.' });
      if (parsed < Date.now()) return res.status(400).json({ error: 'The deadline must be in the future.' });
      if (parsed > Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) return res.status(400).json({ error: 'The deadline can be at most two years away.' });
      deadline = parsed;
    }

    const artist = await User.findById(String(body.artistId || ''));
    if (!artist || artist.accountType !== 'artist') return res.status(404).json({ error: 'Artist not found' });
    if (artist.id === req.userId) return res.status(400).json({ error: 'You cannot commission yourself.' });
    if (!(artist.availableFor || []).includes('Commissions')) {
      return res.status(400).json({ error: 'This artist is not taking commissions right now.' });
    }

    const client = await User.findById(req.userId);
    if (!client) return res.status(401).json({ error: 'Please sign in again.' });

    const openStatuses = ['requested', 'quoted'];
    const myOpen = await Commission.find({ clientId: req.userId, status: { $in: openStatuses } });
    if (myOpen.length >= 10) return res.status(429).json({ error: 'You have 10 requests waiting for a reply. Wait for a response before sending more.' });
    if (myOpen.filter(c => c.artistId === artist.id).length >= 3) {
      return res.status(429).json({ error: 'You already have open requests with this artist. Wait for their reply first.' });
    }

    const now = Date.now();
    const commission = await Commission.create({
      clientId: req.userId,
      artistId: artist.id,
      title: String(body.title).trim(),
      brief: String(body.brief).trim(),
      budget,
      deadline,
      status: 'requested',
      activity: [{ at: now, by: 'client', action: 'request', note: '' }],
      createdAt: now,
      updatedAt: now
    });

    await notifyCommission(artist.id, client, 'request', commission, budget === null ? undefined : budget);
    res.status(201).json({ ...commission.toJSON(), role: 'client', allowedActions: commissionAllowedActions(commission, 'client') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// role=sent (requests I made) or role=received (requests made to me as an artist)
app.get('/api/commissions', auth, async (req, res) => {
  try {
    const role = req.query.role === 'received' ? 'artist' : 'client';
    const filter = role === 'artist' ? { artistId: req.userId } : { clientId: req.userId };
    const commissions = await Commission.find(filter).sort({ updatedAt: -1 });
    const items = await Promise.all(commissions.map(async (c) => {
      const [client, artist] = await Promise.all([User.findById(c.clientId), User.findById(c.artistId)]);
      return {
        ...c.toJSON(),
        role,
        allowedActions: commissionAllowedActions(c, role),
        client: commissionPerson(client),
        artist: commissionPerson(artist)
      };
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move a commission along. body: { action, price?, days?, note? }
app.patch('/api/commissions/:id/action', auth, async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    const role = commission
      ? (commission.clientId === req.userId ? 'client' : commission.artistId === req.userId ? 'artist' : null)
      : null;
    if (!commission || !role) return res.status(404).json({ error: 'Commission not found' });

    const { action } = req.body || {};
    const def = COMMISSION_ACTIONS[action];
    if (!def) return res.status(400).json({ error: 'Unknown action.' });
    if (!def.from.includes(commission.status)) {
      return res.status(400).json({ error: `This commission is ${commission.status.replace('_', ' ')}, so you cannot do that now.` });
    }
    if (def.by !== 'either' && def.by !== role) return res.status(403).json({ error: 'You cannot do that on this commission.' });

    let note = '';
    if (req.body.note !== undefined && req.body.note !== null && req.body.note !== '') {
      if (typeof req.body.note !== 'string' || req.body.note.trim().length > 500) return res.status(400).json({ error: 'Notes must be 500 characters or fewer.' });
      note = req.body.note.trim();
    }
    if (action === 'revise' && note.length < 5) return res.status(400).json({ error: 'Tell the artist what you would like changed.' });

    let price = null;
    if (action === 'quote') {
      price = Number(req.body.price);
      const days = Number(req.body.days);
      if (!Number.isFinite(price) || price < 1 || price > 1000000) return res.status(400).json({ error: 'Quote a price between $1 and $1,000,000.' });
      if (!Number.isInteger(days) || days < 1 || days > 365) return res.status(400).json({ error: 'Estimated time must be between 1 and 365 days.' });
      commission.quotePrice = price;
      commission.quoteDays = days;
      commission.quoteNote = note;
    }
    if (action === 'accept' || action === 'complete') price = commission.quotePrice;

    commission.status = def.to;
    commission.updatedAt = Date.now();
    commission.activity = [...(commission.activity || []), { at: Date.now(), by: role, action, note, price }].slice(-50);
    await commission.save();

    const actor = await User.findById(req.userId);
    const recipientId = role === 'client' ? commission.artistId : commission.clientId;
    await notifyCommission(recipientId, actor, action, commission, price === null ? undefined : price);

    const [client, artist] = await Promise.all([User.findById(commission.clientId), User.findById(commission.artistId)]);
    res.json({
      ...commission.toJSON(),
      role,
      allowedActions: commissionAllowedActions(commission, role),
      client: commissionPerson(client),
      artist: commissionPerson(artist)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CO-CREATION INVITES =================
const displayName = (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;

// Turns the browser's collaborator list into real artist accounts. Names and usernames are never trusted from the client.
async function resolveCollaborators(ownerId, incoming) {
  const list = [];
  for (const entry of incoming || []) {
    const id = String(entry.id || entry.userId);
    if (id === String(ownerId)) return { error: 'You cannot add yourself as a collaborator.' };
    let user = null;
    try { user = await User.findById(id); } catch { user = null; }
    if (!user || user.accountType !== 'artist') return { error: 'One of the collaborators could not be found.' };
    const share = entry.sharePercent === undefined || entry.sharePercent === '' ? 0 : Number(entry.sharePercent);
    list.push({ user, role: entry.role, sharePercent: share });
  }
  return { list };
}

async function notifyCollab(recipientId, actor, type, text, artwork, extra = {}) {
  try {
    await Notification.create({
      userId: recipientId,
      type,
      actorName: displayName(actor),
      actorUsername: actor.username,
      text,
      targetTitle: artwork.title,
      targetId: artwork.id,
      targetColor: artwork.color,
      ...extra
    });
  } catch (err) {
    console.error('Could not send collaboration notification:', err.message);
  }
}

// Only accepted co-creators appear on the public artwork
async function refreshPublicCollaborators(artworkId) {
  const accepted = await CollabInvite.find({ artworkId, status: 'accepted' });
  await Artwork.findOneAndUpdate(
    { _id: artworkId },
    { collaborators: accepted.map(inv => ({ userId: inv.userId, username: inv.username, name: inv.name, role: inv.role })) }
  );
}

// Makes the invites match the owner's list: new people are invited, changed terms need fresh consent, removed people are dropped
async function syncCollabInvites(artwork, owner, resolved) {
  const existing = await CollabInvite.find({ artworkId: artwork.id });
  const keep = new Set(resolved.map(item => String(item.user.id)));
  for (const invite of existing) {
    if (!keep.has(String(invite.userId))) await CollabInvite.findOneAndDelete({ _id: invite.id });
  }
  for (const item of resolved) {
    const prior = existing.find(invite => String(invite.userId) === String(item.user.id));
    const extra = { collabRole: item.role, sharePercent: item.sharePercent };
    if (!prior) {
      await CollabInvite.create({
        artworkId: artwork.id,
        ownerId: owner.id,
        userId: item.user.id,
        username: item.user.username,
        name: displayName(item.user),
        role: item.role,
        sharePercent: item.sharePercent,
        status: 'pending',
        invitedAt: Date.now()
      });
      await notifyCollab(item.user.id, owner, 'collab_invite', 'invited you to co-create', artwork, extra);
    } else if (prior.role !== item.role || prior.sharePercent !== item.sharePercent) {
      await CollabInvite.findOneAndUpdate(
        { _id: prior.id },
        { role: item.role, sharePercent: item.sharePercent, status: 'pending', respondedAt: null, invitedAt: Date.now() }
      );
      await notifyCollab(item.user.id, owner, 'collab_invite', 'updated the terms of your co-creation invite for', artwork, extra);
    }
  }
  await refreshPublicCollaborators(artwork.id);
}

// Owner sees every invite and the split; an invitee only sees their own invite
app.get('/api/artworks/:id/collab', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    const invites = await CollabInvite.find({ artworkId: artwork.id });
    if (artwork.artistId === req.userId) {
      const sum = (list) => list.reduce((total, inv) => total + (Number(inv.sharePercent) || 0), 0);
      return res.json({
        role: 'owner',
        invites: invites.map(inv => inv.toJSON()),
        ownerPercent: 100 - sum(invites.filter(inv => inv.status === 'accepted')),
        plannedOwnerPercent: 100 - sum(invites)
      });
    }
    const mine = invites.find(inv => String(inv.userId) === req.userId);
    if (!mine) return res.status(404).json({ error: 'No invitation found' });
    res.json({ role: 'collaborator', invite: mine.toJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks/:id/collab/respond', auth, async (req, res) => {
  try {
    if (typeof req.body?.accept !== 'boolean') return res.status(400).json({ error: 'Choose accept or decline.' });
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    const invite = await CollabInvite.findOne({ artworkId: artwork.id, userId: req.userId });
    if (!invite) return res.status(404).json({ error: 'No invitation found' });

    const status = req.body.accept ? 'accepted' : 'declined';
    if (invite.status !== status) {
      invite.status = status;
      invite.respondedAt = Date.now();
      await invite.save();
      await refreshPublicCollaborators(artwork.id);
      const me = await User.findById(req.userId);
      if (me) {
        await notifyCollab(
          artwork.artistId, me, 'collab_response',
          req.body.accept ? 'accepted your co-creation invite for' : 'declined your co-creation invite for',
          artwork
        );
      }
    }
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/artworks/:id/collab/:userId', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findOne({ _id: req.params.id, artistId: req.userId });
    if (!artwork) return res.status(404).json({ error: 'Artwork not found or unauthorized' });
    const invite = await CollabInvite.findOne({ artworkId: artwork.id, userId: req.params.userId });
    if (!invite) return res.status(404).json({ error: 'Invitation not found' });
    await CollabInvite.findOneAndDelete({ _id: invite.id });
    await refreshPublicCollaborators(artwork.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= REVIEWS =================
function summarizeReviews(list) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const review of list) {
    const rating = Number(review.rating);
    if (distribution[rating] !== undefined) {
      distribution[rating] += 1;
      total += rating;
    }
  }
  const count = list.length;
  return { count, average: count ? Math.round((total / count) * 10) / 10 : null, distribution };
}

// A review is only allowed for a delivered order or a completed commission that belongs to the reviewer
async function findReviewTarget(userId, source, sourceId) {
  try {
    if (source === 'order') {
      const order = await Order.findById(sourceId);
      if (!order || order.buyerId !== userId) return { error: 'We could not find that purchase.' };
      if (order.status !== 'delivered') return { error: 'You can review a purchase once the artist has marked it delivered.' };
      const artwork = await Artwork.findById(order.artworkId);
      const artistId = order.sellerId || artwork?.artistId;
      if (!artistId) return { error: 'We could not find the artist for that purchase.' };
      return { artistId, context: artwork?.title || 'Artwork' };
    }
    if (source === 'commission') {
      const commission = await Commission.findById(sourceId);
      if (!commission || commission.clientId !== userId) return { error: 'We could not find that commission.' };
      if (commission.status !== 'completed') return { error: 'You can review a commission once it is completed.' };
      return { artistId: commission.artistId, context: commission.title };
    }
  } catch {
    return { error: 'We could not find that purchase.' };
  }
  return { error: 'Choose what you are reviewing.' };
}

function validateReviewFields({ rating, comment }, { requireRating }) {
  if (requireRating || rating !== undefined) {
    const value = Number(rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) return 'Choose a rating from 1 to 5 stars.';
  }
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') return 'Your review must be text.';
    if (comment.trim().length > 1000) return 'Reviews can be at most 1000 characters.';
  }
  return null;
}

const reviewerCard = (user) => user
  ? { id: user.id, username: user.username, name: displayName(user), avatar: user.avatar || null, avatarSeed: user.avatarSeed || null }
  : null;

// What the signed-in person can still review
app.get('/api/reviews/pending', auth, async (req, res) => {
  try {
    const [orders, commissions, mine] = await Promise.all([
      Order.find({ buyerId: req.userId, status: 'delivered' }),
      Commission.find({ clientId: req.userId, status: 'completed' }),
      Review.find({ reviewerId: req.userId })
    ]);
    const done = new Set(mine.map(review => `${review.source}:${review.sourceId}`));
    const pending = [];

    for (const order of orders) {
      if (done.has(`order:${order.id}`)) continue;
      const artwork = await Artwork.findById(order.artworkId);
      const artist = await User.findById(order.sellerId || artwork?.artistId);
      if (!artist) continue;
      pending.push({ source: 'order', sourceId: order.id, title: artwork?.title || 'Artwork', completedAt: order.updatedAt || order.createdAt, artist: reviewerCard(artist) });
    }
    for (const commission of commissions) {
      if (done.has(`commission:${commission.id}`)) continue;
      const artist = await User.findById(commission.artistId);
      if (!artist) continue;
      pending.push({ source: 'commission', sourceId: commission.id, title: commission.title, completedAt: commission.updatedAt, artist: reviewerCard(artist) });
    }
    pending.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: an artist's reviews and rating summary
app.get('/api/users/:username/reviews', async (req, res) => {
  try {
    const artist = await User.findOne({ username: req.params.username });
    if (!artist || artist.accountType !== 'artist') return res.status(404).json({ error: 'Artist not found' });
    const reviews = (await Review.find({ artistId: artist.id })).sort((a, b) => b.createdAt - a.createdAt);

    const reviewerIds = [...new Set(reviews.map(review => review.reviewerId))];
    const reviewers = await Promise.all(reviewerIds.map(id => User.findById(id).catch(() => null)));
    const byId = new Map(reviewers.filter(Boolean).map(user => [user.id, reviewerCard(user)]));

    res.json({
      ...summarizeReviews(reviews),
      items: reviews.map(review => ({ ...review.toJSON(), reviewer: byId.get(review.reviewerId) || null }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', auth, async (req, res) => {
  try {
    const body = req.body || {};
    if (Object.keys(body).some(key => !['source', 'sourceId', 'rating', 'comment'].includes(key))) {
      return res.status(400).json({ error: 'One or more fields are not allowed' });
    }
    const fieldError = validateReviewFields(body, { requireRating: true });
    if (fieldError) return res.status(400).json({ error: fieldError });

    const target = await findReviewTarget(req.userId, body.source, String(body.sourceId || ''));
    if (target.error) return res.status(400).json({ error: target.error });
    if (target.artistId === req.userId) return res.status(400).json({ error: 'You cannot review yourself.' });

    const existing = await Review.findOne({ source: body.source, sourceId: String(body.sourceId) });
    if (existing) return res.status(409).json({ error: 'You already reviewed this one. You can edit your review on the artist’s profile.' });

    const now = Date.now();
    const review = await Review.create({
      artistId: target.artistId,
      reviewerId: req.userId,
      source: body.source,
      sourceId: String(body.sourceId),
      context: String(target.context).slice(0, 120),
      rating: Number(body.rating),
      comment: (body.comment || '').trim(),
      createdAt: now,
      updatedAt: now
    });

    const reviewer = await User.findById(req.userId);
    if (reviewer) {
      await Notification.create({
        userId: target.artistId,
        type: 'review',
        actorName: displayName(reviewer),
        actorUsername: reviewer.username,
        text: `left a ${review.rating}-star review for "${review.context}"`
      }).catch(() => null);
    }
    res.status(201).json(review.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/reviews/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.reviewerId !== req.userId) return res.status(404).json({ error: 'Review not found' });
    const body = req.body || {};
    if (Object.keys(body).some(key => !['rating', 'comment'].includes(key))) {
      return res.status(400).json({ error: 'One or more fields are not allowed' });
    }
    const fieldError = validateReviewFields(body, { requireRating: false });
    if (fieldError) return res.status(400).json({ error: fieldError });

    if (body.rating !== undefined) review.rating = Number(body.rating);
    if (body.comment !== undefined) review.comment = String(body.comment || '').trim();
    review.edited = true;
    review.updatedAt = Date.now();
    await review.save();
    res.json(review.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.reviewerId !== req.userId) return res.status(404).json({ error: 'Review not found' });
    await Review.findOneAndDelete({ _id: review.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The artist answers a review (one public reply, which they can edit or remove)
app.put('/api/reviews/:id/reply', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.artistId !== req.userId) return res.status(404).json({ error: 'Review not found' });
    const reply = typeof req.body?.reply === 'string' ? req.body.reply.trim() : '';
    if (reply.length < 2) return res.status(400).json({ error: 'Write a short reply.' });
    if (reply.length > 500) return res.status(400).json({ error: 'Replies can be at most 500 characters.' });

    const isNew = !review.reply;
    review.reply = reply;
    review.repliedAt = Date.now();
    await review.save();

    if (isNew) {
      const artist = await User.findById(req.userId);
      if (artist) {
        await Notification.create({
          userId: review.reviewerId,
          type: 'review_reply',
          actorName: displayName(artist),
          actorUsername: artist.username,
          text: `replied to your review of "${review.context}"`
        }).catch(() => null);
      }
    }
    res.json(review.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reviews/:id/reply', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review || review.artistId !== req.userId) return res.status(404).json({ error: 'Review not found' });
    review.reply = '';
    review.repliedAt = null;
    await review.save();
    res.json(review.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= VERIFICATION =================
const VERIFICATION_MIN_ARTWORKS = 3;
const VERIFICATION_MIN_BIO = 30;
const VERIFICATION_MIN_ACCOUNT_DAYS = 7;
const VERIFICATION_RETRY_DAYS = 14;

async function verificationEligibility(user) {
  const artworkCount = (await Artwork.find({ artistId: user.id })).length;
  const ageDays = (Date.now() - new Date(user.createdAt || Date.now()).getTime()) / 86400000;
  const checks = [
    { id: 'photo', label: 'Upload a profile photo', met: Boolean(user.avatar) },
    { id: 'bio', label: `Write a bio of at least ${VERIFICATION_MIN_BIO} characters`, met: String(user.bio || '').trim().length >= VERIFICATION_MIN_BIO },
    { id: 'artworks', label: `Share at least ${VERIFICATION_MIN_ARTWORKS} artworks`, met: artworkCount >= VERIFICATION_MIN_ARTWORKS },
    { id: 'age', label: `Have an account that is at least ${VERIFICATION_MIN_ACCOUNT_DAYS} days old`, met: ageDays >= VERIFICATION_MIN_ACCOUNT_DAYS }
  ];
  return { checks, eligible: checks.every(check => check.met), artworkCount };
}

async function setArtistVerified(user, verified) {
  user.verified = verified;
  user.verifiedAt = verified ? Date.now() : null;
  await user.save();
  // Artworks carry a copy of the flag so every card and feed can show the badge without extra lookups
  await Artwork.updateMany({ artistId: user.id }, { artistVerified: verified });
}

async function notifyVerification(userId, text, actorName = 'Earts team') {
  try {
    await Notification.create({ userId, type: 'verification', actorName, text });
  } catch (err) {
    console.error('Could not send verification notification:', err.message);
  }
}

// The signed-in artist's verification status, application and what they still need
app.get('/api/verification/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.accountType !== 'artist') return res.status(403).json({ error: 'Only artist accounts can be verified.' });

    const requests = (await VerificationRequest.find({ userId: user.id })).sort((a, b) => b.createdAt - a.createdAt);
    const latest = requests[0] || null;
    const eligibility = await verificationEligibility(user);

    let retryAfter = null;
    if (latest && latest.status === 'rejected') {
      const until = (latest.resolvedAt || latest.createdAt) + VERIFICATION_RETRY_DAYS * 86400000;
      if (until > Date.now()) retryAfter = until;
    }
    res.json({
      verified: Boolean(user.verified),
      verifiedAt: user.verifiedAt || null,
      request: latest ? latest.toJSON() : null,
      checks: eligibility.checks,
      canApply: !user.verified && eligibility.eligible && !(latest && latest.status === 'pending') && !retryAfter,
      retryAfter
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.accountType !== 'artist') return res.status(403).json({ error: 'Only artist accounts can be verified.' });
    if (user.verified) return res.status(400).json({ error: 'Your account is already verified.' });

    const body = req.body || {};
    if (Object.keys(body).some(key => !['statement', 'links'].includes(key))) return res.status(400).json({ error: 'One or more fields are not allowed' });
    const statement = typeof body.statement === 'string' ? body.statement.trim() : '';
    if (statement.length < 20) return res.status(400).json({ error: 'Tell us a little about yourself and your work (at least 20 characters).' });
    if (statement.length > 600) return res.status(400).json({ error: 'Keep your statement under 600 characters.' });

    const rawLinks = Array.isArray(body.links) ? body.links : [];
    if (rawLinks.length > 3) return res.status(400).json({ error: 'Add at most 3 links.' });
    const links = [];
    for (const raw of rawLinks) {
      const value = String(raw || '').trim();
      if (!value) continue;
      let parsed;
      try { parsed = new URL(value); } catch { return res.status(400).json({ error: `"${value.slice(0, 40)}" is not a valid link.` }); }
      if (!['http:', 'https:'].includes(parsed.protocol) || value.length > 200) return res.status(400).json({ error: 'Links must start with http:// or https:// and be under 200 characters.' });
      links.push(parsed.toString());
    }

    const requests = await VerificationRequest.find({ userId: user.id });
    if (requests.some(request => request.status === 'pending')) return res.status(409).json({ error: 'You already have a request waiting for review.' });
    const lastRejected = requests.filter(request => request.status === 'rejected').sort((a, b) => b.createdAt - a.createdAt)[0];
    if (lastRejected && (lastRejected.resolvedAt || lastRejected.createdAt) + VERIFICATION_RETRY_DAYS * 86400000 > Date.now()) {
      return res.status(429).json({ error: `You can apply again ${VERIFICATION_RETRY_DAYS} days after a decision.` });
    }

    const eligibility = await verificationEligibility(user);
    if (!eligibility.eligible) return res.status(400).json({ error: 'Finish the requirements below before applying.' });

    const request = await VerificationRequest.create({ userId: user.id, statement, links, status: 'pending', createdAt: Date.now() });
    await Promise.all([...moderatorUserIds].map(id => notifyVerification(id, 'requested a verified badge', displayName(user))));
    res.status(201).json(request.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/moderation/verifications', auth, requireModerator, async (req, res) => {
  try {
    const status = ['pending', 'approved', 'rejected', 'revoked'].includes(req.query.status) ? req.query.status : 'pending';
    const requests = (await VerificationRequest.find({ status })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
    const items = await Promise.all(requests.map(async (request) => {
      const user = await User.findById(request.userId).catch(() => null);
      const artworks = user ? await Artwork.find({ artistId: user.id }) : [];
      return {
        ...request.toJSON(),
        user: user ? {
          id: user.id,
          username: user.username,
          name: displayName(user),
          avatar: user.avatar || null,
          avatarSeed: user.avatarSeed || null,
          role: user.role,
          location: user.location,
          followers: user.followers,
          artworksSold: user.artworksSold,
          joinedAt: new Date(user.createdAt || Date.now()).getTime(),
          artworkCount: artworks.length
        } : null
      };
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Unable to load verification requests right now.' });
  }
});

// decision: approve | reject (pending requests) or revoke (approved requests)
app.patch('/api/moderation/verifications/:id', auth, requireModerator, async (req, res) => {
  try {
    const body = req.body || {};
    if (Object.keys(body).some(key => !['decision', 'note'].includes(key))) return res.status(400).json({ error: 'One or more fields are not allowed' });
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length > 300) return res.status(400).json({ error: 'Notes can be at most 300 characters.' });

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    const user = await User.findById(request.userId);
    if (!user) return res.status(404).json({ error: 'This account no longer exists.' });

    const transitions = { approve: ['pending', 'approved'], reject: ['pending', 'rejected'], revoke: ['approved', 'revoked'] };
    const transition = transitions[body.decision];
    if (!transition) return res.status(400).json({ error: 'Choose approve, reject or revoke.' });
    if (request.status !== transition[0]) return res.status(400).json({ error: `This request is already ${request.status}.` });
    if (body.decision === 'reject' && note.length < 3) return res.status(400).json({ error: 'Give the artist a short reason so they know what to improve.' });

    request.status = transition[1];
    request.reviewerId = req.userId;
    request.reviewerNote = note;
    request.resolvedAt = Date.now();
    await request.save();

    if (body.decision === 'approve') await setArtistVerified(user, true);
    if (body.decision === 'revoke') await setArtistVerified(user, false);

    const messages = {
      approve: 'approved your verification request. Your profile now has the verified badge.',
      reject: `did not approve your verification request this time${note ? `: ${note}` : '.'}`,
      revoke: `removed your verified badge${note ? `: ${note}` : '.'}`
    };
    await notifyVerification(user.id, messages[body.decision]);
    res.json(request.toJSON());
  } catch (err) {
    if (err?.name === 'CastError') return res.status(404).json({ error: 'Request not found.' });
    res.status(500).json({ error: 'Unable to update this request right now.' });
  }
});

// ================= ANALYTICS =================
const dayKey = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

// The signed-in user's id if a valid token was sent; never rejects (public pages call this)
function optionalUserId(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, SECRET).id; } catch { return null; }
}

// Counts one view of an artwork. The owner's own visits are ignored, and repeat visits from one address are throttled.
app.post('/api/artworks/:id/view', limitAuthRequests(3, 60 * 60 * 1000), async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ error: 'Artwork not found' });
    if (optionalUserId(req) === artwork.artistId) return res.json({ counted: false });

    const day = dayKey(Date.now());
    const row = await ArtworkView.findOne({ artworkId: artwork.id, day });
    if (row) {
      row.count = (Number(row.count) || 0) + 1;
      await row.save();
    } else {
      await ArtworkView.create({ artworkId: artwork.id, artistId: artwork.artistId, day, count: 1 });
    }
    res.json({ counted: true });
  } catch (err) {
    if (err?.name === 'CastError') return res.status(404).json({ error: 'Artwork not found' });
    res.status(500).json({ error: 'Unable to record this view.' });
  }
});

// Artist insights: views, likes, new followers and sales over the last 7 / 30 / 90 days, compared with the period before
app.get('/api/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.accountType !== 'artist') return res.status(403).json({ error: 'Insights are available to artist accounts.' });

    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const DAY = 86400000;
    const now = Date.now();
    const todayStart = Date.parse(`${dayKey(now)}T00:00:00Z`);
    const from = todayStart - (days - 1) * DAY;          // first day of this period (UTC)
    const prevFrom = from - days * DAY;                   // first day of the previous period

    const artworks = await Artwork.find({ artistId: user.id });
    const artworkIds = artworks.map(a => String(a.id));
    const artworkById = new Map(artworks.map(a => [String(a.id), a]));

    const [viewRows, likes, follows, saves, orders] = await Promise.all([
      ArtworkView.find({ artistId: user.id }),
      artworkIds.length ? Like.find({ artworkId: { $in: artworkIds } }) : [],
      Follow.find({ followingId: user.id }),
      artworkIds.length ? SavedArtwork.find({ artworkId: { $in: artworkIds } }) : [],
      Order.find({ $or: [{ sellerId: user.id }, { participantIds: user.id }, ...(artworkIds.length ? [{ artworkId: { $in: artworkIds } }] : [])] })
    ]);

    const empty = () => ({ views: 0, likes: 0, saves: 0, followers: 0, orders: 0, revenue: 0 });
    const current = empty();
    const previous = empty();
    const series = [];
    const byDay = new Map();
    for (let i = 0; i < days; i += 1) {
      const key = dayKey(from + i * DAY);
      const point = { date: key, views: 0, likes: 0, followers: 0, revenue: 0, orders: 0 };
      series.push(point);
      byDay.set(key, point);
    }

    const perArtwork = new Map(artworkIds.map(id => [id, { views: 0, likes: 0, orders: 0, revenue: 0 }]));
    const bucket = (timestamp) => (timestamp >= from ? 'current' : timestamp >= prevFrom ? 'previous' : null);
    const add = (timestamp, field, amount = 1, artworkId = null) => {
      const which = bucket(timestamp);
      if (!which) return;
      (which === 'current' ? current : previous)[field] += amount;
      if (which === 'current') {
        const point = byDay.get(dayKey(timestamp));
        if (point && field in point) point[field] += amount;
        const stats = artworkId ? perArtwork.get(String(artworkId)) : null;
        if (stats && field in stats) stats[field] += amount;
      }
    };

    for (const row of viewRows) add(Date.parse(`${row.day}T12:00:00Z`), 'views', Number(row.count) || 0, row.artworkId);
    for (const like of likes) add(Number(like.createdAt), 'likes', 1, like.artworkId);
    for (const save of saves) add(Number(save.createdAt), 'saves');
    for (const follow of follows) add(Number(follow.createdAt), 'followers');
    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const split = Array.isArray(order.split) ? order.split : [];
      const mine = split.find(entry => String(entry.userId) === user.id);
      const amount = mine ? Number(mine.amount) || 0 : (order.sellerId === user.id || artworkById.get(String(order.artworkId)) ? Number(order.price) || 0 : 0);
      const timestamp = Number(order.createdAt);
      add(timestamp, 'orders', 1, order.artworkId);
      add(timestamp, 'revenue', amount, order.artworkId);
    }

    const round2 = (value) => Math.round(value * 100) / 100;
    current.revenue = round2(current.revenue);
    previous.revenue = round2(previous.revenue);
    series.forEach(point => { point.revenue = round2(point.revenue); });

    const topArtworks = [...perArtwork.entries()]
      .map(([id, stats]) => {
        const artwork = artworkById.get(id);
        const base = artwork ? withImageUrl(req, artwork.toJSON()) : {};
        return { id, title: artwork?.title || 'Artwork', color: artwork?.color, imageUrl: base.imageUrl, ...stats, revenue: round2(stats.revenue) };
      })
      .filter(item => item.views || item.likes || item.orders)
      .sort((a, b) => (b.views + b.likes * 3 + b.orders * 10) - (a.views + a.likes * 3 + a.orders * 10))
      .slice(0, 5);

    const rating = summarizeReviews(await Review.find({ artistId: user.id }));
    res.json({
      days,
      from: dayKey(from),
      to: dayKey(todayStart),
      current,
      previous,
      series,
      topArtworks,
      rating: { average: rating.average, count: rating.count },
      totals: { artworks: artworks.length, followers: user.followers || 0, sold: user.artworksSold || 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= TAGS =================
const MAX_FOLLOWED_TAGS = 30;

// The most used tags on recent artworks
app.get('/api/tags/popular', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 30);
    const recent = await Artwork.find({}).sort({ createdAt: -1 }).limit(500);
    const counts = new Map();
    for (const artwork of recent) {
      for (const tag of Array.isArray(artwork.tags) ? artwork.tags : []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    res.json([...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count })));
  } catch (err) {
    res.status(500).json({ error: 'Unable to load tags right now.' });
  }
});

// Tags the signed-in person follows
app.get('/api/tags/following', auth, async (req, res) => {
  try {
    const follows = (await TagFollow.find({ userId: req.userId })).sort((a, b) => a.tag.localeCompare(b.tag));
    res.json(follows.map(f => f.tag));
  } catch (err) {
    res.status(500).json({ error: 'Unable to load your tags right now.' });
  }
});

app.get('/api/tags/:tag', async (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);
    if (!TAG_PATTERN.test(tag)) return res.status(400).json({ error: 'That is not a valid tag.' });
    const count = (await Artwork.find({ tags: tag })).length;
    const userId = optionalUserId(req);
    const following = userId ? Boolean(await TagFollow.findOne({ userId, tag })) : false;
    res.json({ tag, count, following });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load this tag right now.' });
  }
});

// Follow / unfollow a tag
app.post('/api/tags/:tag/follow', auth, async (req, res) => {
  try {
    const tag = normalizeTag(req.params.tag);
    if (!TAG_PATTERN.test(tag)) return res.status(400).json({ error: 'That is not a valid tag.' });
    const existing = await TagFollow.findOne({ userId: req.userId, tag });
    if (existing) {
      await TagFollow.findOneAndDelete({ _id: existing.id });
      return res.json({ following: false });
    }
    const mine = await TagFollow.find({ userId: req.userId });
    if (mine.length >= MAX_FOLLOWED_TAGS) return res.status(400).json({ error: `You can follow up to ${MAX_FOLLOWED_TAGS} tags. Unfollow one first.` });
    await TagFollow.create({ userId: req.userId, tag, createdAt: Date.now() });
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ error: 'Unable to update this tag right now.' });
  }
});

// ================= ARTWORKS ROUTES =================
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ARTWORK_SORTS = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  liked: { likes: -1, createdAt: -1 }
};

// Query: category, status, search (every word must match title/artist/medium/description/category),
// minPrice, maxPrice, sort (latest | oldest | liked | price_asc | price_desc), trending, featured, artistId
app.get('/api/artworks', async (req, res) => {
  try {
    const { category, trending, featured, artistId, status, sort } = req.query;
    const search = String(req.query.search || '').trim().slice(0, 100);
    const filter = {};

    if (category && category !== 'All') filter.category = String(category);
    if (trending === 'true') filter.trending = true;
    if (featured === 'true') filter.featured = true;
    if (artistId) filter.artistId = String(artistId);
    if (req.query.tag) {
      const tag = normalizeTag(req.query.tag);
      if (TAG_PATTERN.test(tag)) filter.tags = tag;
    }
    if (['for_sale', 'not_for_sale', 'sold'].includes(status)) filter.status = status;

    const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== '' ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== '' ? Number(req.query.maxPrice) : null;
    if ((minPrice !== null && (!Number.isFinite(minPrice) || minPrice < 0)) || (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0))) {
      return res.status(400).json({ error: 'Price filters must be positive numbers.' });
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return res.status(400).json({ error: 'The minimum price cannot be higher than the maximum price.' });
    }
    if (minPrice !== null || maxPrice !== null) {
      filter.price = {};
      if (minPrice !== null) filter.price.$gte = minPrice;
      if (maxPrice !== null) filter.price.$lte = maxPrice;
    }

    if (search) {
      const words = [...new Set(search.toLowerCase().split(/\s+/).filter(Boolean))].slice(0, 6);
      filter.$and = words.map(word => {
        const match = { $regex: escapeRegex(word), $options: 'i' };
        return {
          $or: [
            { title: match },
            { artistName: match },
            { artistUsername: match },
            { medium: match },
            { category: match },
            { tags: word },
            { description: match }
          ]
        };
      });
    }

    const sortKey = String(sort || '');
    const dbSort = ARTWORK_SORTS[sortKey] || (sortKey.startsWith('price_') ? { createdAt: -1 } : { pinned: -1, createdAt: -1 });
    let artworks = await Artwork.find(filter).sort(dbSort);

    const hasPrice = (a) => typeof a.price === 'number' && Number.isFinite(a.price);
    // A price filter only matches pieces that actually have a price (the offline store treats null as 0)
    if (minPrice !== null || maxPrice !== null) artworks = artworks.filter(hasPrice);

    if (sortKey === 'price_asc' || sortKey === 'price_desc') {
      const dir = sortKey === 'price_asc' ? 1 : -1;
      // Pieces without a price always go last, whichever direction is chosen
      artworks = [...artworks].sort((a, b) => {
        if (hasPrice(a) !== hasPrice(b)) return hasPrice(a) ? -1 : 1;
        if (!hasPrice(a)) return 0;
        return (a.price - b.price) * dir;
      });
    }

    res.json(artworks.map(a => withImageUrl(req, a.toJSON())));
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
      ...withImageUrl(req, artwork.toJSON()),
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

    const { collaborators: incomingCollaborators, tags: incomingTags, ...artworkFields } = req.body;
    const tags = incomingTags === undefined ? [] : parseTags(incomingTags).tags;
    let resolvedCollaborators = [];
    if (Array.isArray(incomingCollaborators) && incomingCollaborators.length) {
      const resolved = await resolveCollaborators(req.userId, incomingCollaborators);
      if (resolved.error) return res.status(400).json({ error: resolved.error });
      resolvedCollaborators = resolved.list;
    }

    const artwork = await Artwork.create({
      ...artworkFields,
      tags,
      collaborators: [],
      artistId: req.userId,
      artistName,
      artistUsername,
      artistVerified: Boolean(user.verified),
      likes: 0,
      trending: false,
      featured: false,
      pinned: false,
      createdAt: Date.now()
    });

    if (resolvedCollaborators.length) await syncCollabInvites(artwork, user, resolvedCollaborators);

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

    const before = await Artwork.findOne({ _id: req.params.id, artistId: req.userId });
    if (!before) return res.status(404).json({ error: 'Artwork not found or unauthorized' });

    let resolvedCollaborators = null;
    if (req.body.collaborators !== undefined) {
      const resolved = await resolveCollaborators(req.userId, req.body.collaborators);
      if (resolved.error) return res.status(400).json({ error: resolved.error });
      resolvedCollaborators = resolved.list;
    }

    const update = { ...req.body };
    delete update.collaborators; // invites decide who is shown, never the request body
    if (update.tags !== undefined) update.tags = parseTags(update.tags).tags;
    const toPrice = (value) => (value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value));
    const oldPrice = toPrice(before.price);
    const oldStatus = before.status;
    const newStatus = update.status !== undefined ? update.status : oldStatus;
    const newPrice = update.price !== undefined ? toPrice(update.price) : oldPrice;
    if (update.price !== undefined && newPrice !== null) update.price = newPrice;

    // A lowered price on a piece that stays for sale is a "price drop"; anything else clears an old drop badge.
    const priceDropped = oldStatus === 'for_sale' && oldPrice !== null
      && newStatus === 'for_sale' && newPrice !== null && newPrice < oldPrice;
    const becameAvailable = oldStatus !== 'for_sale' && newStatus === 'for_sale';
    if (priceDropped) {
      update.previousPrice = oldPrice;
      update.priceDroppedAt = Date.now();
    } else if (newPrice !== oldPrice || newStatus !== oldStatus) {
      update.previousPrice = null;
      update.priceDroppedAt = null;
    }

    const artwork = await Artwork.findOneAndUpdate(
      { _id: req.params.id, artistId: req.userId },
      update,
      { new: true }
    );
    if (!artwork) return res.status(404).json({ error: 'Artwork not found or unauthorized' });

    if (resolvedCollaborators) {
      const owner = await User.findById(req.userId);
      if (owner) await syncCollabInvites(artwork, owner, resolvedCollaborators);
    }

    // Tell everyone who saved this piece. A failed alert must never fail the edit itself.
    if (priceDropped || becameAvailable) {
      try {
        const artist = await User.findById(req.userId);
        const saves = await SavedArtwork.find({ artworkId: artwork.id });
        const recipients = [...new Set(saves.map(record => String(record.userId)))]
          .filter(userId => userId !== req.userId)
          .slice(0, 500);
        const actorName = artist
          ? (`${artist.firstName || ''} ${artist.lastName || ''}`.trim() || artist.username)
          : artwork.artistName;
        await Promise.all(recipients.map(userId => Notification.create({
          userId,
          type: priceDropped ? 'price_drop' : 'now_available',
          actorName,
          actorUsername: artist?.username || artwork.artistUsername,
          text: priceDropped ? 'lowered the price of' : 'made a piece you saved available:',
          targetTitle: artwork.title,
          targetId: artwork.id,
          targetPrice: newPrice === null ? undefined : newPrice,
          previousPrice: priceDropped ? oldPrice : undefined,
          targetColor: artwork.color
        })));
      } catch (notifyError) {
        console.error('Could not send saved-artwork alerts:', notifyError.message);
      }
    }

    const fresh = resolvedCollaborators ? await Artwork.findById(artwork.id) : artwork;
    res.json((fresh || artwork).toJSON());
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

// ================= ARTWORK IMAGES =================
// Images are stored as base64 data URIs. Sending them inside list JSON makes pages huge, so lists
// carry a small URL instead and the browser fetches (and caches) each image on its own.
function imageVersion(dataUri) {
  return crypto.createHash('md5').update(`${dataUri.length}:${dataUri.slice(-96)}`).digest('hex').slice(0, 12);
}

function withImageUrl(req, artworkJson) {
  const img = artworkJson.imageUrl;
  if (typeof img === 'string' && img.startsWith('data:image/')) {
    return { ...artworkJson, imageUrl: `${req.protocol}://${req.get('host')}/api/artworks/${artworkJson.id}/image?v=${imageVersion(img)}` };
  }
  return artworkJson;
}

app.get('/api/artworks/:id/image', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    const img = artwork?.imageUrl;
    if (!img) return res.status(404).end();
    const match = img.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/i);
    if (!match) return res.redirect(302, img);
    res.set({
      'Content-Type': match[1],
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    res.send(Buffer.from(match[2], 'base64'));
  } catch (err) {
    res.status(500).end();
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
    // Optional pin: where on the artwork this note points (percent of width/height)
    let pin = {};
    if (req.body.pinX != null || req.body.pinY != null) {
      const pinX = Number(req.body.pinX);
      const pinY = Number(req.body.pinY);
      const valid = [pinX, pinY].every(n => Number.isFinite(n) && n >= 0 && n <= 100);
      if (!valid) return res.status(400).json({ error: 'Pin position must be between 0 and 100' });
      pin = { pinX, pinY };
    }

    // Replies attach to the top-level note they answer (one level deep keeps threads readable)
    let parentId = null;
    let parent = null;
    if (req.body.parentId) {
      parent = await Comment.findById(String(req.body.parentId));
      if (!parent || parent.artworkId !== artwork.id) return res.status(400).json({ error: 'The note you are replying to no longer exists' });
      if (parent.parentId) {
        parent = await Comment.findById(parent.parentId) || parent;
      }
      parentId = parent.id;
      pin = {};
    }

    const comment = await Comment.create({
      artworkId: artwork.id,
      userId: req.userId,
      userName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      text,
      ...pin,
      parentId,
      createdAt: Date.now()
    });

    // Notify artist
    if (artwork.artistId !== req.userId && !(parent && parent.userId === artwork.artistId)) {
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

    if (parent && parent.userId !== req.userId) {
      await Notification.create({
        userId: parent.userId,
        type: 'reply',
        actorName: `${user.firstName} ${user.lastName}`,
        actorUsername: user.username,
        text: `replied to your note: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}" on`,
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

// ================= MESSAGES ROUTES =================
const conversationKey = (a, b) => [String(a), String(b)].sort().join(':');
const publicPerson = u => ({
  id: u.id, username: u.username, firstName: u.firstName, lastName: u.lastName,
  avatar: u.avatar || null, avatarSeed: u.avatarSeed || null, role: u.role || ''
});

app.get('/api/messages/conversations', auth, async (req, res) => {
  try {
    const mine = await Message.find({ $or: [{ senderId: req.userId }, { recipientId: req.userId }] }).sort({ createdAt: -1 }).limit(500);
    const threads = new Map();
    for (const m of mine) {
      const otherId = m.senderId === req.userId ? m.recipientId : m.senderId;
      if (!threads.has(otherId)) threads.set(otherId, { otherId, last: m, unread: 0 });
      if (m.recipientId === req.userId && !m.read) threads.get(otherId).unread += 1;
    }
    const people = threads.size ? await User.find({ _id: { $in: [...threads.keys()] } }) : [];
    const byId = new Map(people.map(u => [u.id, u]));
    const list = [...threads.values()]
      .filter(t => byId.has(t.otherId))
      .map(t => ({
        user: publicPerson(byId.get(t.otherId)),
        lastMessage: { text: t.last.text, createdAt: t.last.createdAt, fromMe: t.last.senderId === req.userId },
        unread: t.unread
      }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/unread-count', auth, async (req, res) => {
  try {
    const unread = await Message.find({ recipientId: req.userId, read: false });
    res.json({ count: unread.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/with/:username', auth, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username });
    if (!other) return res.status(404).json({ error: 'User not found' });
    const key = conversationKey(req.userId, other.id);
    const query = { conversationId: key };
    const after = Number(req.query.after);
    if (Number.isFinite(after) && after > 0) query.createdAt = { $gt: after };
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(300);
    // Opening the thread marks what they sent as read
    await Message.updateMany({ conversationId: key, recipientId: req.userId, read: false }, { read: true });
    res.json({ user: publicPerson(other), messages: messages.map(m => m.toJSON()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages/with/:username', auth, limitAuthRequests(30, 60 * 1000), async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username });
    if (!other) return res.status(404).json({ error: 'User not found' });
    if (other.id === req.userId) return res.status(400).json({ error: 'You cannot message yourself' });
    const textError = validateText(req.body.text, 'Message', 1000, { required: true, multiline: true });
    if (textError) return res.status(400).json({ error: textError });
    const message = await Message.create({
      conversationId: conversationKey(req.userId, other.id),
      senderId: req.userId,
      recipientId: other.id,
      text: req.body.text.trim(),
      read: false,
      createdAt: Date.now()
    });
    res.status(201).json(message.toJSON());
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
        artworks: artworks.map(a => withImageUrl(req, a.toJSON()))
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
    // Paged by createdAt (newest first) so a page stays small however many artworks exist.
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 20);
    const before = Number(req.query.before);
    const query = { artistId: { $ne: req.userId } };
    if (Number.isFinite(before) && before > 0) query.createdAt = { $lt: before };

    const rows = await Artwork.find(query).sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    const follows = await Follow.find({ followerId: req.userId });
    const followingIds = new Set(follows.map(f => String(f.followingId)));
    const followedTags = new Set((await TagFollow.find({ userId: req.userId })).map(f => f.tag));
    const matchedTagsOf = (a) => (Array.isArray(a.tags) ? a.tags.filter(tag => followedTags.has(tag)) : []);
    // Within a page: people you follow first, then pieces with a tag you follow, then the rest
    const rank = (a) => (followingIds.has(String(a.artistId)) ? 0 : matchedTagsOf(a).length ? 1 : 2);
    const ordered = [...page].sort((a, b) => rank(a) - rank(b));

    const artistIds = [...new Set(page.map(artwork => artwork.artistId).filter(Boolean))];
    const artists = await User.find({ _id: { $in: artistIds } });
    const artistsById = new Map(artists.map(artist => [artist.id, artist]));
    const items = ordered.map(artwork => {
      const artist = artistsById.get(artwork.artistId);
      return withImageUrl(req, {
        ...artwork.toJSON(),
        artistAvatar: artist?.avatar || null,
        artistAvatarSeed: artist?.avatarSeed || null,
        matchedTags: matchedTagsOf(artwork)
      });
    });
    res.json({ items, nextCursor: hasMore ? page[page.length - 1].createdAt : null });
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
    if (['cardName', 'cardNumber', 'expiry', 'cvv'].some(field => field in req.body)) {
      return res.status(400).json({ error: 'This demo checkout does not accept payment details.' });
    }
    if (artwork.artistId === req.userId) return res.status(400).json({ error: 'You cannot purchase your own artwork.' });

    const buyer = await User.findById(req.userId);
    if (!buyer) return res.status(404).json({ error: 'User not found.' });

    // Divide the sale between the owner and co-creators who accepted (pending / declined invites earn nothing)
    const accepted = await CollabInvite.find({ artworkId: artwork.id, status: 'accepted' });
    const totalCents = Math.round((Number(artwork.price) || 0) * 100);
    const split = [];
    let remainingCents = totalCents;
    let sharedPercent = 0;
    for (const invite of accepted) {
      const percent = Number(invite.sharePercent) || 0;
      if (percent <= 0) continue;
      const cents = Math.floor(totalCents * percent / 100);
      remainingCents -= cents;
      sharedPercent += percent;
      split.push({ userId: invite.userId, username: invite.username, name: invite.name, role: invite.role, percent, amount: cents / 100 });
    }
    split.unshift({
      userId: artwork.artistId,
      username: artwork.artistUsername,
      name: artwork.artistName,
      role: 'Owner',
      percent: 100 - sharedPercent,
      amount: remainingCents / 100
    });

    const order = await Order.create({
      buyerId: req.userId,
      artworkId: artwork.id,
      sellerId: artwork.artistId,
      split,
      participantIds: split.map(entry => entry.userId),
      price: artwork.price || 0,
      status: 'demo',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    await Notification.create({
      userId: artwork.artistId,
      type: 'sale',
      actorName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.username,
      actorUsername: buyer.username,
      text: 'placed an order for',
      targetTitle: artwork.title,
      targetId: artwork.id,
      targetPrice: artwork.price,
      targetColor: artwork.color
    });

    await Promise.all(split.filter(entry => entry.userId !== artwork.artistId).map(entry => Notification.create({
      userId: entry.userId,
      type: 'sale',
      actorName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.username,
      actorUsername: buyer.username,
      text: `placed an order for a piece you co-created (your ${entry.percent}% share):`,
      targetTitle: artwork.title,
      targetId: artwork.id,
      targetPrice: entry.amount,
      targetColor: artwork.color
    }).catch(() => null)));

    await Notification.create({
      userId: buyer.id,
      type: 'purchase',
      actorName: 'Earts',
      text: 'Your demo purchase was recorded for',
      targetTitle: artwork.title,
      targetId: artwork.id,
      targetPrice: artwork.price,
      targetColor: artwork.color
    });

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
      ? ['purchase', 'new_artwork', 'reply', 'price_drop', 'now_available', 'commission', 'review_reply', 'verification']
      : ['like', 'comment', 'reply', 'sale', 'follow', 'feature', 'new_artwork', 'purchase', 'price_drop', 'now_available', 'commission', 'collab_invite', 'collab_response', 'review', 'review_reply', 'verification'];
    const list = await Notification.find({ userId: req.userId, type: { $in: types } }).sort({ createdAt: -1 }).limit(50);
    const invites = await CollabInvite.find({ userId: req.userId });
    const inviteStatusByArtwork = new Map(invites.map(invite => [String(invite.artworkId), invite.status]));
    res.json(list.map(n => {
      const json = n.toJSON();
      if (json.type === 'collab_invite') json.inviteStatus = inviteStatusByArtwork.get(String(json.targetId)) || 'removed';
      return json;
    }));
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

// ================= TRUST & SAFETY REPORTS =================
const REPORT_REASONS = new Set(['copyright', 'harassment', 'inappropriate', 'spam', 'other']);
const REPORT_STATUSES = new Set(['open', 'reviewed', 'actioned', 'dismissed']);

app.post('/api/reports', auth, limitAuthRequests(5, 60 * 60 * 1000), async (req, res) => {
  try {
    const allowedFields = new Set(['targetType', 'targetId', 'reason', 'details']);
    if (Object.keys(req.body).some(field => !allowedFields.has(field))) {
      return res.status(400).json({ error: 'One or more report fields are not allowed.' });
    }
    const { targetType, targetId, reason, details = '' } = req.body;
    if (!['artwork', 'user'].includes(targetType)) return res.status(400).json({ error: 'Choose a valid report target.' });
    const targetIdError = validateText(targetId, 'Report target', 100, { required: true });
    const reasonError = enumValue(reason, REPORT_REASONS, 'report reason');
    const detailsError = validateText(details, 'Additional details', 1000, { multiline: true });
    if (targetIdError || reasonError || detailsError) {
      return res.status(400).json({ error: targetIdError || reasonError || detailsError });
    }

    const target = targetType === 'artwork'
      ? await Artwork.findById(targetId)
      : await User.findOne({ username: targetId });
    if (!target) return res.status(404).json({ error: 'The reported content could not be found.' });
    if (targetType === 'user' && target.id === req.userId) return res.status(400).json({ error: 'You cannot report your own profile.' });
    if (targetType === 'artwork' && target.artistId === req.userId) return res.status(400).json({ error: 'You cannot report your own artwork.' });

    const existingReport = await Report.findOne({
      reporterId: req.userId,
      targetType,
      targetId: targetType === 'user' ? target.username : target.id,
      status: 'open'
    });
    if (existingReport) return res.status(409).json({ error: 'You already reported this content. Our team will review it.' });

    const report = await Report.create({
      reporterId: req.userId,
      targetType,
      targetId: targetType === 'user' ? target.username : target.id,
      reason,
      details: details.trim(),
      status: 'open',
      createdAt: Date.now()
    });
    res.status(201).json({ id: report.id, status: report.status, message: 'Thanks. Your report was sent for review.' });
  } catch (err) {
    if (err?.name === 'CastError') return res.status(404).json({ error: 'The reported content could not be found.' });
    res.status(500).json({ error: 'Unable to submit this report right now.' });
  }
});

app.get('/api/moderation/reports', auth, requireModerator, async (req, res) => {
  try {
    const status = req.query.status;
    if (status && !REPORT_STATUSES.has(status)) return res.status(400).json({ error: 'Choose a valid report status.' });
    const reports = await Report.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(100);
    const enriched = await Promise.all(reports.map(async report => {
      const target = report.targetType === 'artwork'
        ? await Artwork.findById(report.targetId)
        : await User.findOne({ username: report.targetId });
      const reporter = await User.findById(report.reporterId);
      return {
        ...report.toJSON(),
        target: target ? {
          id: target.id,
          label: report.targetType === 'artwork' ? target.title : `${target.firstName} ${target.lastName}`,
          username: report.targetType === 'user' ? target.username : undefined
        } : null,
        reporter: reporter ? { username: reporter.username, name: `${reporter.firstName} ${reporter.lastName}` } : null
      };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Unable to load reports right now.' });
  }
});

app.patch('/api/moderation/reports/:id', auth, requireModerator, async (req, res) => {
  try {
    if (Object.keys(req.body).some(field => field !== 'status') || !REPORT_STATUSES.has(req.body.status)) {
      return res.status(400).json({ error: 'Choose a valid report status.' });
    }
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id },
      { status: req.body.status, resolvedAt: req.body.status === 'open' ? null : Date.now() },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json(report.toJSON());
  } catch (err) {
    if (err?.name === 'CastError') return res.status(404).json({ error: 'Report not found.' });
    res.status(500).json({ error: 'Unable to update this report right now.' });
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

app.get('/api/stats', async (req, res) => {
  try {
    const [artists, explorers, artworks, sold] = await Promise.all([
      User.countDocuments({ accountType: 'artist' }),
      User.countDocuments({ accountType: 'collector' }),
      Artwork.countDocuments(),
      Artwork.countDocuments({ status: 'sold' })
    ]);
    res.json({ artists, explorers, artworks, sold });
  } catch {
    res.status(500).json({ error: 'Unable to load community statistics.' });
  }
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
