import { Paintbrush } from 'lucide-react';
import { EartsLogo } from './EartsLogo';
import './FeedTransition.css';

export default function FeedTransition() {
  return (
    <div className="feed-transition" role="status" aria-label="Opening your Earts feed">
      <div className="feed-transition-content">
        <EartsLogo size={52} className="feed-transition-logo" />
        <div className="feed-transition-sweep" aria-hidden="true">
          <span className="feed-transition-paint" />
          <Paintbrush className="feed-transition-brush" size={27} strokeWidth={2.2} />
        </div>
        <span className="feed-transition-caption">Your creative space is ready</span>
      </div>
    </div>
  );
}
