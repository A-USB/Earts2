import { RefreshCw, WifiOff } from 'lucide-react';
import './LoadError.css';

export default function LoadError({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="load-error card" role="alert">
      <WifiOff size={24} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{message || 'Please check your connection and try again.'}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-outline" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
