import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import BootstrapPage from './pages/BootstrapPage';
import CreditsPage from './pages/CreditsPage';
import DashboardPage from './pages/DashboardPage';
import EntryPage from './pages/EntryPage';
import GameHubPage from './pages/GameHubPage';
import GamePage from './pages/GamePage';
import GostopGamePage from './pages/GostopGamePage';
import GostopLobbyPage from './pages/GostopLobbyPage';
import LicensePage from './pages/LicensePage';
import LoginPage from './pages/LoginPage';
import PrivacyPage from './pages/PrivacyPage';
import { OFFLINE_MODE } from './lib/offlineMode';

function LegacyGameRoute() {
  const location = useLocation();
  return <Navigate to={`/matgo/play${location.search}`} replace />;
}

export default function App() {
  return <Routes>
    <Route path="/" element={OFFLINE_MODE ? <Navigate to="/home" replace /> : <EntryPage />} />
    <Route path="/bootstrap" element={OFFLINE_MODE ? <Navigate to="/home" replace /> : <BootstrapPage />} />
    <Route path="/login" element={OFFLINE_MODE ? <Navigate to="/home" replace /> : <LoginPage />} />
    <Route path="/credits" element={<CreditsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/license" element={<LicensePage />} />
    <Route path="/home" element={<GameHubPage />} />
    <Route path="/family" element={OFFLINE_MODE ? <Navigate to="/home" replace /> : <AdminPage />} />
    <Route path="/matgo" element={<DashboardPage />} />
    <Route path="/matgo/play" element={<GamePage />} />
    <Route path="/gostop" element={<GostopLobbyPage />} />
    <Route path="/gostop/play" element={<GostopGamePage />} />
    <Route path="/game" element={<LegacyGameRoute />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
