import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check token validity
  const checkTokenValidity = (token) => {
    if (!token) return false;
    
    try {
      // For JWT tokens, decode and check expiration
      if (token.split('.').length === 3) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp && payload.exp * 1000 > Date.now();
      }
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check for stored user and token
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        if (checkTokenValidity(token)) {
          setUser(JSON.parse(storedUser));
          setIsTokenValid(true);
        } else {
          // Token expired
          handleLogout();
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  // Listen for auth errors across the app
  useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.type === 'auth-error') {
        handleLogout();
      }
    };

    window.addEventListener('app-event', handleAuthError);
    return () => window.removeEventListener('app-event', handleAuthError);
  }, [navigate]);

  const handleLogin = async (email, password) => {
    try {
      const response = await login(email, password);
      if (!response.data || !response.token) {
        throw new Error('Invalid server response');
      }
      
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.token);
      setUser(response.data.user);
      setIsTokenValid(true);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsTokenValid(false);
      throw error;
    }
  };

  const handleSignup = async (email, password) => {
    try {
      const response = await signup(email, password);
      if (!response.data || !response.token) {
        throw new Error('Invalid server response');
      }
      
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('token', response.token);
      setUser(response.data.user);
      setIsTokenValid(true);
      navigate('/');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setIsTokenValid(false);
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsTokenValid(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      handleLogin, 
      handleSignup, 
      handleLogout,
      isTokenValid,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;