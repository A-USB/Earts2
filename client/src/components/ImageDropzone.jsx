import { useRef, useState } from 'react';
import { ImagePlus, RefreshCw, X } from 'lucide-react';
import { ACCEPT_ATTR, formatBytes, processArtworkFile } from '../utils/artworkImage';
import './ImageDropzone.css';

// Image-first picker: drop a file or browse. The picked file is checked, resized and
// colour-sampled by the shared processor, then handed back through onChange.
export default function ImageDropzone({ image, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await processArtworkFile(file));
    } catch (err) {
      setError(err.message || 'Unable to use this image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="imgdrop">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="imgdrop-input"
        tabIndex={-1}
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {image ? (
        <div className="imgdrop-preview">
          <div className="imgdrop-frame">
            <img src={image.dataUrl} alt="Preview of your artwork" />
          </div>
          <div className="imgdrop-meta">
            <span className="imgdrop-name">{image.name}</span>
            <span>{image.width} × {image.height} · {formatBytes(image.sizeBytes)}{image.resized ? ' · resized for you' : ''}</span>
          </div>
          <div className="imgdrop-actions">
            <button type="button" className="imgdrop-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
              <RefreshCw size={15} aria-hidden="true" /> {busy ? 'Preparing…' : 'Replace'}
            </button>
            <button type="button" className="imgdrop-btn" onClick={() => { onChange(null); setError(''); }}>
              <X size={15} aria-hidden="true" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`imgdrop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setDragging(false); }}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
          aria-busy={busy}
        >
          <span className="imgdrop-icon"><ImagePlus size={30} aria-hidden="true" /></span>
          <strong>{busy ? 'Preparing your image…' : 'Drop your artwork here'}</strong>
          <span className="imgdrop-hint">or click to choose a file. PNG, JPG, WEBP or GIF, up to 25 MB. Large images are resized for you.</span>
        </button>
      )}

      {error && <div className="imgdrop-error" role="alert">{error}</div>}
    </div>
  );
}
