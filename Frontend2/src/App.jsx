import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import BudgetPlanner from './pages/BudgetPlanner';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import NotFound from './pages/NotFound';
import AiAdvisor from './pages/AiAdvisor';
import PrivateRoute from './components/Shared/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          
          <Route path="/budget" element={
            <PrivateRoute>
              <BudgetPlanner />
            </PrivateRoute>
          } />
          
          <Route path="/insights" element={
            <PrivateRoute>
              <Insights />
            </PrivateRoute>
          } />
          
          <Route path="/reports" element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          } />
          
          <Route path="/ai-advisor" element={
            <PrivateRoute>
              <AiAdvisor />
            </PrivateRoute>
          } />
          
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;