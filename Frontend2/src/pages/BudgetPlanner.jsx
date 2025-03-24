import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { getBudgetLimits, setBudgetLimit, updateBudgetLimit, deleteBudgetLimit, getBudgetTips } from '../services/budget';
import { getTransactions } from '../services/transaction';
import AuthContext from '../context/AuthContext';

const BudgetPlanner = () => {
  const [budgetLimits, setBudgetLimits] = useState([]);
  const [spendingByCategory, setSpendingByCategory] = useState({});
  const [newBudget, setNewBudget] = useState({ category: 'Food', amount: '' });
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const { handleLogout } = useContext(AuthContext);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  // Available categories
  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Investment', 'Other'];

  useEffect(() => {
    fetchBudgetData();
    fetchTips();
  }, []);

  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      // Fetch budget limits from the backend
      const limitsResponse = await getBudgetLimits();
      if (limitsResponse?.status === 'success') {
        setBudgetLimits(limitsResponse.data.limits || []);
      }

      // Fetch transactions to calculate current spending
      const transactionsResponse = await getTransactions();
      if (transactionsResponse?.data?.transactions) {
        calculateSpendingByCategory(transactionsResponse.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error('Failed to load budget data');
      
      // Set mock data for demo purposes
      setBudgetLimits([
        { _id: '1', category: 'Food', amount: 5000 },
        { _id: '2', category: 'Transport', amount: 3000 },
        { _id: '3', category: 'Shopping', amount: 2000 }
      ]);
      
      setSpendingByCategory({
        'Food': 3200,
        'Transport': 2800,
        'Shopping': 1500,
        'Bills': 4300,
        'Investment': 1000,
        'Other': 1800
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTips = async () => {
    try {
      const response = await getBudgetTips();
      if (response?.status === 'success') {
        setTips(response.data.tips || []);
      }
    } catch (error) {
      console.error('Error fetching budget tips:', error);
      // Fallback to default tips
      setTips([
        {
          id: 1,
          title: 'Follow the 50/30/20 Rule',
          content: 'Try to allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.'
        },
        {
          id: 2,
          title: 'Track Every Expense',
          content: 'Record all transactions to understand your spending patterns and identify areas for improvement.'
        }
      ]);
    }
  };

  const calculateSpendingByCategory = (transactions) => {
    // Calculate current month spending
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    // Group by category
    const spending = {};
    categories.forEach(category => {
      spending[category] = 0;
    });

    monthlyTransactions.forEach(tx => {
      if (spending[tx.category] !== undefined) {
        spending[tx.category] += tx.amount;
      } else {
        spending[tx.category] = tx.amount;
      }
    });

    setSpendingByCategory(spending);
  };

  const handleNewBudgetChange = (e) => {
    const { name, value } = e.target;
    setNewBudget(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : value
    }));
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    
    if (!newBudget.amount || isNaN(parseFloat(newBudget.amount)) || parseFloat(newBudget.amount) <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    // Check if category already has a budget
    const existingBudget = budgetLimits.find(b => b.category === newBudget.category);
    if (existingBudget) {
      toast.error(`A budget for ${newBudget.category} already exists. Please edit the existing budget instead.`);
      return;
    }

    try {
      const response = await setBudgetLimit(newBudget.category, parseFloat(newBudget.amount));
      
      if (response?.status === 'success') {
        toast.success(`Budget limit for ${newBudget.category} set successfully`);
        
        // Update local state
        setBudgetLimits(prev => [...prev, response.data.limit]);
        setNewBudget({ category: 'Food', amount: '' });
      } else {
        throw new Error(response?.message || 'Failed to set budget limit');
      }
    } catch (error) {
      console.error('Error setting budget limit:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error(error.message || 'Failed to set budget limit');
      
      // For demo purposes, add to local state anyway
      const mockLimit = {
        _id: Date.now().toString(),
        category: newBudget.category,
        amount: parseFloat(newBudget.amount)
      };
      
      setBudgetLimits(prev => [...prev, mockLimit]);
      setNewBudget({ category: 'Food', amount: '' });
    }
  };

  const handleEditClick = (limit) => {
    setEditingId(limit._id);
    setEditAmount(limit.amount.toString());
  };

  const handleEditSave = async (id) => {
    if (!editAmount || isNaN(parseFloat(editAmount)) || parseFloat(editAmount) <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      const response = await updateBudgetLimit(id, parseFloat(editAmount));
      
      if (response?.status === 'success') {
        toast.success('Budget limit updated successfully');
        
        // Update local state
        setBudgetLimits(prev => 
          prev.map(limit => 
            limit._id === id ? { ...limit, amount: parseFloat(editAmount) } : limit
          )
        );
      } else {
        throw new Error(response?.message || 'Failed to update budget limit');
      }
    } catch (error) {
      console.error('Error updating budget limit:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error(error.message || 'Failed to update budget limit');
      
      // For demo purposes, update the local state anyway
      setBudgetLimits(prev => 
        prev.map(limit => 
          limit._id === id ? { ...limit, amount: parseFloat(editAmount) } : limit
        )
      );
    } finally {
      setEditingId(null);
      setEditAmount('');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget limit?')) {
      return;
    }

    try {
      const response = await deleteBudgetLimit(id);
      
      if (response?.status === 'success') {
        toast.success('Budget limit deleted successfully');
        
        // Update local state
        setBudgetLimits(prev => prev.filter(limit => limit._id !== id));
      } else {
        throw new Error(response?.message || 'Failed to delete budget limit');
      }
    } catch (error) {
      console.error('Error deleting budget limit:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error(error.message || 'Failed to delete budget limit');
      
      // For demo purposes, update the local state anyway
      setBudgetLimits(prev => prev.filter(limit => limit._id !== id));
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate budget progress
  const getBudgetProgress = (category) => {
    const limit = budgetLimits.find(b => b.category === category);
    if (!limit) return { percent: 0, status: 'normal' };

    const spent = spendingByCategory[category] || 0;
    const percent = (spent / limit.amount) * 100;
    
    let status = 'normal';
    if (percent >= 90) status = 'danger';
    else if (percent >= 75) status = 'warning';
    
    return { percent, status };
  };

  return (
    <div className="budget-container">
      <div className="budget-header">
        <h1>Budget Planner</h1>
      </div>

      <div className="budget-grid">
        <div className="budget-section">
          <h2 className="budget-title">Monthly Budget Limits</h2>
          
          {loading ? (
            <div className="loading">Loading budget data</div>
          ) : budgetLimits.length > 0 ? (
            <div className="budget-limits">
              {budgetLimits.map(limit => {
                const progress = getBudgetProgress(limit.category);
                const spent = spendingByCategory[limit.category] || 0;
                
                return (
                  <div key={limit._id} className="budget-limit">
                    <div className="budget-limit-icon">
                      {limit.category.charAt(0)}
                    </div>
                    <div className="budget-limit-details">
                      <div className="budget-limit-category">{limit.category}</div>
                      {editingId === limit._id ? (
                        <div className="budget-limit-edit-form">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="edit-amount-input"
                          />
                          <div className="edit-actions">
                            <button 
                              onClick={() => handleEditSave(limit._id)}
                              className="save-btn"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="budget-limit-amount">
                            {formatCurrency(spent)} of {formatCurrency(limit.amount)}
                          </div>
                          <div className="budget-progress">
                            <div 
                              className={`budget-progress-bar ${progress.status}`}
                              style={{ width: `${Math.min(100, progress.percent)}%` }}
                            ></div>
                          </div>
                          <div className="budget-limit-status">
                            {progress.percent > 100 
                              ? `Over budget by ${formatCurrency(spent - limit.amount)}` 
                              : `${formatCurrency(limit.amount - spent)} remaining`}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="budget-limit-actions">
                      {editingId !== limit._id && (
                        <>
                          <button 
                            className="budget-limit-edit"
                            onClick={() => handleEditClick(limit)}
                            aria-label="Edit budget"
                          >
                            ✏️
                          </button>
                          <button 
                            className="budget-limit-edit"
                            onClick={() => handleDelete(limit._id)}
                            aria-label="Delete budget"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data">
              No budget limits set. Create your first budget limit below.
            </div>
          )}

          <div className="budget-form">
            <h3>Add New Budget Limit</h3>
            <form onSubmit={handleAddBudget}>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={newBudget.category}
                  onChange={handleNewBudgetChange}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Monthly Budget (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={newBudget.amount}
                  onChange={handleNewBudgetChange}
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>
              
              <button type="submit" className="submit-btn">
                Set Budget Limit
              </button>
            </form>
          </div>
        </div>

        <div className="budget-section">
          <h2 className="budget-title">Smart Budgeting Tips</h2>
          
          {tips.length > 0 ? (
            <div className="budget-tips">
              {tips.map(tip => (
                <div key={tip.id} className="tip-card">
                  <div className="tip-title">{tip.title}</div>
                  <div className="tip-content">{tip.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">Loading budgeting tips</div>
          )}
          
          <div className="budget-summary">
            <h3>Monthly Spending Summary</h3>
            {Object.entries(spendingByCategory).length > 0 ? (
              <div className="spending-by-category">
                {Object.entries(spendingByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div key={category} className="category-spending">
                      <div className="category-name">{category}</div>
                      <div className="category-amount">{formatCurrency(amount)}</div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="no-data">No spending data available for this month</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;
