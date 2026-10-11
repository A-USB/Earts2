import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import AvatarPicker from '../components/AvatarPicker';
import './ChooseAvatar.css';

export default function ChooseAvatar() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.avatarSeed) navigate('/feed', { replace: true });
  }, [navigate, user?.avatarSeed]);

  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    setError('');
    try {
      const updatedUser = await api.patch('/users/me', { avatar: null, avatarSeed: selected });
      updateUser(updatedUser);
      navigate('/feed', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to save your avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="choose-avatar-page page-wrapper">
      <section className="choose-avatar-card card">
        <span className="choose-avatar-icon"><Palette size={20} /></span>
        <p className="eyebrow">Make it yours</p>
        <h1>Choose your Earts avatar</h1>
        <p className="choose-avatar-description">Pick an illustrated avatar for your new profile. You can change it or upload your own photo later in Settings.</p>
        <AvatarPicker value={selected} onChange={setSelected} disabled={saving} />
        {error && <p className="choose-avatar-error" role="alert">{error}</p>}
        <button className="btn-primary choose-avatar-continue" onClick={handleContinue} disabled={!selected || saving}>
          {saving ? 'Saving your choice…' : 'Continue to Earts'} <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
}
