import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, Palette, Bell, Lock, LogOut } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User size={16}/> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16}/> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16}/> },
  { id: 'security', label: 'Security', icon: <Lock size={16}/> },
];

const ROLES = ['Painter','Illustrator','Sculptor','Digital Artist','Photographer','Printmaker','Ceramicist','Mixed Media','Other'];
const TAGS_OPTIONS = ['Illustration','Digital art','Watercolour','Sculpture','Oil','Abstract','Photography','Printmaking'];
const TOOLS_OPTIONS = ['Procreate','Photoshop','Illustrator','Ink','Watercolour','Oil paint','Canvas','Clay','Metal','Wood'];
const AVAIL_OPTIONS = ['Commissions','Collaborations','Workshop','Exhibitions','Residencies'];
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #FF6B6B 0%, #C44FD8 50%, #5B4BF5 100%)',
  'linear-gradient(135deg, #5B4BF5 0%, #FF6B9D 100%)',
  'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
];

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ firstName:'', lastName:'', bio:'', location:'', role:'', tags:[], tools:[], availableFor:[], coverColor:'' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      bio: user.bio || '',
      location: user.location || '',
      role: user.role || '',
      tags: user.tags || [],
      tools: user.tools || [],
      availableFor: user.availableFor || [],
      coverColor: user.coverColor || COVER_GRADIENTS[0],
    });
  }, [user]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const toggleArr = (key, val) => setForm(p => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val]
  }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await api.patch('/users/me', form);
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="settings-page page-wrapper">
      <div className="container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your profile and preferences</p>
        </div>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`settings-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
            <button className="settings-tab danger" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={16}/> Sign Out
            </button>
          </aside>

          <div className="settings-content card">
            {tab === 'profile' && (
              <div className="settings-section">
                <h3>Profile Information</h3>
                <p className="section-desc">This is how other artists will see you on Earts.</p>

                <div className="form-row-s">
                  <div className="form-group">
                    <label>First Name</label>
                    <input value={form.firstName} onChange={set('firstName')} placeholder="First name" />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input value={form.lastName} onChange={set('lastName')} placeholder="Last name" />
                  </div>
                </div>

                <div className="form-group">
                  <label>I am a...</label>
                  <select value={form.role} onChange={set('role')}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows={4} value={form.bio} onChange={set('bio')} placeholder="Tell the world about your art and practice..." />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input value={form.location} onChange={set('location')} placeholder="e.g. Kigali, Rwanda" />
                </div>

                <div className="form-group">
                  <label>Tags (select all that apply)</label>
                  <div className="toggle-chips">
                    {TAGS_OPTIONS.map(t => (
                      <button key={t} type="button" className={`chip ${form.tags.includes(t) ? 'active' : ''}`} onClick={() => toggleArr('tags', t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Tools & Media</label>
                  <div className="toggle-chips">
                    {TOOLS_OPTIONS.map(t => (
                      <button key={t} type="button" className={`chip ${form.tools.includes(t) ? 'active' : ''}`} onClick={() => toggleArr('tools', t)}>{t}</button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Available for</label>
                  <div className="toggle-chips">
                    {AVAIL_OPTIONS.map(a => (
                      <button key={a} type="button" className={`chip ${form.availableFor.includes(a) ? 'active' : ''}`} onClick={() => toggleArr('availableFor', a)}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="settings-section">
                <h3>Profile Appearance</h3>
                <p className="section-desc">Customise how your profile looks to other artists.</p>

                <div className="form-group">
                  <label>Cover Gradient</label>
                  <div className="cover-options">
                    {COVER_GRADIENTS.map((g, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`cover-swatch ${form.coverColor === g ? 'active' : ''}`}
                        style={{ background: g }}
                        onClick={() => setForm(p => ({ ...p, coverColor: g }))}
                      />
                    ))}
                  </div>
                  <div className="cover-preview" style={{ background: form.coverColor }}>
                    <div className="preview-label">Cover preview</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className="settings-section">
                <h3>Notification Preferences</h3>
                <p className="section-desc">Choose what you hear about and how.</p>
                <div className="notif-list">
                  {[
                    { label: 'New follower', desc: 'When someone follows your profile' },
                    { label: 'Artwork liked', desc: 'When someone likes your artwork' },
                    { label: 'New message', desc: 'When you receive a direct message' },
                    { label: 'Sale made', desc: 'When one of your artworks is purchased' },
                    { label: 'Community updates', desc: 'Weekly digest of community activity' },
                    { label: 'Product announcements', desc: "New features and updates from Earts" },
                  ].map(n => (
                    <div key={n.label} className="notif-item">
                      <div>
                        <strong>{n.label}</strong>
                        <span>{n.desc}</span>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'security' && (
              <div className="settings-section">
                <h3>Security</h3>
                <p className="section-desc">Manage your password and account security.</p>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" placeholder="••••••••" />
                </div>
                <div className="form-row-s">
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="danger-zone">
                  <h4>Danger Zone</h4>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="btn-danger">Delete account</button>
                </div>
              </div>
            )}

            <div className="settings-footer">
              {saved && <span className="saved-msg">✓ Changes saved!</span>}
              <button className="btn-primary" onClick={handleSave} disabled={loading}>
                <Save size={15}/> {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
