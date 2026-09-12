import { BrowserRouter, Route, Routes } from 'react-router-dom'
import About from './pages/About'
import Contact from './pages/Contact'
import DesignStudio from './pages/DesignStudio'
import Explore from './pages/Explore'
import Forecast from './pages/Forecast'
import Home from './pages/Home'
import Insights from './pages/Insights'
import MyDesigns from './pages/MyDesigns'
import './styles/home.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/design-studio" element={<DesignStudio />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/my-designs" element={<MyDesigns />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
