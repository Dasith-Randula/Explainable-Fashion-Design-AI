import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DesignStudio from './pages/DesignStudio'
import Explore from './pages/Explore'
import Forecast from './pages/Forecast'
import Home from './pages/Home'
import './styles/home.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/design-studio" element={<DesignStudio />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/my-designs" element={<Home />} />
        <Route path="/about" element={<Home />} />
        <Route path="/contact" element={<Home />} />
        <Route path="/login" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
