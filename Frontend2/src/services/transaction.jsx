import axios from 'axios';
import { syncOfflineTransactions } from './offlineStorage';

const API_URL = 'http://localhost:5000/api/transactions';

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

// Add new transaction
export const addTransaction = async (transactionData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, transactionData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get all transactions
export const getTransactions = async (filters = {}) => {
  try {
    // First try to sync any offline transactions
    try {
      await syncOfflineTransactions();
    } catch (syncError) {
      console.error('Error syncing offline transactions:', syncError);
    }
    
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, {
      ...authHeader,
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete transaction
export const deleteTransaction = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get transaction statistics
export const getTransactionStats = async (period = 'month') => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/stats?period=${period}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction statistics:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};