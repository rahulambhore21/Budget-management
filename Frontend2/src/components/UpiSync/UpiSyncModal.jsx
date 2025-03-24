import { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { linkRazorpayAccount, syncUpiTransactions } from '../../services/razorpay';
import AuthContext from '../../context/AuthContext';
import './UpiSync.css';

const UpiSyncModal = ({ isOpen, onClose, onSyncComplete }) => {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { handleLogout } = useContext(AuthContext);
  
  if (!isOpen) return null;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await linkRazorpayAccount(credentials);
      
      if (response.status === 'success') {
        toast.success('Account linked successfully!');
        setStep(2);
      } else {
        toast.error(response.message || 'Failed to link account');
      }
    } catch (error) {
      console.error('Error linking account:', error);
      
      // Check for auth errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error(error.message || 'An error occurred while linking your account');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSync = async () => {
    setSyncing(true);
    
    try {
      const response = await syncUpiTransactions();
      
      if (response.status === 'success') {
        toast.success(`Successfully synced ${response.data.transactionsImported} transactions!`);
        
        if (typeof onSyncComplete === 'function') {
          onSyncComplete(response.data.transactions);
        }
        
        onClose();
      } else {
        toast.error(response.message || 'Failed to sync transactions');
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      
      // Check for auth errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error(error.message || 'An error occurred while syncing transactions');
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <div className="upi-sync-modal-overlay">
      <div className="upi-sync-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="upi-sync-header">
          <h2>Sync UPI Transactions</h2>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>
        </div>
        
        {step === 1 && (
          <div className="step-content">
            <h3>Link Your Razorpay Account</h3>
            <p className="step-description">
              Connect your Razorpay account to automatically import UPI transactions. 
              Your credentials are securely transmitted and not stored.
            </p>
            
            <form onSubmit={handleLinkAccount}>
              <div className="form-group">
                <label>Razorpay Email</label>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleInputChange}
                  placeholder="Enter your Razorpay email"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Razorpay Password</label>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  placeholder="Enter your Razorpay password"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="security-note">
                <div className="security-icon">🔒</div>
                <p>
                  Your credentials are transmitted securely and are only used for authentication.
                  We don't store your password.
                </p>
              </div>
              
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Account'}
              </button>
            </form>
          </div>
        )}
        
        {step === 2 && (
          <div className="step-content">
            <h3>Sync UPI Transactions</h3>
            <p className="step-description">
              Your Razorpay account is now connected! You can now sync your UPI transactions.
              The system will import all your recent UPI transactions and categorize them automatically.
            </p>
            
            <div className="sync-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div className="benefit-text">Fast import of all transactions</div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔄</div>
                <div className="benefit-text">Auto-categorization based on merchant</div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📊</div>
                <div className="benefit-text">Instant spending insights</div>
              </div>
            </div>
            
            <p className="sync-note">
              This will import all transactions from the last 30 days that were not already recorded.
            </p>
            
            <div className="button-group">
              <button 
                onClick={handleSync} 
                className="sync-btn"
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : 'Sync Transactions'}
              </button>
              
              <button 
                onClick={onClose} 
                className="cancel-btn"
                disabled={syncing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpiSyncModal;
