import axios from 'axios';

const MOCK_API_URL = 'http://localhost:5000/api/razorpay';

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
    const response = await axios.get(`${MOCK_API_URL}/transactions`, {
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

// Verify a UPI ID
export const verifyUpiId = async (upiId) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(`${MOCK_API_URL}/verify-upi`, { upiId }, authHeader);
    
    // Enhanced response with merchant information when available
    if (response.data.isValid && response.data.merchantInfo) {
      console.log('Merchant info detected:', response.data.merchantInfo);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error verifying UPI ID:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    return { 
      isValid: false, 
      message: error.response?.data?.message || 'Failed to verify UPI ID' 
    };
  }
};

// Link Razorpay account
export const linkRazorpayAccount = async (credentials) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(`${MOCK_API_URL}/link-account`, credentials, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error linking Razorpay account:', error);
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
    const response = await axios.post(`${MOCK_API_URL}/sync`, {}, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error syncing UPI transactions:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
