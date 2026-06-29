import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-inner">
        <div className="notfound-art">🎨</div>
        <h1>404</h1>
        <h2>This canvas is empty</h2>
        <p>The page you're looking for doesn't exist — maybe the artist moved it somewhere else.</p>
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">Go back home</Link>
          <Link to="/gallery" className="btn-outline">Explore gallery</Link>
        </div>
      </div>
    </div>
  );
}
