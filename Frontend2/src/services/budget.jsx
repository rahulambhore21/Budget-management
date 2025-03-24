import axios from 'axios';

const API_URL = 'http://localhost:5000/api/budget';

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

// Set budget limit
export const setBudgetLimit = async (category, amount) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, {
      category,
      amount
    }, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error setting budget limit:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get all budget limits
export const getBudgetLimits = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget limits:', error);
    
    // If API is not available or returns error, return mock data
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        data: {
          limits: [
            {
              _id: '1',
              category: 'Food',
              amount: 5000,
              period: 'monthly'
            },
            {
              _id: '2',
              category: 'Transport',
              amount: 3000,
              period: 'monthly'
            },
            {
              _id: '3',
              category: 'Shopping',
              amount: 4000,
              period: 'monthly'
            }
          ]
        }
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Update budget limit
export const updateBudgetLimit = async (id, amount) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/${id}`, {
      amount
    }, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error updating budget limit:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete budget limit
export const deleteBudgetLimit = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting budget limit:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get budget status
export const getBudgetStatus = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/status`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget status:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get budget tips
export const getBudgetTips = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/tips`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget tips:', error);
    
    // If API is not available, return mock tips
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        data: {
          tips: [
            {
              id: 1,
              title: 'Follow the 50/30/20 Rule',
              content: 'Try to allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.'
            },
            {
              id: 2,
              title: 'Track Every Expense',
              content: 'Record all transactions to understand your spending patterns and identify areas for improvement.'
            },
            {
              id: 3,
              title: 'Use Cash for Discretionary Spending',
              content: 'Using cash instead of cards for non-essential purchases can help you be more mindful of your spending.'
            },
            {
              id: 4,
              title: 'Review Your Budget Regularly',
              content: 'Check your budget at least once a week to stay on track and make adjustments as needed.'
            }
          ]
        }
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
