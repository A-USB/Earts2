import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bookmark, ChevronRight, Compass, PaintbrushVertical, Palette, Plus, Search, ShoppingBag, Sparkles, Tag, Users, Handshake, UserRound, ImagePlus, Globe, Star } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import Avatar from '../components/Avatar';
import heroStudio from '../assets/hero-studio.webp';
import './Home.css';
import IconTile from '../components/IconTile';
import { formatCompact } from '../utils/formatCount';

const STATS = [
  { key: 'artists', label: 'Artists joined', Icon: Users },
  { key: 'explorers', label: 'Explorers visited', Icon: Compass },
  { key: 'artworks', label: 'Artworks published', Icon: PaintbrushVertical, sparkle: true },
  { key: 'sold', label: 'Artworks sold', Icon: Tag },
];

// Keep the landing page populated immediately while live counts load from the API.
const LANDING_STATS_FALLBACK = { artists: 9, explorers: 1, artworks: 19, sold: 0 };

// A stat card with two faces: a gradient icon face that flips to the number on hover, keyboard focus or tap.
function StatFlipCard({ stat, value }) {
  const shown = value > 0 ? `${value.toLocaleString()}+` : '0';
  return (
    <div className="flip-card" tabIndex={0} role="group" aria-label={`${shown} ${stat.label}`}>
      <div className="flip-card-inner">
        <div className="flip-face flip-front" aria-hidden="true">
          <span className="flip-icon">
            <stat.Icon strokeWidth={2} />
            {stat.sparkle && <Sparkles className="flip-sparkle" strokeWidth={2} />}
          </span>
        </div>
        <div className="flip-face flip-back" aria-hidden="true">
          <span className="flip-num">{shown}</span>
          <span className="flip-label">{stat.label}</span>
        </div>
      </div>
    </div>
  );
}

const VALUES = [
  { Icon: Handshake, title: 'Community first', desc: 'Artists support artists. Every feature we build strengthens the collective.' },
  { Icon: Palette, title: 'Creative freedom', desc: 'No gatekeeping. Every style and medium has a home here with the art.' },
  { Icon: Star, title: 'Artist-led', desc: 'Artists can present their work, build a portfolio, and connect with explorers.' },
  { Icon: Globe, title: 'Global inclusion', desc: 'Art has no borders. We celebrate creators from every culture.' },
];

const TEAM = [
  { name: 'Nadia Reyes', role: 'Co-founder & CTO', bio: 'Artist and entrepreneur passionate about creative economies.', color: '#F093FB' },
  { name: 'arahibris2011', role: 'Co-founder & CEO', bio: 'Engineer & Illustrator building tools artists actually need.', color: '#4facfe' },
  { name: 'Hussina Patel', role: 'Head of Community', bio: 'Bringing artists together across borders and disciplines.', color: '#f6d365' },
  { name: 'John Brigg', role: 'Head of Design', bio: 'Shaping the look of everything you see on Earts.', color: '#a29bfe' },
];

const TIMELINE = [
  { date: 'JAN 2026', title: 'The Earts idea begins', desc: 'The project starts with a goal: build a creative space where artists can share their work and people can discover it.', color: '#A99BFF' },
  { date: 'JUN 29, 2026', title: 'The first platform foundation', desc: 'The first recorded Earts codebase brings together a React client and an Express backend for an artist community.', color: '#69D7E8' },
  { date: 'SEP 19–25, 2026', title: 'Community and marketplace take shape', desc: 'Artist profiles, artwork uploads, a feed, marketplace browsing, collaborations, and notifications turn the foundation into a working community.', color: '#FF8DBB' },
  { date: 'OCT 4–9, 2026', title: 'Accounts, roles, and trust', desc: 'Authentication, artist and explorer journeys, artwork saving, password recovery, and stronger input validation improve the experience.', color: '#FFB45E' },
  { date: 'NOW · OCT 2026', title: 'Improving discovery and reliability', desc: 'Current work focuses on artist search, reliable photo uploads, and polishing the experience across the app.', color: '#71D6A5' },
];

const FEATURES = [
  { icon: Palette, title: 'Showcase your work', desc: 'Create an artist profile, upload artwork, and organize pieces into a portfolio.', color: '#A99BFF' },
  { icon: Search, title: 'Discover artists', desc: 'Search creators by name, username, style, or location and visit their profiles.', color: '#69D7E8' },
  { icon: Bookmark, title: 'Connect and collect', desc: 'Follow artists, like and comment on work, and save pieces to revisit later.', color: '#FF8DBB' },
  { icon: ShoppingBag, title: 'Explore the marketplace', desc: 'Browse original artworks and see what artists have listed. Checkout is currently a demo and does not process payments.', color: '#FFB45E' },
];

const FAQ = [
  { q: 'Can I create an account for free?', a: 'Yes. You can create an artist or explorer account and use the community features without subscribing.' },
  { q: 'Are there subscription fees?', a: 'No. Earts does not currently offer paid subscriptions or creator plans. Current community features are free to use.' },
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
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [stats, setStats] = useState(LANDING_STATS_FALLBACK);

  const exploreLink = user ? '/marketplace' : '/signup';

  useEffect(() => {
    api.get('/artworks?trending=true').then(setTrending).catch(console.error);
    api.get('/stats').then(setStats).catch(() => {});
    api.get('/users/search').then(artists => setFeaturedArtists(artists.slice(0, 4))).catch(() => setFeaturedArtists([]));
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
              <figure className="hero-photo">
                <img
                  src={heroStudio}
                  width="1248"
                  height="832"
                  alt="Oil paint tubes, brushes and smears of paint on a wooden studio table"
                  fetchPriority="high"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="stats-bar">
          <div className="container stats-inner">
            {stats && STATS.map(s => (
              <StatFlipCard key={s.key} stat={s} value={stats[s.key] ?? 0} />
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
              {trending.map(a => (
                <ArtworkCard
                  key={a.id}
                  artwork={a}
                  {...(user ? {} : {
                    to: '/login',
                    linkState: { from: `/artwork/${a.id}`, notice: `Log in to view “${a.title}”` },
                    gateHint: 'Log in to view',
                  })}
                />
              ))}
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

        {/* Featured Artists */}
        <section className="artists-section reveal">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="eyebrow">Community</span>
                <h2>Featured artists</h2>
              </div>
              <Link to="/search" className="view-all">Browse artists <ChevronRight size={16} /></Link>
            </div>
            <div className="artists-grid">
              {featuredArtists.map(artist => (
                <Link
                  to={user ? `/profile/${artist.username}` : '/login'}
                  state={user ? undefined : { from: `/profile/${artist.username}`, notice: `Log in to view ${artist.firstName}’s profile` }}
                  key={artist.id}
                  className="artist-card card"
                >
                  <span className="artist-ring">
                    <Avatar seed={artist.avatarSeed || `${artist.firstName}${artist.lastName}`} src={artist.avatar} size={80} />
                  </span>
                  <h4>{artist.firstName} {artist.lastName}</h4>
                  <span className="artist-role">{artist.role || 'Artist'}</span>
                  <span className="artist-followers"><Users size={14} aria-hidden="true" /><strong>{formatCompact(artist.followers)}</strong> followers</span>
                  <span className="artist-cta">
                    View profile <ArrowRight size={14} aria-hidden="true" />
                    {!user && <span className="wc-sr"> (log in required)</span>}
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
                { Icon: UserRound, title: 'Create your profile', desc: 'Set up your artist identity, add your bio, and showcase your style.' },
                { Icon: ImagePlus, title: 'Upload your work', desc: 'Share your artwork in any medium — digital, oil, watercolour, sculpture.' },
                { Icon: Users, title: 'Connect through art', desc: 'Discover creators, follow their work, and share what inspires you.' },
                { Icon: Bookmark, title: 'Save your favourites', desc: 'Keep artworks you like in your collection to revisit later.' },
              ].map((step, i) => (
                <div key={i} className="step-card card">
                  <IconTile Icon={step.Icon} className="step-icon" />
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
                  <IconTile Icon={v.Icon} className="value-icon" />
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
              <span className="eyebrow">Our journey</span>
              <h2>From an idea to a creative community</h2>
              <p className="timeline-intro">A look at how Earts has grown — and what we’re working on now.</p>
            </div>
            <div className="timeline">
              {TIMELINE.map(item => (
                <div key={item.date} className="timeline-item" style={{ '--milestone-accent': item.color }}>
                  <div className="timeline-year">{item.date}</div>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
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
              <span className="eyebrow">What you can do</span>
              <h2>Everything you need to find your place on Earts</h2>
              <p>Explore the tools you can use today. Earts has no paid plans or subscription fees.</p>
            </div>
          </div>
        </section>

        <div className="container products-body">
          <section className="features-section reveal">
            <div className="features-grid">
              {FEATURES.map(feature => {
                const Icon = feature.icon;
                return (
                  <article className="feature-card card" key={feature.title} style={{ '--feature-accent': feature.color }}>
                    <span className="feature-icon"><Icon size={22} /></span>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </article>
                );
              })}
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

      {/* CTA Banner at the end of the landing page, before the app footer */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <h3>Ready to share your art with the world?</h3>
              <p>{stats ? `Join ${stats.artists} ${stats.artists === 1 ? 'artist' : 'artists'} and ${stats.explorers} ${stats.explorers === 1 ? 'explorer' : 'explorers'} in the growing Earts community.` : 'Join artists and explorers building a creative community on Earts.'}</p>
            </div>
            <Link to={user ? '/marketplace' : '/signup'} className="cta-btn">
              Start for free <ArrowRight size={16} />
            </Link>
            <div className="cta-blob" />
          </div>
        </div>
      </section>
    </div>
  );
}
