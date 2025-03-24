import { useState, useContext, useEffect } from 'react';
import { addTransaction, getTransactions } from '../../services/transaction';
import { toast } from 'react-hot-toast';
import AuthContext from '../../context/AuthContext';
import GstDetails from '../GstCalculator/GstDetails';
import { saveOfflineTransaction, isOnline } from '../../services/offlineStorage';
import { verifyUpiId } from '../../services/razorpay';

const AddTransaction = ({ setTransactions }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    paymentMode: 'UPI',
    upiId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(!isOnline());
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const { handleLogout } = useContext(AuthContext);
  
  // GST rates by category
  const gstRates = {
    'Food': 5,
    'Transport': 12,
    'Shopping': 18,
    'Bills': 0,
    'Investment': 0,
    'Other': 18
  };

  // Check for network status changes
  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset UPI verification state when UPI ID changes
  useEffect(() => {
    setUpiVerified(false);
  }, [formData.upiId]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid positive amount';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.paymentMode) {
      newErrors.paymentMode = 'Payment mode is required';
    }
    
    if (formData.paymentMode === 'UPI' && !formData.upiId) {
      newErrors.upiId = 'UPI ID is required for UPI payments';
    } else if (formData.paymentMode === 'UPI' && !formData.upiId.includes('@')) {
      newErrors.upiId = 'Please enter a valid UPI ID with @ symbol';
    } else if (formData.paymentMode === 'UPI' && !offlineMode && !upiVerified) {
      newErrors.upiId = 'Please verify your UPI ID before submitting';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a valid date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyUpi = async () => {
    if (!formData.upiId || !formData.upiId.includes('@')) {
      setErrors({...errors, upiId: 'Please enter a valid UPI ID with @ symbol'});
      return;
    }

    setVerifyingUpi(true);
    try {
      const result = await verifyUpiId(formData.upiId);
      if (result.isValid) {
        setUpiVerified(true);
        toast.success('UPI ID verified successfully');
        setErrors({...errors, upiId: null});
        
        // Check if the UPI has a known merchant name and suggest category
        if (result.merchantInfo && result.merchantInfo.category) {
          const suggestedCategory = result.merchantInfo.category;
          if (gstRates[suggestedCategory]) {
            toast.success(`Based on this UPI ID, we suggest "${suggestedCategory}" as the category`);
            setFormData(prev => ({ ...prev, category: suggestedCategory }));
          }
        }
      } else {
        setUpiVerified(false);
        setErrors({...errors, upiId: result.message || 'Invalid UPI ID'});
      }
    } catch (error) {
      console.error('UPI verification error:', error);
      setUpiVerified(false);
      setErrors({...errors, upiId: 'Failed to verify UPI ID'});
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error('Failed to verify UPI ID');
    } finally {
      setVerifyingUpi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // Calculate GST rate based on category
    const gstRate = gstRates[formData.category] || 0;
    
    // Convert amount to number explicitly and add GST rate
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      gstRate
    };
    
    // If offline, save to local storage
    if (offlineMode) {
      try {
        const savedTransaction = saveOfflineTransaction(transactionData);
        toast.success('Transaction saved offline. It will sync when you are back online.');
        
        // Reset form
        setFormData({
          amount: '',
          category: 'Food',
          paymentMode: 'UPI',
          upiId: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        setErrors({});
        setUpiVerified(false);
      } catch (error) {
        console.error('Offline save error:', error);
        toast.error('Failed to save transaction offline');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // Otherwise proceed with online submission
    try {
      console.log('Submitting transaction:', transactionData);
      const response = await addTransaction(transactionData);
      
      if (!response || response.status === 'fail') {
        throw new Error(response?.message || 'Failed to add transaction');
      }
      
      toast.success('Transaction added successfully!');
      
      // Refresh transactions list
      try {
        const transactionsResponse = await getTransactions();
        if (transactionsResponse && transactionsResponse.data && Array.isArray(transactionsResponse.data.transactions)) {
          setTransactions(transactionsResponse.data.transactions);
        } else {
          console.error('Invalid response format:', transactionsResponse);
          toast.error('Transaction added but failed to refresh list');
        }
      } catch (fetchError) {
        console.error('Error fetching transactions after add:', fetchError);
        
        // Check for authentication errors
        if (fetchError.message && fetchError.message.includes('session has expired')) {
          toast.error('Your session has expired. Please login again.');
          handleLogout();
          return;
        }
        
        toast.error('Transaction added but failed to refresh list');
      }
      
      // Reset form
      setFormData({
        amount: '',
        category: 'Food',
        paymentMode: 'UPI',
        upiId: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
      setUpiVerified(false);
    } catch (error) {
      console.error('Transaction submission error:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      const message = error.response?.data?.message || error.message || 'Failed to add transaction';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview transaction with GST details
  const previewTransaction = {
    ...formData,
    amount: parseFloat(formData.amount) || 0,
    gstRate: gstRates[formData.category] || 0
  };

  return (
    <div className="transaction-form">
      <h3>Add New Transaction</h3>
      
      {offlineMode && (
        <div className="offline-notice">
          <span>📶 You're currently offline. Transactions will be saved locally and synced when you're back online.</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className={errors.amount ? 'error' : ''}
            disabled={isSubmitting}
            placeholder="Enter amount"
            required
          />
          {errors.amount && <div className="error-text">{errors.amount}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isSubmitting}
            >
              <option value="Food">Food (5% GST)</option>
              <option value="Transport">Transport (12% GST)</option>
              <option value="Shopping">Shopping (18% GST)</option>
              <option value="Bills">Bills (0% GST)</option>
              <option value="Investment">Investment (0% GST)</option>
              <option value="Other">Other (18% GST)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={errors.date ? 'error' : ''}
              disabled={isSubmitting}
              max={new Date().toISOString().split('T')[0]}
              required
            />
            {errors.date && <div className="error-text">{errors.date}</div>}
          </div>
        </div>

        <div className="form-group">
          <label>Payment Mode</label>
          <select
            value={formData.paymentMode}
            onChange={(e) => {
              const newMode = e.target.value;
              setFormData({ 
                ...formData, 
                paymentMode: newMode,
                // Clear UPI ID if switching away from UPI
                upiId: newMode !== 'UPI' ? '' : formData.upiId
              });
              setUpiVerified(false);
            }}
            disabled={isSubmitting}
          >
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>

        {formData.paymentMode === 'UPI' && (
          <div className="form-group">
            <label>UPI ID</label>
            <div className="upi-input-group">
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="name@bank or nickname@upi"
                className={errors.upiId ? 'error' : upiVerified ? 'verified' : ''}
                disabled={isSubmitting || verifyingUpi}
                required
              />
              {!offlineMode && (
                <button 
                  type="button" 
                  className={`verify-upi-btn ${upiVerified ? 'verified' : ''}`}
                  onClick={handleVerifyUpi}
                  disabled={!formData.upiId || !formData.upiId.includes('@') || isSubmitting || verifyingUpi}
                >
                  {verifyingUpi ? 'Verifying...' : upiVerified ? 'Verified ✓' : 'Verify'}
                </button>
              )}
            </div>
            {errors.upiId && <div className="error-text">{errors.upiId}</div>}
            {upiVerified && <div className="success-text">UPI ID verified successfully</div>}
          </div>
        )}

        <div className="form-group">
          <label>Description (optional)</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the transaction"
            disabled={isSubmitting}
          />
        </div>

        {formData.amount > 0 && (
          <GstDetails transaction={previewTransaction} />
        )}

        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? 'Adding...' : `Add Transaction${offlineMode ? ' (Offline)' : ''}`}
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;