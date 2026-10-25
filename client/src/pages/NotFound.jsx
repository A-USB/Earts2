import { Link } from 'react-router-dom';
import './NotFound.css';
import { Palette } from 'lucide-react';
import IconTile from '../components/IconTile';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-art"><IconTile Icon={Palette} size="xl" tone="soft" /></div>
        <h1>404</h1>
        <h2>This canvas is empty</h2>
        <p>The page you're looking for doesn't exist — maybe the artist moved it somewhere else.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">Go back home</Link>
          <Link to="/feed" className="btn-outline">Explore your feed</Link>
        </div>
      </div>
    </div>
  );
}
