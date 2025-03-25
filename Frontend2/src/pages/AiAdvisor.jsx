import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { generateFinancialAdvice, askFinancialQuestion } from '../services/geminiAi';
import { getTransactions } from '../services/transaction';
import { getBudgetLimits } from '../services/budget';
import { getIncomeStats } from '../services/income';
import { getSavingsGoals } from '../services/savings';
import AuthContext from '../context/AuthContext';
import '../styles/AiAdvisor.css';

const AiAdvisor = () => {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [financialData, setFinancialData] = useState({
    transactions: [],
    budget: [],
    income: 0,
    savingsGoals: []
  });
  const [dataLoading, setDataLoading] = useState(true);
  const { handleLogout } = useContext(AuthContext);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setDataLoading(true);
    try {
      // Fetch transactions
      const transactionsResponse = await getTransactions();
      let transactions = [];
      if (transactionsResponse?.data?.transactions) {
        transactions = transactionsResponse.data.transactions;
      }

      // Fetch budget limits
      const budgetResponse = await getBudgetLimits();
      let budget = [];
      if (budgetResponse?.data?.limits) {
        budget = budgetResponse.data.limits;
      }

      // Fetch income stats
      const incomeResponse = await getIncomeStats();
      let monthlyIncome = 0;
      if (incomeResponse?.data?.currentMonth?.total) {
        monthlyIncome = incomeResponse.data.currentMonth.total;
      }

      // Fetch savings goals
      const savingsResponse = await getSavingsGoals();
      let savingsGoals = [];
      if (savingsResponse?.data?.savingsGoals) {
        savingsGoals = savingsResponse.data.savingsGoals;
      }

      setFinancialData({
        transactions,
        budget,
        income: monthlyIncome,
        savingsGoals
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      
      // Check for authentication errors
      if (error.message && error.message.includes('session has expired')) {
        toast.error('Your session has expired. Please login again.');
        handleLogout();
        return;
      }
      
      toast.error('Failed to load your financial data');
      
      // Set some mock data to allow the page to function
      setFinancialData({
        transactions: [],
        budget: [],
        income: 0,
        savingsGoals: []
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    setLoading(true);
    setAdvice('');
    
    try {
      if (financialData.transactions.length === 0) {
        toast.error('You need to add some transactions before getting personalized advice');
        setAdvice('Please add some transactions to receive personalized financial advice.');
        return;
      }
      
      const result = await generateFinancialAdvice(financialData);
      
      if (result.success) {
        setAdvice(result.advice);
      } else {
        toast.error('Failed to generate financial advice');
        setAdvice(result.advice || 'Failed to generate advice. Please try again later.');
      }
    } catch (error) {
      console.error('Error in AI advice generation:', error);
      toast.error('An error occurred while generating advice');
      setAdvice('I encountered an error while analyzing your financial data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    setAnswerLoading(true);
    setAnswer('');
    
    try {
      const result = await askFinancialQuestion(question);
      
      if (result.success) {
        setAnswer(result.answer);
      } else {
        toast.error('Failed to get an answer');
        setAnswer(result.answer || 'Failed to answer your question. Please try again later.');
      }
    } catch (error) {
      console.error('Error in AI question answering:', error);
      toast.error('An error occurred while answering your question');
      setAnswer('I encountered an error while processing your question. Please try again later.');
    } finally {
      setAnswerLoading(false);
    }
  };

  // Format advice text with markdown-like syntax
  const formatAdvice = (text) => {
    if (!text) return '';
    
    // Replace headings
    let formattedText = text.replace(/^# (.*$)/gm, '<h2>$1</h2>');
    formattedText = formattedText.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    
    // Replace bullet points
    formattedText = formattedText.replace(/^\* (.*$)/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/^- (.*$)/gm, '<li>$1</li>');
    
    // Replace numbered lists
    formattedText = formattedText.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    
    // Wrap lists
    formattedText = formattedText.replace(/<li>.*<\/li>\n<li>/g, (match) => {
      return '<ul>' + match;
    });
    formattedText = formattedText.replace(/<\/li>\n(?!<li>)/g, '</li></ul>\n');
    
    // Add paragraphs
    formattedText = formattedText.replace(/^(?!<[uh]|<li|<\/ul)(.+$)/gm, '<p>$1</p>');
    
    // Handle line breaks
    formattedText = formattedText.replace(/\n\n/g, '<br>');
    
    return formattedText;
  };

  return (
    <div className="ai-advisor-container">
      <div className="ai-advisor-header">
        <h1>AI Financial Advisor</h1>
        <p className="subheading">Get personalized financial advice based on your spending patterns and financial goals</p>
      </div>

      <div className="ai-advisor-content">
        <div className="advisor-section">
          <div className="section-header">
            <h2>Personalized Financial Analysis</h2>
            <button 
              className="get-advice-btn"
              onClick={handleGetAdvice}
              disabled={loading || dataLoading}
            >
              {loading ? 'Analyzing your data...' : 'Get Personalized Advice'}
            </button>
          </div>
          
          <div className="data-status">
            {dataLoading ? (
              <div className="loading-status">Loading your financial data...</div>
            ) : (
              <div className="data-summary">
                <div className="data-item">
                  <span className="data-label">Transactions:</span>
                  <span className="data-value">{financialData.transactions.length}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Budget Categories:</span>
                  <span className="data-value">{financialData.budget.length}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Monthly Income:</span>
                  <span className="data-value">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(financialData.income)}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Savings Goals:</span>
                  <span className="data-value">{financialData.savingsGoals.length}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="advice-container">
            {loading ? (
              <div className="advice-loading">
                <div className="advice-loading-animation">
                  <div className="spinner"></div>
                </div>
                <p>Analyzing your financial data and generating personalized advice...</p>
                <p className="loading-subtext">This may take a few moments as the AI reviews your transactions and patterns</p>
              </div>
            ) : advice ? (
              <div 
                className="advice-content"
                dangerouslySetInnerHTML={{ __html: formatAdvice(advice) }}
              />
            ) : (
              <div className="no-advice">
                <p>Click "Get Personalized Advice" to receive AI-generated financial guidance based on your transaction history, budget, and savings goals.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="advisor-section">
          <div className="section-header">
            <h2>Ask a Financial Question</h2>
          </div>
          
          <form onSubmit={handleAskQuestion} className="question-form">
            <div className="form-group">
              <label htmlFor="question">What would you like to know about your finances?</label>
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., How much should I save for retirement?"
                disabled={answerLoading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="ask-btn"
              disabled={answerLoading || !question.trim()}
            >
              {answerLoading ? 'Getting Answer...' : 'Ask Question'}
            </button>
          </form>
          
          <div className="answer-container">
            {answerLoading ? (
              <div className="answer-loading">
                <div className="spinner"></div>
                <p>Finding the best answer to your question...</p>
              </div>
            ) : answer ? (
              <div 
                className="answer-content"
                dangerouslySetInnerHTML={{ __html: formatAdvice(answer) }}
              />
            ) : (
              <div className="no-answer">
                <p>Your answer will appear here after you ask a question.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="ai-advisor-footer">
        <p className="disclaimer">
          The financial advice provided is generated by an AI model and should be used for informational purposes only. 
          Please consult with a qualified financial advisor for professional advice tailored to your specific situation.
        </p>
      </div>
    </div>
  );
};

export default AiAdvisor;
