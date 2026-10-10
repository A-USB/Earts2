import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Feed from './pages/Feed'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import ArtworkDetail from './pages/ArtworkDetail'
import UploadArtwork from './pages/UploadArtwork'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Logout from './pages/Logout'
import NotFound from './pages/NotFound'
import FeedTransition from './components/FeedTransition'
import './App.css'

// These routes always keep the classic top navbar, logged in or not
const TOP_NAV_ROUTES = ['/', '/login', '/signup', '/logout', '/forgot-password', '/reset-password'];
// Auth screens render with no navbar/footer at all (standalone focused screen)
const CHROMELESS_ROUTES = ['/login', '/signup', '/logout', '/forgot-password', '/reset-password'];

function HomeRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(() => navigate('/feed', { replace: true }), reducedMotion ? 100 : 900);
    return () => window.clearTimeout(timeout);
  }, [loading, navigate, user]);

  if (loading) return localStorage.getItem('earts_token') ? <FeedTransition /> : null;
  if (user) return <FeedTransition />;
  return <Home />;
}

function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const hideChrome = CHROMELESS_ROUTES.includes(location.pathname);
  const useSidebar = !!user && !TOP_NAV_ROUTES.includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/explore" element={<Marketplace />} />
      <Route path="/gallery" element={<Marketplace />} />
      <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/artwork/:id" element={<ArtworkDetail />} />
      <Route path="/upload" element={<ProtectedRoute><UploadArtwork /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (useSidebar) {
    return (
      <div className="app-shell app-shell-sidebar">
        <Sidebar />
        <div className="app-main-col">
          <main>{routes}</main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {!hideChrome && <Navbar />}
      <main>{routes}</main>
      {!hideChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
