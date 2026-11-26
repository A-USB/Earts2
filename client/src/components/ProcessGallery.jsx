import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Layers } from 'lucide-react';
import { api } from '../utils/api';
import LoadError from './LoadError';
import ProcessPostModal from './ProcessPostModal';
import './ProcessGallery.css';

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Work-in-progress updates.
 *  layout "grid":  an artist's whole Process tab (pass artistId)
 *  layout "strip": the "Making of" row on one artwork (pass artworkId); hidden when empty unless you own it
 */
export default function ProcessGallery({ artistId, artworkId, isOwner = false, ownArtworks = [], layout = 'grid', title = 'Making of' }) {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => {
    setError('');
    const query = artworkId ? `artworkId=${encodeURIComponent(artworkId)}` : `artistId=${encodeURIComponent(artistId)}`;
    api.get(`/process?${query}`).then(setPosts).catch(err => setError(err.message || 'Unable to load process posts.'));
  }, [artistId, artworkId]);

  useEffect(() => { load(); }, [load]);

  const remove = async (post) => {
    setBusyId(post.id);
    setActionError('');
    try {
      await api.delete(`/process/${post.id}`);
      setPosts(current => current.filter(item => item.id !== post.id));
      setConfirmId('');
    } catch (err) {
      setActionError(err.message || 'Unable to delete this update.');
    } finally {
      setBusyId('');
    }
  };

  if (error) return layout === 'strip' ? null : <LoadError title="Couldn’t load process posts" message={error} onRetry={load} />;
  if (!posts) return layout === 'strip' ? null : <p className="pg-loading" role="status">Loading…</p>;
  if (layout === 'strip' && posts.length === 0 && !isOwner) return null;

  const addButton = isOwner && (
    <button type="button" className="btn-outline pg-add" onClick={() => setAdding(true)}>
      <Plus size={15} /> {layout === 'strip' ? 'Add a process shot' : 'Share an update'}
    </button>
  );

  return (
    <section className={`pg pg-${layout}`} aria-label={layout === 'strip' ? title : 'Process posts'}>
      {layout === 'strip' ? (
        <div className="pg-head">
          <h4><Layers size={16} /> {title}</h4>
          {addButton}
        </div>
      ) : (
        addButton && <div className="pg-head right">{addButton}</div>
      )}

      {actionError && <p className="pg-error" role="alert">{actionError}</p>}

      {posts.length === 0 ? (
        <div className="pg-empty card">
          <Layers size={30} />
          <h4>No process posts yet</h4>
          <p>{isOwner ? 'Share sketches and work-in-progress shots so people can follow how your pieces are made.' : 'This artist hasn’t shared any work in progress yet.'}</p>
        </div>
      ) : (
        <ul className="pg-list">
          {posts.map(post => (
            <li key={post.id} className="pg-item">
              <a href={post.imageUrl} target="_blank" rel="noopener noreferrer" className="pg-image" style={{ background: post.color }} aria-label="Open the full image">
                <img src={post.imageUrl} alt={post.caption || post.stage || 'Work in progress'} loading="lazy" />
                {post.stage && <span className="pg-stage">{post.stage}</span>}
              </a>
              <div className="pg-body">
                {post.caption && <p className="pg-caption">{post.caption}</p>}
                <div className="pg-meta">
                  <span>{formatDate(post.createdAt)}</span>
                  {post.artwork && layout !== 'strip' && <Link to={`/artwork/${post.artwork.id}`}>Part of “{post.artwork.title}”</Link>}
                </div>
                {isOwner && (
                  confirmId === post.id ? (
                    <div className="pg-confirm">
                      <span>Delete this update?</span>
                      <button type="button" onClick={() => setConfirmId('')} disabled={busyId === post.id}>Keep</button>
                      <button type="button" className="danger" onClick={() => remove(post)} disabled={busyId === post.id}>{busyId === post.id ? 'Deleting…' : 'Delete'}</button>
                    </div>
                  ) : (
                    <button type="button" className="pg-delete" onClick={() => setConfirmId(post.id)} aria-label="Delete this update"><Trash2 size={14} /> Delete</button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <ProcessPostModal
          artworks={ownArtworks}
          defaultArtworkId={artworkId || ''}
          onClose={() => setAdding(false)}
          onPosted={() => load()}
        />
      )}
    </section>
  );
}
