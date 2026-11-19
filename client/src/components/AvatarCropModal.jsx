import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, RotateCcw, X } from 'lucide-react';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clamp,
  clampPan,
  frameScale,
  loadAvatarSource,
  renderAvatarCrop,
} from '../utils/cropAvatarImage';
import './AvatarCropModal.css';

const FRAME_RATIO = 0.74;   // the round frame is 74% of the stage; the rest shows the dimmed photo around it
const PREVIEW_SIZE = 56;

export default function AvatarCropModal({ file, onCancel, onSave }) {
  const [source, setSource] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const live = useRef({ zoom: MIN_ZOOM, pan: { x: 0, y: 0 } });   // always-current values for event handlers

  const image = source?.image;
  const width = image?.naturalWidth || 1;
  const height = image?.naturalHeight || 1;
  const frame = stageSize * FRAME_RATIO;

  // Load the chosen file
  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    loadAvatarSource(file)
      .then((loaded) => {
        objectUrl = loaded.url;
        if (!cancelled) setSource(loaded);
        else URL.revokeObjectURL(loaded.url);
      })
      .catch((err) => { if (!cancelled) setLoadError(err.message || 'Unable to read this image.'); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // Keep the stage size current (rotation, window resize); the crop itself is stored in frame units
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const measure = () => setStageSize(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Lock page scroll, move focus into the card, restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, []);

  // Esc closes
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const update = useCallback((nextZoom, nextPan) => {
    const safeZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const safePan = clampPan(nextPan, safeZoom, width, height);
    live.current = { zoom: safeZoom, pan: safePan };
    setZoom(safeZoom);
    setPan(safePan);
  }, [width, height]);

  // Zoom keeps the centre of the frame fixed
  const zoomTo = useCallback((nextZoom) => {
    const { zoom: current, pan: currentPan } = live.current;
    const target = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const ratio = target / current;
    update(target, { x: currentPan.x * ratio, y: currentPan.y * ratio });
  }, [update]);

  // Mouse wheel / trackpad zoom (needs a non-passive listener so the page doesn't scroll)
  useEffect(() => {
    const element = stageRef.current;
    if (!element || !image) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      zoomTo(live.current.zoom * Math.exp(-event.deltaY * 0.0015));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [image, zoomTo]);

  const beginGesture = () => {
    const points = [...pointers.current.values()];
    if (points.length === 1) {
      gesture.current = { type: 'drag', startX: points[0].x, startY: points[0].y, startPan: live.current.pan };
    } else if (points.length >= 2) {
      const [a, b] = points;
      gesture.current = {
        type: 'pinch',
        startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startZoom: live.current.zoom,
        startPan: live.current.pan,
      };
    } else {
      gesture.current = null;
    }
  };

  const onPointerDown = (event) => {
    if (!image || busy) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setDragging(true);
    beginGesture();
  };

  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current || !frame) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const current = gesture.current;
    if (current.type === 'drag') {
      update(live.current.zoom, {
        x: current.startPan.x + (event.clientX - current.startX) / frame,
        y: current.startPan.y + (event.clientY - current.startY) / frame,
      });
    } else {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const target = clamp(current.startZoom * (distance / current.startDistance), MIN_ZOOM, MAX_ZOOM);
      const ratio = target / current.startZoom;
      update(target, { x: current.startPan.x * ratio, y: current.startPan.y * ratio });
    }
  };

  const onPointerUp = (event) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 0) setDragging(false);
    beginGesture();
  };

  const onStageKeyDown = (event) => {
    if (!image || busy) return;
    const step = (event.shiftKey ? 0.06 : 0.02);
    const { zoom: currentZoom, pan: currentPan } = live.current;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[event.key]) {
      event.preventDefault();
      update(currentZoom, { x: currentPan.x + moves[event.key][0], y: currentPan.y + moves[event.key][1] });
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomTo(currentZoom + 0.15);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomTo(currentZoom - 0.15);
    }
  };

  const reset = () => update(MIN_ZOOM, { x: 0, y: 0 });

  const handleSave = async () => {
    if (!image || busy) return;
    setBusy(true);
    setError('');
    try {
      const dataUrl = await renderAvatarCrop(image, { zoom, panX: pan.x, panY: pan.y });
      await onSave(dataUrl);
    } catch (err) {
      setError(err.message || 'Unable to save this photo.');
      setBusy(false);
    }
  };

  const scale = frameScale(width, height, zoom);
  const imageTransform = (size) =>
    `translate(-50%, -50%) translate(${pan.x * size}px, ${pan.y * size}px) scale(${scale * size})`;
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="avatar-crop-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div
        ref={dialogRef}
        className="avatar-crop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        tabIndex={-1}
      >
        <div className="avatar-crop-head">
          <div>
            <h3 id="avatar-crop-title">Adjust your photo</h3>
            <p>Drag to reposition and zoom to choose what stays in the circle.</p>
          </div>
          <button type="button" className="avatar-crop-close" onClick={onCancel} disabled={busy} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div
          ref={stageRef}
          className={`avatar-crop-stage ${dragging ? 'is-dragging' : ''} ${image ? '' : 'is-empty'}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onStageKeyDown}
          tabIndex={image ? 0 : -1}
          role="group"
          aria-label="Photo position. Use the arrow keys to move and plus or minus to zoom."
        >
          {image && frame > 0 && (
            <img
              className="avatar-crop-image"
              src={source.url}
              alt=""
              draggable={false}
              style={{ width: width, height: height, transform: imageTransform(frame) }}
            />
          )}
          {image && <div className="avatar-crop-ring" style={{ width: `${FRAME_RATIO * 100}%` }} aria-hidden="true" />}
          {!image && <p className="avatar-crop-status">{loadError || 'Loading photo…'}</p>}
        </div>

        <div className="avatar-crop-controls">
          <button type="button" className="avatar-crop-icon-btn" onClick={() => zoomTo(zoom - 0.25)} disabled={!image || busy || zoom <= MIN_ZOOM} aria-label="Zoom out">
            <Minus size={16} />
          </button>
          <input
            className="avatar-crop-slider"
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            disabled={!image || busy}
            onChange={(event) => zoomTo(Number(event.target.value))}
            aria-label="Zoom"
            style={{ '--fill': `${((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` }}
          />
          <button type="button" className="avatar-crop-icon-btn" onClick={() => zoomTo(zoom + 0.25)} disabled={!image || busy || zoom >= MAX_ZOOM} aria-label="Zoom in">
            <Plus size={16} />
          </button>
          <span className="avatar-crop-zoom-value" aria-hidden="true">{zoomPercent}%</span>
        </div>

        <div className="avatar-crop-footer">
          <div className="avatar-crop-preview-wrap">
            <div className="avatar-crop-preview" style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }} aria-hidden="true">
              {image && (
                <img
                  src={source.url}
                  alt=""
                  draggable={false}
                  style={{ width: width, height: height, transform: imageTransform(PREVIEW_SIZE) }}
                />
              )}
            </div>
            <span>Preview</span>
          </div>
          <button type="button" className="avatar-crop-reset" onClick={reset} disabled={!image || busy}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {error && <p className="avatar-crop-error" role="alert">{error}</p>}

        <div className="avatar-crop-actions">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!image || busy}>
            <Check size={15} /> {busy ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
