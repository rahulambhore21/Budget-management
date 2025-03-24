import axios from 'axios';

const API_URL = 'http://localhost:5000/api/razorpay';

// Get auth header with token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token is missing');
  }
  return {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Fetch UPI transactions (mock)
export const fetchUpiTransactions = async (fromDate, toDate) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/transactions`, {
      ...authHeader,
      params: { fromDate, toDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching UPI transactions:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Verify UPI ID
export const verifyUpiId = async (upiId) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(`${API_URL}/verify-upi`, { upiId }, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error verifying UPI ID:', error);
    
    // If API not available, simulate verification for demo purpose
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      // Basic validation - check if UPI ID contains @ symbol
      const isValid = upiId.includes('@');
      
      // Create mock merchant info for common UPI handles
      let merchantInfo = null;
      
      if (upiId.includes('@oksbi')) {
        merchantInfo = { name: 'SBI Bank', category: 'Bills' };
      } else if (upiId.includes('@ybl')) {
        merchantInfo = { name: 'PhonePe', category: 'Other' };
      } else if (upiId.includes('@paytm')) {
        merchantInfo = { name: 'Paytm', category: 'Shopping' };
      } else if (upiId.includes('@ibl')) {
        merchantInfo = { name: 'ICICI Bank', category: 'Bills' };
      } else if (upiId.includes('@upi')) {
        merchantInfo = { name: 'UPI Payment', category: 'Other' };
      } else if (upiId.includes('@apl')) {
        merchantInfo = { name: 'Amazon Pay', category: 'Shopping' };
      } else if (upiId.includes('@okhdfcbank')) {
        merchantInfo = { name: 'HDFC Bank', category: 'Bills' };
      } else if (upiId.includes('@axl')) {
        merchantInfo = { name: 'Axis Bank', category: 'Bills' };
      }
      
      return {
        isValid,
        message: isValid ? 'UPI ID is valid' : 'Invalid UPI ID format',
        merchantInfo
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    throw error;
  }
};

// Link Razorpay account
export const linkRazorpayAccount = async (credentials) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(`${API_URL}/link-account`, credentials, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error linking Razorpay account:', error);
    
    // If API not available, simulate success for demo purpose
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        message: 'Account linked successfully (Demo Mode)'
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    throw error;
  }
};

// Sync UPI transactions
export const syncUpiTransactions = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(`${API_URL}/sync-transactions`, {}, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error syncing UPI transactions:', error);
    
    // If API not available, simulate success for demo purpose
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      // Generate mock transactions
      const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];
      const paymentModes = ['UPI'];
      const upiIds = ['user@oksbi', 'merchant@ybl', 'store@paytm', 'service@ibl', 'shop@upi'];
      
      const mockTransactions = Array(5).fill().map((_, index) => ({
        _id: `mock-${Date.now()}-${index}`,
        amount: Math.floor(Math.random() * 1000) + 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
        upiId: upiIds[Math.floor(Math.random() * upiIds.length)],
        description: `UPI Transaction ${index + 1}`,
        date: new Date(Date.now() - Math.random() * 604800000).toISOString() // Within last week
      }));
      
      return {
        status: 'success',
        message: 'UPI transactions synced successfully (Demo Mode)',
        data: {
          transactions: mockTransactions,
          transactionsImported: mockTransactions.length
        }
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    throw error;
  }
};
