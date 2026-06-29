import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import ArtworkCard from '../components/ArtworkCard';
import Avatar from '../components/Avatar';
import './Home.css';

const STATS = [
  { value: '12k+', label: 'Artists worldwide', highlight: '12' },
  { value: '80+', label: 'Countries reached', highlight: '80' },
  { value: '200k+', label: 'Earned by artists', highlight: '200', prefix: '$' },
  { value: '48k+', label: 'Artworks shared', highlight: '48' },
];

export default function Home() {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api.get('/artworks?trending=true').then(setTrending).catch(console.error);
  }, []);

  return (
    <div className="home">
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
              <Link to="/gallery" className="btn-primary">
                Explore the community <ArrowRight size={16} />
              </Link>
              <Link to="/gallery" className="btn-outline">See artwork</Link>
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
          {STATS.map(s => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">
                {s.prefix && <span className="stat-prefix">{s.prefix}</span>}
                <span className="stat-num">{s.highlight}</span>
                <span className="stat-suffix">k+</span>
              </div>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="trending-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Discover</span>
              <h2>Trending artworks</h2>
            </div>
            <Link to="/gallery" className="view-all">View all <ChevronRight size={16} /></Link>
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
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <h3>Ready to share your art with the world?</h3>
              <p>Join 12,000+ artists already building their creative career on Earts.</p>
            </div>
            <Link to="/signup" className="cta-btn">
              Start for free <ArrowRight size={16} />
            </Link>
            <div className="cta-blob" />
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="artists-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Community</span>
              <h2>Featured artists</h2>
            </div>
            <Link to="/gallery" className="view-all">View all <ChevronRight size={16} /></Link>
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
      <section className="how-section">
        <div className="container">
          <div className="section-header centered">
            <span className="eyebrow">Get started</span>
            <h2>Your journey on Earts</h2>
          </div>
          <div className="steps-grid">
            {[
              { icon: '🎨', title: 'Create your profile', desc: 'Set up your artist identity, add your bio, and showcase your style.' },
              { icon: '🖼️', title: 'Upload your work', desc: 'Share your artwork in any medium — digital, oil, watercolour, sculpture.' },
              { icon: '🌍', title: 'Connect globally', desc: 'Join a community of 12k+ artists across 80 countries.' },
              { icon: '💰', title: 'Earn from your craft', desc: 'Set your prices and sell directly to collectors worldwide.' },
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
    </div>
  );
}
