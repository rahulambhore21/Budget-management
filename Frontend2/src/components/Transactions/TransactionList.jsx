import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { deleteTransaction, getTransactions } from '../../services/transaction';
import AuthContext from '../../context/AuthContext';

const TransactionList = ({ transactions, loading, setTransactions }) => {
  const [deletingId, setDeletingId] = useState(null);
  const { handleLogout } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading transactions</div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div className="no-transactions">No transactions found. Add your first expense!</div>;
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise return formatted date
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle transaction deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      
      // Refresh transaction list
      const response = await getTransactions();
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        window.dispatchEvent(new CustomEvent('app-event', { 
          detail: { type: 'auth-error' } 
        }));
        return;
      }
      
      toast.error('Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  // Group transactions by date
  const groupedByDate = transactions.reduce((groups, transaction) => {
    const date = formatDate(transaction.date);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  // Sort dates (with Today and Yesterday at the top)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    
    // For other dates, sort in descending order
    const dateA = new Date(groupedByDate[a][0].date);
    const dateB = new Date(groupedByDate[b][0].date);
    return dateB - dateA;
  });

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#4CAF50',
      'Transport': '#2196F3',
      'Shopping': '#FF9800',
      'Bills': '#E91E63',
      'Investment': '#9C27B0',
      'Other': '#607D8B'
    };
    return colors[category] || '#607D8B';
  };

  return (
    <div className="transaction-list">
      <h3>Recent Transactions</h3>
      {sortedDates.map(date => (
        <div key={date} className="transaction-date-group">
          <div className="date-header">{date}</div>
          {groupedByDate[date].map((transaction) => (
            <div 
              key={transaction._id} 
              className="transaction-item"
              style={{ borderLeftColor: getCategoryColor(transaction.category) }}
            >
              <div className="transaction-details">
                <div className="transaction-amount">{formatCurrency(transaction.amount)}</div>
                <div className="transaction-category">{transaction.category}</div>
              </div>
              <div className="transaction-description">
                {transaction.description || 'No description'}
              </div>
              <div className="transaction-payment">
                <span>{transaction.paymentMode} {transaction.upiId ? `- ${transaction.upiId}` : ''}</span>
                <span className="transaction-time">
                  {new Date(transaction.date).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
              <button 
                className="delete-btn" 
                onClick={() => handleDelete(transaction._id)}
                disabled={deletingId === transaction._id}
                aria-label="Delete transaction"
              >
                {deletingId === transaction._id ? '...' : '×'}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
