import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
      <div className="not-found-image">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/5578/5578703.png" 
          alt="Page not found illustration"
          style={{ maxWidth: '200px', margin: '20px 0' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button 
          className="btn-secondary" 
          onClick={() => navigate(-1)}
          aria-label="Go back to previous page"
        >
          Go Back
        </button>
        <Link to="/" className="back-link">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
