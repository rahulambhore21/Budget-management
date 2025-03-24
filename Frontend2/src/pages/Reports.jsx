import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { getTransactions } from '../services/transaction';
import { getIncomeStats } from '../services/income';
import BarChart from '../components/Charts/BarChart';
import PieChart from '../components/Charts/PieChart';
import AnnualReportPDF from '../components/Reports/AnnualReportPDF';
import AuthContext from '../context/AuthContext';
import '../styles/Dashboard.css';

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incomeStats, setIncomeStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const { handleLogout } = useContext(AuthContext);
  
  // Available years for filtering (current year and 2 previous years)
  const years = [
    selectedYear,
    selectedYear - 1,
    selectedYear - 2
  ];
  
  // Month names for dropdown
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    filterTransactionsByDate();
  }, [transactions, selectedYear, selectedMonth]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch transactions
      const transactionsResponse = await getTransactions();
      if (transactionsResponse && transactionsResponse.data && Array.isArray(transactionsResponse.data.transactions)) {
        setTransactions(transactionsResponse.data.transactions);
      }
      
      // Fetch income stats
      try {
        const incomeResponse = await getIncomeStats();
        if (incomeResponse && incomeResponse.data) {
          setIncomeStats(incomeResponse.data);
        }
      } catch (incomeError) {
        console.error('Error fetching income stats:', incomeError);
      }
      
    } catch (error) {
      console.error('Error fetching data for reports:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };
  
  const filterTransactionsByDate = () => {
    if (!transactions || transactions.length === 0) {
      setFilteredTransactions([]);
      return;
    }
    
    // If viewing yearly data, filter by year only
    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === selectedYear && 
             (selectedMonth === null || txDate.getMonth() === selectedMonth);
    });
    
    setFilteredTransactions(filtered);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate total expense
  const calculateTotal = (transactions) => {
    return transactions.reduce((total, tx) => total + tx.amount, 0);
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Financial Reports</h1>
      </div>
      
      <div className="filter-controls">
        <div className="filter-group">
          <label>Year:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            disabled={loading || generatingReport}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Month:</label>
          <select 
            value={selectedMonth === null ? 'all' : selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? null : parseInt(e.target.value))}
            disabled={loading || generatingReport}
          >
            <option value="all">All Months</option>
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">Loading report data...</div>
      ) : (
        <>
          <div className="summary-section">
            <div className="summary-card">
              <h3>
                {selectedMonth !== null 
                  ? `${monthNames[selectedMonth]} ${selectedYear}`
                  : `Year ${selectedYear}`} Summary
              </h3>
              <div className="summary-details">
                <div className="summary-item">
                  <div className="summary-label">Total Expenses</div>
                  <div className="summary-value">{formatCurrency(calculateTotal(filteredTransactions))}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Transactions</div>
                  <div className="summary-value">{filteredTransactions.length}</div>
                </div>
                {incomeStats && selectedMonth === null && (
                  <div className="summary-item">
                    <div className="summary-label">Total Income (Year)</div>
                    <div className="summary-value">{formatCurrency(incomeStats.currentYear?.total || 0)}</div>
                  </div>
                )}
                {incomeStats && selectedMonth !== null && (
                  <div className="summary-item">
                    <div className="summary-label">Monthly Income</div>
                    <div className="summary-value">{formatCurrency(incomeStats.currentMonth?.total || 0)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Expenses by Category</h3>
              <div className="chart-container">
                {filteredTransactions.length > 0 ? (
                  <PieChart transactions={filteredTransactions} />
                ) : (
                  <div className="no-data">No data available for the selected period</div>
                )}
              </div>
            </div>
            
            <div className="dashboard-card">
              <h3>Expense Distribution</h3>
              <div className="chart-container">
                {filteredTransactions.length > 0 ? (
                  <BarChart transactions={filteredTransactions} />
                ) : (
                  <div className="no-data">No data available for the selected period</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <h3>Generate PDF Reports</h3>
            <div className="reports-container">
              {selectedMonth === null ? (
                <AnnualReportPDF 
                  transactions={filteredTransactions}
                  year={selectedYear}
                  onGenerateStart={() => setGeneratingReport(true)}
                  onGenerateComplete={() => setGeneratingReport(false)}
                />
              ) : (
                <div className="report-message">
                  <p>Please select "All Months" to generate an annual report, or use the individual month view for monthly details.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
