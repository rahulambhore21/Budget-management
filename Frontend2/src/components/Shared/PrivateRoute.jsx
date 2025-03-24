import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Navbar from './Navbar';

const PrivateRoute = ({ children }) => {
  const { user, isTokenValid, loading, handleLogout } = useContext(AuthContext);

  useEffect(() => {
    // Check if token is invalid but we still have a user
    if (!loading && !isTokenValid && user) {
      handleLogout();
    }
  }, [isTokenValid, user, loading, handleLogout]);

  // Show loading state
  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // Redirect to login if no user or invalid token
  if (!user || !isTokenValid) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default PrivateRoute;
