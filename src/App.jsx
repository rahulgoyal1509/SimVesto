import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Trade from './pages/Trade';
import Holdings from './pages/Holdings';
import Orders from './pages/Orders';
import Advisor from './pages/Advisor';
import Chatbot from './pages/Chatbot';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="explore" element={<Explore />} />
        <Route path="trade/:symbol" element={<Trade />} />
        <Route path="holdings" element={<Holdings />} />
        <Route path="orders" element={<Orders />} />
        <Route path="advisor" element={<Advisor />} />
        <Route path="chat" element={<Chatbot />} />
        <Route path="insights" element={<Insights />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
