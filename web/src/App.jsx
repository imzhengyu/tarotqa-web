import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Divination from './pages/Divination';
import Cards from './pages/Cards';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import ZiweiChart from './pages/ziwei/ZiweiChart';
import AstrologyChart from './pages/astrology/AstrologyChart';
import Layout from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="divination" element={<Divination />} />
        <Route path="cards" element={<Cards />} />
        <Route path="profile" element={<Profile />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="ziwei/chart" element={<ZiweiChart />} />
        <Route path="astrology/chart" element={<AstrologyChart />} />
      </Route>
    </Routes>
  );
}

export default App;