import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Navbar = () => {
  const { user, handleLogout } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          RupeeRakshak
        </Link>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/budget" className={`nav-link ${isActive('/budget') ? 'active' : ''}`}>Budget</Link>
          <Link to="/insights" className={`nav-link ${isActive('/insights') ? 'active' : ''}`}>Insights</Link>
          <Link to="/reports" className={`nav-link ${isActive('/reports') ? 'active' : ''}`}>Reports</Link>
          <Link to="/ai-advisor" className={`nav-link ${isActive('/ai-advisor') ? 'active' : ''}`}>AI Advisor</Link>
        </div>
        
        <div className="nav-menu">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          {user ? (
            <div className="user-menu">
              <button className="user-button" onClick={toggleDropdown}>
                <span className="welcome-text">Welcome, {user.email.split('@')[0]}</span>
                <span className="dropdown-icon">▼</span>
              </button>
              
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item user-email">{user.email}</div>
                  <Link to="/" className="dropdown-item" onClick={closeDropdown}>Dashboard</Link>
                  <Link to="/budget" className="dropdown-item" onClick={closeDropdown}>Budget Planner</Link>
                  <Link to="/insights" className="dropdown-item" onClick={closeDropdown}>Financial Insights</Link>
                  <Link to="/reports" className="dropdown-item" onClick={closeDropdown}>Reports</Link>
                  <Link to="/ai-advisor" className="dropdown-item" onClick={closeDropdown}>AI Advisor</Link>
                  <button className="dropdown-item logout" onClick={() => {
                    closeDropdown();
                    handleLogout();
                  }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
