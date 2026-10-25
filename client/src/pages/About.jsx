import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import Avatar from '../components/Avatar';
import './About.css';
import { Handshake, Palette, Award, Globe } from 'lucide-react';
import IconTile from '../components/IconTile';

const VALUES = [
  { Icon: Handshake, title: 'Community first', desc: 'Artists support artists. Every feature we build strengthens the collective.' },
  { Icon: Palette, title: 'Creative freedom', desc: 'No gatekeeping. Every style and medium has a home here with the art.' },
  { Icon: Award, title: 'Fair recognition', desc: 'Artists own their work and keep the majority of what they earn.' },
  { Icon: Globe, title: 'Global inclusion', desc: 'Art has no borders. We celebrate creators from every culture.' },
];

const TEAM = [
  { name: 'Nadia Reyes', role: 'Co-founder & CTO', bio: 'Artist and entrepreneur passionate about creative economies.', color: '#F093FB' },
  { name: 'arahibris2011', role: 'Co-founder & CEO', bio: 'Engineer & Illustrator building tools artists actually need.', color: '#4facfe' },
  { name: 'Hussina Patel', role: 'Head of Community', bio: 'Bringing artists together across borders and disciplines.', color: '#f6d365' },
  { name: 'John Brigg', role: 'Head of Design', bio: 'Shaping the look of everything you see on Earts.', color: '#a29bfe' },
];

const STATS = [
  { key: 'artists', label: 'Artists', color: '#5B4BF5' },
  { key: 'explorers', label: 'Explorers', color: '#FF6B9D' },
  { key: 'artworks', label: 'Artworks shared', color: '#00BCD4' },
];

const TIMELINE = [
  { year: '01', title: 'Choose your space', desc: 'Join Earts as an artist sharing original work or an explorer discovering artists.' },
  { year: '02', title: 'Build your profile', desc: 'Tell the community about your creative interests and the work you make.' },
  { year: '03', title: 'Explore and connect', desc: 'Discover artwork, follow artists, and save pieces to revisit.' },
  { year: '04', title: 'Share your work', desc: 'Artists can publish pieces and curate their portfolio for the community.' },
];

export default function About() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div className="about-page page-wrapper">
      {/* Story */}
      <section className="about-hero">
        <div className="container about-hero-inner">
          <div className="about-hero-left">
            <span className="eyebrow">About Earts</span>
            <h1>A creative community for sharing and discovering art</h1>
            <p>
              Earts brings artists and explorers together to share original work, discover new creators, and build creative connections.
            </p>
          </div>
          {stats && <div className="about-stats">
            {STATS.map(s => (
              <div key={s.label} className="about-stat-card" style={{ background: s.color }}>
                <span className="about-stat-value">{stats[s.key].toLocaleString()}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-section">
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

      {/* Values */}
      <section className="values-section">
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

      {/* Team */}
      <section className="team-section">
        <div className="container">
          <div className="section-center">
            <span className="eyebrow">What we stand for</span>
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

      {/* Timeline */}
      <section className="timeline-section">
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
    </div>
  );
}
