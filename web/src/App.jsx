import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';
import Layout from './components/Layout';
import RouteFallback from './components/RouteFallback';

const Divination = lazy(() => import('./pages/Divination'));
const Cards = lazy(() => import('./pages/Cards'));
const ZiweiChart = lazy(() => import('./pages/ziwei/ZiweiChart'));
const AstrologyChart = lazy(() => import('./pages/astrology/AstrologyChart'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="statistics" element={<Statistics />} />
        <Route
          path="divination"
          element={<Suspense fallback={<RouteFallback />}><Divination /></Suspense>}
        />
        <Route
          path="cards"
          element={<Suspense fallback={<RouteFallback />}><Cards /></Suspense>}
        />
        <Route
          path="ziwei/chart"
          element={<Suspense fallback={<RouteFallback />}><ZiweiChart /></Suspense>}
        />
        <Route
          path="astrology/chart"
          element={<Suspense fallback={<RouteFallback />}><AstrologyChart /></Suspense>}
        />
      </Route>
    </Routes>
  );
}

export default App;