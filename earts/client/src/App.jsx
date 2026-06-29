import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Gallery from './pages/Gallery'
import About from './pages/About'
import Products from './pages/Products'
import Profile from './pages/Profile'
import ArtworkDetail from './pages/ArtworkDetail'
import UploadArtwork from './pages/UploadArtwork'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/artwork/:id" element={<ArtworkDetail />} />
              <Route path="/upload" element={<UploadArtwork />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
