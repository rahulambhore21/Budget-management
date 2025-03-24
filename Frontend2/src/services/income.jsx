import axios from 'axios';

const API_URL = 'http://localhost:5000/api/income';

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

// Add new income entry
export const addIncome = async (incomeData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.post(API_URL, incomeData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error adding income:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Get all income entries
export const getIncomes = async (filters = {}) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(API_URL, {
      ...authHeader,
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching incomes:', error);
    
    // If API is not available, return mock data
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        results: 2,
        data: {
          incomes: [
            {
              _id: '1',
              amount: 50000,
              source: 'Salary',
              description: 'Monthly salary',
              date: new Date().toISOString(),
              isRecurring: true,
              recurringFrequency: 'monthly'
            },
            {
              _id: '2',
              amount: 5000,
              source: 'Freelance',
              description: 'Website project',
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              isRecurring: false
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

// Get income statistics
export const getIncomeStats = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/stats`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching income stats:', error);
    
    // If API is not available, return mock data
    if (error.message.includes('Network Error') || error.response?.status === 404) {
      return {
        status: 'success',
        data: {
          monthlyIncome: [
            { _id: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, total: 55000 },
            { _id: { year: new Date().getFullYear(), month: new Date().getMonth() }, total: 50000 }
          ],
          incomeBySource: [
            { _id: 'Salary', total: 100000, count: 2 },
            { _id: 'Freelance', total: 5000, count: 1 }
          ],
          currentMonth: {
            total: 55000,
            count: 2
          },
          currentYear: {
            total: 105000,
            count: 3
          }
        }
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Update income entry
export const updateIncome = async (id, incomeData) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.put(`${API_URL}/${id}`, incomeData, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error updating income:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};

// Delete income entry
export const deleteIncome = async (id) => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.delete(`${API_URL}/${id}`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error deleting income:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
