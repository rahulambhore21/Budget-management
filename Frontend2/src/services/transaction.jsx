import axios from 'axios';

const API_URL = 'http://localhost:5000/api/transactions';

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

export const addTransaction = async (data) => {
  try {
    // Ensure date is properly formatted if not provided
    const transactionData = { 
      ...data,
      date: data.date || new Date().toISOString()
    };
    
    // Make sure amount is sent as a number, not a string
    if (typeof transactionData.amount === 'string') {
      transactionData.amount = parseFloat(transactionData.amount);
    }
    
    console.log('Sending transaction data:', transactionData);
    
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, transactionData, authHeader);
    console.log('Transaction response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Add transaction error:', error);
    
    // Provide more detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Check for token issues
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      throw new Error('Your session has expired. Please login again.');
    }
    
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, authHeader);
    return response.data;
  } catch (error) {
    console.error('Get transactions error:', error.response?.data || error.message);
    
    // Check for token issues
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      throw new Error('Your session has expired. Please login again.');
    }
    
    throw error;
  }
};

export const deleteTransaction = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Delete transaction error:', error.response?.data || error.message);
    
    // Check for token issues
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      throw new Error('Your session has expired. Please login again.');
    }
    
    throw error;
  }
};