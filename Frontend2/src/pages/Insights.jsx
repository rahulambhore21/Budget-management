import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { getSpendingInsights, getSavingsOpportunities } from '../services/insights';
import AuthContext from '../context/AuthContext';

const Insights = () => {
  const [trends, setTrends] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleLogout } = useContext(AuthContext);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Fetch spending insights
      const insightsResponse = await getSpendingInsights();
      if (insightsResponse?.status === 'success') {
        setTrends(insightsResponse.data.trends);
        setRecommendations(insightsResponse.data.recommendations || []);
      }

      // Fetch savings opportunities
      const savingsResponse = await getSavingsOpportunities();
      if (savingsResponse?.status === 'success') {
        setSavings(savingsResponse.data.opportunities || []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error('Failed to load financial insights');
    } finally {
      setLoading(false);
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

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h1>Financial Insights</h1>
      </div>

      {loading ? (
        <div className="loading">Analyzing your financial data</div>
      ) : (
        <>
          <div className="insights-section">
            <h2>Spending Trends</h2>
            
            {trends ? (
              <div className="insights-grid">
                <div className="trend-card">
                  <div className="trend-title">This Month's Spending</div>
                  <div className="trend-value">{formatCurrency(trends.currentMonthTotal || 0)}</div>
                  {trends.lastMonthTotal > 0 && (
                    <div className={`trend-change ${trends.monthlyChange > 0 ? 'trend-up' : 'trend-down'}`}>
                      {trends.monthlyChange > 0 ? '↑' : '↓'} {Math.abs(trends.monthlyChange).toFixed(1)}% from last month
                    </div>
                  )}
                </div>
                
                <div className="trend-card">
                  <div className="trend-title">Highest Expense Category</div>
                  <div className="trend-value">{trends.highestSpendCategory || 'N/A'}</div>
                  {trends.highestSpendAmount > 0 && (
                    <div className="trend-subtitle">
                      {formatCurrency(trends.highestSpendAmount)}
                    </div>
                  )}
                </div>
                
                <div className="trend-card">
                  <div className="trend-title">Most Frequent Expenses</div>
                  <div className="trend-value">{trends.mostFrequentCategory || 'N/A'}</div>
                </div>
                
                <div className="trend-card">
                  <div className="trend-title">Last Month's Spending</div>
                  <div className="trend-value">{formatCurrency(trends.lastMonthTotal || 0)}</div>
                </div>
              </div>
            ) : (
              <div className="no-data">
                Not enough data to generate spending trends. Add more transactions to see insights.
              </div>
            )}
          </div>

          <div className="insights-section">
            <h2>Smart Recommendations</h2>
            
            {recommendations.length > 0 ? (
              <div className="recommendations">
                {recommendations.map(rec => (
                  <div key={rec.id} className="recommendation-card">
                    <div className="recommendation-title">{rec.title}</div>
                    <div className="recommendation-content">{rec.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                Continue using the app to receive personalized financial recommendations.
              </div>
            )}
          </div>

          <div className="insights-section">
            <h2>Savings Opportunities</h2>
            
            {savings.length > 0 ? (
              <div className="savings-opportunities">
                {savings.map(opportunity => (
                  <div key={opportunity.id} className="recommendation-card">
                    <div className="recommendation-title">
                      {opportunity.title} - Save {formatCurrency(opportunity.potentialSavings)}
                    </div>
                    <div className="recommendation-content">{opportunity.description}</div>
                    <button className="action-button">Implement This Tip</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                No savings opportunities identified yet. Check back after adding more transactions.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Insights;
