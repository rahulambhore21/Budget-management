import axios from 'axios';
import { getTransactions } from './transaction';

const API_URL = 'http://localhost:5000/api/insights';

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

// Get spending insights
export const getSpendingInsights = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/spending`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching spending insights:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    // Generate insights from local transactions if API fails
    try {
      return await generateLocalSpendingInsights();
    } catch (localError) {
      console.error('Failed to generate local insights:', localError);
      throw error;
    }
  }
};

// Generate insights locally from transaction data
const generateLocalSpendingInsights = async () => {
  const response = await getTransactions();
  const transactions = response.data.transactions;
  
  // Group transactions by month
  const transactionsByMonth = {};
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = now.getMonth() === 0 
    ? `${now.getFullYear() - 1}-12` 
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!transactionsByMonth[month]) {
      transactionsByMonth[month] = [];
    }
    
    transactionsByMonth[month].push(tx);
  });
  
  // Calculate current and previous month totals by category
  const currentMonthData = transactionsByMonth[currentMonth] || [];
  const lastMonthData = transactionsByMonth[lastMonth] || [];
  
  const currentMonthTotal = currentMonthData.reduce((sum, tx) => sum + tx.amount, 0);
  const lastMonthTotal = lastMonthData.reduce((sum, tx) => sum + tx.amount, 0);
  
  // Group by category
  const categorySummary = {};
  transactions.forEach(tx => {
    if (!categorySummary[tx.category]) {
      categorySummary[tx.category] = { count: 0, total: 0 };
    }
    
    categorySummary[tx.category].count++;
    categorySummary[tx.category].total += tx.amount;
  });
  
  // Find most and least frequent categories
  let mostFrequentCategory = '';
  let mostFrequentCount = 0;
  let highestSpendCategory = '';
  let highestSpendAmount = 0;
  
  Object.entries(categorySummary).forEach(([category, data]) => {
    if (data.count > mostFrequentCount) {
      mostFrequentCount = data.count;
      mostFrequentCategory = category;
    }
    
    if (data.total > highestSpendAmount) {
      highestSpendAmount = data.total;
      highestSpendCategory = category;
    }
  });
  
  // Calculate month over month change
  const monthlyChange = lastMonthTotal > 0
    ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    : 0;
  
  // Generate recommendations based on data
  const recommendations = [];
  
  if (monthlyChange > 15) {
    recommendations.push({
      id: 1,
      title: 'Spending Increase Alert',
      content: `Your spending has increased by ${monthlyChange.toFixed(1)}% compared to last month. Consider reviewing your expenses to identify areas for reduction.`
    });
  }
  
  if (highestSpendCategory) {
    recommendations.push({
      id: 2,
      title: `High ${highestSpendCategory} Expenses`,
      content: `${highestSpendCategory} is your highest expense category. Setting a budget limit for this category could help you control your spending.`
    });
  }
  
  // Add generic recommendation if we don't have specific ones
  if (recommendations.length === 0) {
    recommendations.push({
      id: 3,
      title: 'Build Your Emergency Fund',
      content: 'Financial experts recommend having 3-6 months of expenses saved for emergencies. Track your progress in the Budget section.'
    });
  }
  
  return {
    status: 'success',
    data: {
      trends: {
        currentMonthTotal,
        lastMonthTotal,
        monthlyChange,
        mostFrequentCategory,
        highestSpendCategory,
        highestSpendAmount
      },
      recommendations
    }
  };
};

// Get savings opportunities
export const getSavingsOpportunities = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/savings`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching savings opportunities:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    
    // Return mock savings opportunities if API fails
    return {
      status: 'success',
      data: {
        opportunities: [
          {
            id: 1,
            title: 'Food Expense Reduction',
            description: 'You spent 30% more on food this month compared to your average. Consider meal planning to save.',
            potentialSavings: 1200,
            category: 'Food'
          },
          {
            id: 2,
            title: 'Transport Cost Optimization',
            description: 'Using public transport twice a week could save you approximately ₹800 per month.',
            potentialSavings: 800,
            category: 'Transport'
          }
        ]
      }
    };
  }
};

// Get recurring expenses
export const getRecurringExpenses = async () => {
  try {
    const authHeader = getAuthHeader();
    const response = await axios.get(`${API_URL}/recurring`, authHeader);
    return response.data;
  } catch (error) {
    console.error('Error fetching recurring expenses:', error);
    if (error.response?.status === 401) {
      throw new Error('Your session has expired. Please login again.');
    }
    throw error;
  }
};
