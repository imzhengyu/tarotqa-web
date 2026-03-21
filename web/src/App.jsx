import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Divination from './pages/Divination';
import Cards from './pages/Cards';
import Horoscope from './pages/Horoscope';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="divination" element={<Divination />} />
        <Route path="cards" element={<Cards />} />
        <Route path="horoscope" element={<Horoscope />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;