import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ArtworkDetail from './pages/ArtworkDetail'
import UploadArtwork from './pages/UploadArtwork'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import './App.css'

// Routes that render as a standalone, focused screen (no site navbar/footer)
const CHROMELESS_ROUTES = ['/login', '/signup'];

function Layout() {
  const location = useLocation();
  const hideChrome = CHROMELESS_ROUTES.includes(location.pathname);

  return (
    <div className="app-shell">
      {!hideChrome && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/artwork/:id" element={<ArtworkDetail />} />
          <Route path="/upload" element={<ProtectedRoute><UploadArtwork /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  )
}