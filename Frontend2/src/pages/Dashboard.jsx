import { useState, useEffect, useContext } from 'react';
import { getTransactions } from '../services/transaction';
import { toast } from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import PieChart from '../components/Charts/PieChart';
import BarChart from '../components/Charts/BarChart';
import AddTransaction from '../components/Transactions/AddTransaction';
import TransactionList from '../components/Transactions/TransactionList';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('pie');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [summary, setSummary] = useState({
    total: 0,
    countToday: 0,
    totalToday: 0,
    averageDaily: 0,
    topCategory: '',
    topCategoryAmount: 0
  });
  const { handleLogout } = useContext(AuthContext);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      filterTransactionsByDate();
    }
  }, [transactions, dateFilter, customDateRange]);

  useEffect(() => {
    calculateSummary();
  }, [filteredTransactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await getTransactions();
      
      if (response && response.data && Array.isArray(response.data.transactions)) {
        setTransactions(response.data.transactions);
      } else {
        console.error('Invalid transaction data format:', response);
        toast.error('Received invalid transaction data format');
        setTransactions([]);
      }
    } catch (error) {
      console.error('Transaction fetch error:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to load transactions';
      toast.error(errorMessage);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filtered = [...transactions];
    
    switch (dateFilter) {
      case 'today':
        filtered = transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate.getDate() === today.getDate() && 
                 txDate.getMonth() === today.getMonth() && 
                 txDate.getFullYear() === today.getFullYear();
        });
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = transactions.filter(t => new Date(t.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = transactions.filter(t => new Date(t.date) >= monthAgo);
        break;
      case 'custom':
        const fromDate = new Date(customDateRange.from);
        const toDate = new Date(customDateRange.to);
        toDate.setHours(23, 59, 59, 999); // End of the day
        
        filtered = transactions.filter(t => {
          const txDate = new Date(t.date);
          return txDate >= fromDate && txDate <= toDate;
        });
        break;
      default:
        // 'all' - no filtering needed
        break;
    }
    
    setFilteredTransactions(filtered);
  };

  const calculateSummary = () => {
    if (!filteredTransactions.length) {
      setSummary({ 
        total: 0, 
        countToday: 0, 
        totalToday: 0,
        averageDaily: 0,
        topCategory: '',
        topCategoryAmount: 0
      });
      return;
    }

    const today = new Date().setHours(0, 0, 0, 0);
    
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const todayTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date).setHours(0, 0, 0, 0);
      return transactionDate === today;
    });
    
    // Calculate daily average
    const uniqueDates = new Set();
    filteredTransactions.forEach(t => {
      const dateStr = new Date(t.date).toDateString();
      uniqueDates.add(dateStr);
    });
    const daysWithTransactions = uniqueDates.size;
    const averageDaily = daysWithTransactions ? totalAmount / daysWithTransactions : 0;
    
    // Calculate top category
    const categoryTotals = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    
    let topCategory = '';
    let topCategoryAmount = 0;
    
    Object.entries(categoryTotals).forEach(([category, amount]) => {
      if (amount > topCategoryAmount) {
        topCategory = category;
        topCategoryAmount = amount;
      }
    });
    
    setSummary({
      total: totalAmount,
      countToday: todayTransactions.length,
      totalToday: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
      averageDaily,
      topCategory,
      topCategoryAmount
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your Expense Dashboard</h1>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label>Date Filter:</label>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {dateFilter === 'custom' && (
          <div className="date-range-picker">
            <div className="date-input">
              <label>From:</label>
              <input 
                type="date" 
                value={customDateRange.from}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange,
                  from: e.target.value
                })}
                max={customDateRange.to}
              />
            </div>
            <div className="date-input">
              <label>To:</label>
              <input 
                type="date" 
                value={customDateRange.to}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange,
                  to: e.target.value
                })}
                min={customDateRange.from}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </div>
      
      {!loading && filteredTransactions.length > 0 && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Expenses</h3>
            <div className="summary-amount">{formatCurrency(summary.total)}</div>
            <div className="summary-subtitle">
              {filteredTransactions.length} transactions
            </div>
          </div>
          <div className="summary-card">
            <h3>Today's Expenses</h3>
            <div className="summary-amount">{formatCurrency(summary.totalToday)}</div>
            <div className="summary-subtitle">{summary.countToday} transactions today</div>
          </div>
          <div className="summary-card">
            <h3>Daily Average</h3>
            <div className="summary-amount">{formatCurrency(summary.averageDaily)}</div>
          </div>
          {summary.topCategory && (
            <div className="summary-card">
              <h3>Top Category</h3>
              <div className="top-category">{summary.topCategory}</div>
              <div className="summary-amount">{formatCurrency(summary.topCategoryAmount)}</div>
            </div>
          )}
        </div>
      )}
      
      <div className="dashboard-grid">
        <div className="chart-section">
          <div className="chart-controls">
            <button 
              onClick={() => setChartType('pie')}
              className={chartType === 'pie' ? 'active' : ''}
            >
              Pie Chart
            </button>
            <button 
              onClick={() => setChartType('bar')}
              className={chartType === 'bar' ? 'active' : ''}
            >
              Bar Chart
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Loading chart data</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="no-data">No transaction data to display</div>
          ) : (
            <>
              {chartType === 'pie' ? (
                <PieChart transactions={filteredTransactions} />
              ) : (
                <BarChart transactions={filteredTransactions} />
              )}
            </>
          )}
        </div>
        
        <div className="transaction-section">
          <AddTransaction setTransactions={setTransactions} />
          <TransactionList 
            transactions={filteredTransactions} 
            loading={loading} 
            setTransactions={setTransactions} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;