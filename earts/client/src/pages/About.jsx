import Avatar from '../components/Avatar';
import './About.css';

const VALUES = [
  { icon: '🤝', title: 'Community first', desc: 'Artists support artists. Every feature we build strengthens the collective.' },
  { icon: '🎨', title: 'Creative freedom', desc: 'No gatekeeping. Every style and medium has a home here.' },
  { icon: '⭐', title: 'Fair recognition', desc: 'Artists own their work and keep the majority of what they earn.' },
  { icon: '🌍', title: 'Global inclusion', desc: 'Art has no borders. We celebrate creators from every culture.' },
];

const TEAM = [
  { name: 'Nadia Reyes', role: 'Co-founder & CTO', bio: 'Artist and entrepreneur passionate about creative economies.', color: '#F093FB' },
  { name: 'arahibris2011', role: 'Co-founder & CEO', bio: 'Engineer & Illustrator building tools artists actually need.', color: '#4facfe' },
  { name: 'Hussina Patel', role: 'Head of Community', bio: 'Bringing artists together across borders and disciplines.', color: '#f6d365' },
  { name: 'John Brigg', role: 'Head of Design', bio: 'Shaping the look of everything you see on Earts.', color: '#a29bfe' },
];

const STATS = [
  { value: '12k+', label: 'Artists worldwide', color: '#5B4BF5' },
  { value: '80+', label: 'Countries reached', color: '#FF6B9D' },
  { value: '$200k+', label: 'Earned by artists', color: '#00BCD4' },
  { value: '48k', label: 'Artworks shared', color: '#FF6B35' },
];

export default function About() {
  return (
    <div className="about-page page-wrapper">
      {/* Story */}
      <section className="about-hero">
        <div className="container about-hero-inner">
          <div className="about-hero-left">
            <span className="eyebrow">Our Story</span>
            <h1>Born from a love of art and a need for community</h1>
            <p>
              Earts was founded in 2022 by a group of artists who felt unseen on existing platforms.
              We built the space we always wished existed — one that truly puts creators first.
            </p>
          </div>
          <div className="about-stats">
            {STATS.map(s => (
              <div key={s.label} className="about-stat-card" style={{ background: s.color }}>
                <span className="about-stat-value">{s.value}</span>
                <span className="about-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
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
                <span className="value-icon">{v.icon}</span>
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
            <span className="eyebrow">Our journey</span>
            <h2>How we got here</h2>
          </div>
          <div className="timeline">
            {[
              { year: '2022', title: 'Earts founded', desc: 'Four artists with a dream built the first version of Earts in a shared studio in Madrid.' },
              { year: '2023', title: '10,000 artists joined', desc: 'The community grew to 10k artists across 40+ countries in just one year.' },
              { year: '2024', title: '$100k earned by artists', desc: 'Our marketplace hit $100,000 in artist earnings — proof the model works.' },
              { year: '2025', title: 'Global expansion', desc: 'We opened regional hubs in Nairobi, Tokyo, and São Paulo.' },
              { year: '2026', title: 'Today', desc: '12k+ artists, 80 countries, and a community that keeps growing every day.' },
            ].map((item, i) => (
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
