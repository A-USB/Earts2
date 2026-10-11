import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronRight, Check, Zap } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import Avatar from '../components/Avatar';
import './Home.css';

const STATS = [
  { key: 'artists', label: 'Artists' },
  { key: 'explorers', label: 'Explorers' },
  { key: 'artworks', label: 'Artworks shared' },
];

const VALUES = [
  { icon: '🤝', title: 'Community first', desc: 'Artists support artists. Every feature we build strengthens the collective.' },
  { icon: '🎨', title: 'Creative freedom', desc: 'No gatekeeping. Every style and medium has a home here with the art.' },
  { icon: '⭐', title: 'Artist-led', desc: 'Artists can present their work, build a portfolio, and connect with explorers.' },
  { icon: '🌍', title: 'Global inclusion', desc: 'Art has no borders. We celebrate creators from every culture.' },
];

const TEAM = [
  { name: 'Nadia Reyes', role: 'Co-founder & CTO', bio: 'Artist and entrepreneur passionate about creative economies.', color: '#F093FB' },
  { name: 'arahibris2011', role: 'Co-founder & CEO', bio: 'Engineer & Illustrator building tools artists actually need.', color: '#4facfe' },
  { name: 'Hussina Patel', role: 'Head of Community', bio: 'Bringing artists together across borders and disciplines.', color: '#f6d365' },
  { name: 'John Brigg', role: 'Head of Design', bio: 'Shaping the look of everything you see on Earts.', color: '#a29bfe' },
];

const TIMELINE = [
  { year: '01', title: 'Choose your space', desc: 'Join Earts as an artist sharing original work or an explorer discovering artists.' },
  { year: '02', title: 'Build your profile', desc: 'Tell the community about your creative interests and the work you make.' },
  { year: '03', title: 'Explore and connect', desc: 'Discover artwork, follow artists, and save pieces to revisit.' },
  { year: '04', title: 'Share your work', desc: 'Artists can publish pieces and curate their portfolio for the community.' },
];

const FAQ = [
  { q: 'Can I create an account for free?', a: 'Yes. You can create an artist or explorer account and use the community features without subscribing.' },
  { q: 'Are subscriptions and add-ons available?', a: 'Not yet. The plans and prices shown here are previews; Earts does not currently charge subscription or add-on fees.' },
  { q: 'Does artwork checkout process payment?', a: 'No. Checkout is a demo only. It does not collect card details or move money, and demo orders are not real sales.' },
  { q: 'How can I share artwork?', a: 'Create an artist account, complete your profile, and use Upload to add artwork to your portfolio.' },
];

// Fade/slide-in reveal as sections scroll into view
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -18% 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const [trending, setTrending] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);

  const exploreLink = user ? '/marketplace' : '/signup';

  useEffect(() => {
    api.get('/artworks?trending=true').then(setTrending).catch(console.error);
    api.get('/products').then(setProducts).catch(console.error);
    api.get('/stats').then(setStats).catch(() => setStats(null));
  }, []);

  // Smooth-scroll to the tab/section matching the URL hash (e.g. /#about)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(t);
  }, [location.hash]);

  useScrollReveal();

  const subscriptions = products.filter(p => p.type === 'subscription');
  const addons = products.filter(p => p.type === 'addon');

  return (
    <div className="home">
      {/* ============ HOME TAB ============ */}
      <section id="home" className="home-section">
        {/* Hero */}
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-left fade-in-up">
              <span className="eyebrow">Artist Community</span>
              <h1>
                Where artists<br />
                <span className="hero-gradient">grow, share &</span><br />
                <span className="hero-gradient">thrive</span> together
              </h1>
              <p>Earts is a space for creators to showcase their work, connect with fellow artists, and turn passion into livelihood.</p>
              <div className="hero-ctas">
                <Link to={exploreLink} className="btn-primary">
                  Explore the community <ArrowRight size={16} />
                </Link>
                <button type="button" className="btn-outline" onClick={() => document.getElementById('trending')?.scrollIntoView({behavior:'smooth'})}>
                  See artwork
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-main-img">
                <div className="hero-img-placeholder">
                  <div className="hero-paint-swirl" />
                  <span>🎨</span>
                </div>
                <div className="hero-accent-card hero-accent-1">
                  <div className="accent-avatar" style={{background:'linear-gradient(135deg,#FF6B9D,#C44FD8)'}} />
                </div>
                <div className="hero-accent-card hero-accent-2">
                  <div className="accent-avatar" style={{background:'linear-gradient(135deg,#5B4BF5,#00BCD4)'}} />
                </div>
              </div>
              <div className="hero-shape hero-shape-1" />
              <div className="hero-shape hero-shape-2" />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-bar">
          <div className="container stats-inner">
            {stats && STATS.map(s => (
              <div key={s.key} className="stat-item">
                <div className="stat-value" aria-label={`${stats[s.key].toLocaleString()} ${s.label}`}>
                  <span className="stat-num">{stats[s.key].toLocaleString()}</span>
                </div>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section id="trending" className="trending-section reveal">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="eyebrow">Discover</span>
                <h2>Trending artworks</h2>
              </div>
              <Link to={exploreLink} className="view-all">View all <ChevronRight size={16} /></Link>
            </div>
            <div className="artworks-grid">
              {trending.map(a => <ArtworkCard key={a.id} artwork={a} />)}
              {trending.length === 0 && [1,2,3,4].map(i => (
                <div key={i} className="artwork-card-skeleton">
                  <div className="skeleton" style={{width:'100%',aspectRatio:'1',borderRadius:'12px'}} />
                  <div className="skeleton" style={{width:'70%',height:'16px',margin:'12px 14px 4px'}} />
                  <div className="skeleton" style={{width:'40%',height:'12px',margin:'0 14px 12px'}} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="cta-section reveal">
          <div className="container">
            <div className="cta-banner">
              <div className="cta-content">
                <h3>Ready to share your art with the world?</h3>
                <p>Join 12,000+ artists already building their creative career on Earts.</p>
              </div>
              <Link to={user ? '/marketplace' : '/signup'} className="cta-btn">
                Start for free <ArrowRight size={16} />
              </Link>
              <div className="cta-blob" />
            </div>
          </div>
        </section>

        {/* Featured Artists */}
        <section className="artists-section reveal">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="eyebrow">Community</span>
                <h2>Featured artists</h2>
              </div>
              <Link to={exploreLink} className="view-all">View all <ChevronRight size={16} /></Link>
            </div>
            <div className="artists-grid">
              {[
                { name: 'Nadia Reyes', role: 'Painter', works: 23, color: '#F093FB', username: 'nadia_reyes' },
                { name: 'arahibris2011', role: 'Illustrator', works: 31, color: '#4facfe', username: 'arahibris2011' },
                { name: 'Jane Murungi', role: 'Sculptor', works: 103, color: '#FF6B9D', username: 'jane_murungi' },
                { name: 'Hussina Patel', role: 'Mixed Media', works: 19, color: '#f6d365', username: 'hussina_patel' },
              ].map(artist => (
                <Link to={`/profile/${artist.username}`} key={artist.name} className="artist-card card">
                  <Avatar seed={artist.name} size={72} />
                  <h4>{artist.name}</h4>
                  <span className="artist-role">{artist.role}</span>
                  <span className="artist-works">{artist.works} artworks</span>
                  <span className="follow-btn btn-outline" style={{ marginTop: '12px', padding: '6px 18px', fontSize: '13px' }}>
                    Follow
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="how-section reveal">
          <div className="container">
            <div className="section-header centered">
              <span className="eyebrow">Get started</span>
              <h2>Your journey on Earts</h2>
            </div>
            <div className="steps-grid">
              {[
                { icon: '🎨', title: 'Create your profile', desc: 'Set up your artist identity, add your bio, and showcase your style.' },
                { icon: '🖼️', title: 'Upload your work', desc: 'Share your artwork in any medium — digital, oil, watercolour, sculpture.' },
                { icon: '🌍', title: 'Connect through art', desc: 'Discover creators, follow their work, and share what inspires you.' },
                { icon: '💾', title: 'Save your favourites', desc: 'Keep artworks you like in your collection to revisit later.' },
              ].map((step, i) => (
                <div key={i} className="step-card card">
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-num">{String(i+1).padStart(2,'0')}</div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      {/* ============ ABOUT TAB ============ */}
      <section id="about" className="home-section about-section-wrap">
        <section className="about-hero reveal">
          <div className="container">
            <div className="section-header centered">
              <span className="eyebrow">Our Story</span>
              <h2>Born from a love of art and a need for community</h2>
              <p>
                Earts was founded in 2022 by a group of artists who felt unseen on existing platforms.
                We built the space we always wished existed — one that truly puts creators first.
              </p>
            </div>
          </div>
        </section>

        <section className="mission-section reveal">
          <div className="container mission-grid">
            <div className="mission-card">
              <span className="eyebrow">Our Mission</span>
              <p>To empower every artist — regardless of background, style, or experience — with the tools, audience, and community they need to grow and sustain their creative practice.</p>
            </div>
            <div className="vision-card">
              <span className="eyebrow">Our Vision</span>
              <p>A world where every artist can make a living from their craft, and where art from every corner of the globe is celebrated, discovered and collected.</p>
            </div>
          </div>
        </section>

        <section className="values-section reveal">
          <div className="container">
            <div className="section-center">
              <span className="eyebrow">What we stand for</span>
              <h2>Our Values</h2>
            </div>
            <div className="values-grid">
              {VALUES.map(v => (
                <div key={v.title} className="value-card card">
                  <span className="value-icon">{v.icon}</span>
                  <h4>{v.title}</h4>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="team-section reveal">
          <div className="container">
            <div className="section-center">
              <span className="eyebrow">Meet us</span>
              <h2>Meet the team</h2>
            </div>
            <div className="team-grid">
              {TEAM.map(m => (
                <div key={m.name} className="team-card card">
                  <Avatar seed={m.name} size={80} className="team-avatar-img" />
                  <h4>{m.name}</h4>
                  <span className="team-role">{m.role}</span>
                  <p>{m.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="timeline-section reveal">
          <div className="container">
            <div className="section-center">
              <span className="eyebrow">Getting started</span>
              <h2>Make Earts your creative space</h2>
            </div>
            <div className="timeline">
              {TIMELINE.map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-year">{item.year}</div>
                  <div className="timeline-dot" />
                  <div className="timeline-content card">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      {/* ============ PRODUCTS TAB ============ */}
      <section id="products" className="home-section products-section-wrap">
        <section className="products-hero reveal">
          <div className="container">
            <div className="section-header centered">
              <span className="eyebrow">Our Products</span>
              <h2>Tools that put artists first</h2>
              <p>Explore upcoming tools for artists. Plans and add-ons are not available for purchase yet.</p>
            </div>
          </div>
        </section>

        <div className="container products-body">
          <section className="plans-section reveal">
            <div className="section-center" style={{textAlign:'center',marginBottom:'40px'}}>
              <h2>Plans preview</h2>
              <p role="note" style={{color:'var(--text-mid)', marginTop:'8px'}}>Preview pricing only · subscriptions and billing are not enabled.</p>
            </div>
            <div className="plans-grid">
              {subscriptions.map(plan => (
                <div key={plan.id} className={`plan-card card ${plan.popular ? 'plan-popular' : ''}`}>
                  {plan.popular && <div className="popular-badge"><Zap size={12}/> Most popular</div>}
                  <div className="plan-icon" style={{background: plan.color}} />
                  <h3>{plan.name}</h3>
                  <p className="plan-desc">{plan.description}</p>
                  <div className="plan-price">
                    <span className="price-amt">${plan.price}</span>
                    <span className="price-period">/month preview</span>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map(f => (
                      <li key={f}><Check size={14} /> {f}</li>
                    ))}
                  </ul>
                  <Link to="/signup" className={plan.popular ? 'btn-primary' : 'btn-outline'} style={{justifyContent:'center', marginTop:'auto'}}>
                    Create free account
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="addons-section reveal">
            <h2>Power-ups & Add-ons</h2>
            <p>These add-ons are previews and cannot be purchased yet.</p>
            <div className="addons-grid">
              {addons.map(addon => (
                <div key={addon.id} className="addon-card card">
                  <div className="addon-icon" style={{background: addon.color}} />
                  <div className="addon-content">
                    <h4>{addon.name}</h4>
                    <p>{addon.description}</p>
                    <div className="addon-features">
                      {addon.features.map(f => <span key={f} className="addon-feat">{f}</span>)}
                    </div>
                  </div>
                  <div className="addon-price">
                    {addon.price === 0 ? <span className="free-tag">Preview</span> : <span>${addon.price} preview</span>}
                    <button className="btn-outline" style={{padding:'6px 16px',fontSize:'13px'}} disabled>Coming soon</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="faq-section reveal">
            <h2>Frequently asked questions</h2>
            <div className="faq-grid">
              {FAQ.map(faq => (
                <div key={faq.q} className="faq-item card">
                  <h4>{faq.q}</h4>
                  <p>{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
