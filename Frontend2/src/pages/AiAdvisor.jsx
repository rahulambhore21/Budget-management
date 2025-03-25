import { useState, useEffect, useContext, useRef } from 'react';
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
  const adviceContentRef = useRef(null);
  const answerContentRef = useRef(null);
  const [adviceHasScroll, setAdviceHasScroll] = useState(false);
  const [answerHasScroll, setAnswerHasScroll] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState('');
  const [fullAnswer, setFullAnswer] = useState('');
  const [streamingComplete, setStreamingComplete] = useState(false);

  // Sample questions for users to choose from
  const sampleQuestions = [
    "How much should I save for retirement?",
    "What's the 50/30/20 budgeting rule?",
    "How can I reduce my monthly expenses?",
    "What's the difference between good debt and bad debt?",
    "How do I start investing with a small amount of money?",
    "What should I do with unexpected income?",
    "How can I improve my credit score?",
    "Should I pay off debt or invest first?"
  ];

  useEffect(() => {
    fetchFinancialData();
  }, []);

  useEffect(() => {
    // Check if content has scroll after content is updated
    if (adviceContentRef.current) {
      const hasScroll = adviceContentRef.current.scrollHeight > adviceContentRef.current.clientHeight;
      setAdviceHasScroll(hasScroll);
    }
  }, [advice]);

  useEffect(() => {
    // Check if answer content has scroll
    if (answerContentRef.current) {
      const hasScroll = answerContentRef.current.scrollHeight > answerContentRef.current.clientHeight;
      setAnswerHasScroll(hasScroll);
    }
  }, [streamedAnswer, streamingComplete]);

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
    setStreamedAnswer('');
    
    try {
      if (financialData.transactions.length === 0) {
        toast.error('You need to add some transactions before getting personalized advice');
        setAdvice('Please add some transactions to receive personalized financial advice.');
        return;
      }
      
      toast.success('Analyzing your financial data...', { duration: 2000 });
      const result = await generateFinancialAdvice(financialData);
      
      if (result.success) {
        toast.success('Analysis complete!', { icon: '✓' });
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
    setStreamedAnswer('');
    setFullAnswer('');
    setStreamingComplete(false);
    
    try {
      const result = await askFinancialQuestion(question);
      
      if (result.success) {
        setFullAnswer(result.answer);
        // Start streaming after getting the answer
        setAnswerLoading(false);
        streamAnswer(result.answer);
      } else {
        toast.error('Failed to get an answer');
        setFullAnswer(result.answer || 'Failed to answer your question. Please try again later.');
        setStreamedAnswer(result.answer || 'Failed to answer your question. Please try again later.');
        setAnswerLoading(false);
        setStreamingComplete(true);
      }
    } catch (error) {
      console.error('Error in AI question answering:', error);
      toast.error('An error occurred while answering your question');
      const errorMessage = 'I encountered an error while processing your question. Please try again later.';
      setFullAnswer(errorMessage);
      setStreamedAnswer(errorMessage);
      setAnswerLoading(false);
      setStreamingComplete(true);
    }
  };

  // Simulate streaming effect
  const streamAnswer = (fullText, speed = 30) => {
    setIsStreaming(true);
    setStreamingComplete(false);
    setStreamedAnswer('');
    
    const words = fullText.split(' ');
    let currentIndex = 0;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        // Add 1-3 words at a time to simulate natural typing
        const wordsToAdd = Math.floor(Math.random() * 3) + 1;
        const nextChunk = words.slice(currentIndex, currentIndex + wordsToAdd).join(' ') + ' ';
        setStreamedAnswer(prev => prev + nextChunk);
        currentIndex += wordsToAdd;
        
        // Auto-scroll to bottom as new content appears
        if (answerContentRef.current) {
          answerContentRef.current.scrollTop = answerContentRef.current.scrollHeight;
        }
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
        setStreamingComplete(true);
      }
    }, speed);
    
    return () => clearInterval(streamInterval);
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
    
    // Highlight important information
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return formattedText;
  };

  const handleCopyContent = (text, type) => {
    if (!text) return;
    
    // Get the complete answer if it's still streaming
    const textToCopy = type === 'Answer' ? fullAnswer : text;
    
    // Strip HTML tags to get plain text
    const plainText = textToCopy.replace(/<[^>]*>/g, '');
    
    navigator.clipboard.writeText(plainText).then(
      () => {
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
        toast.success(`${type} copied to clipboard!`);
      },
      () => {
        toast.error('Failed to copy text');
      }
    );
  };

  const handleSampleQuestionClick = (question) => {
    setQuestion(question);
    // Focus the input field after setting the question
    document.getElementById('question').focus();
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
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Analyzing...
                </>
              ) : 'Get Personalized Advice'}
            </button>
          </div>
          
          <div className="data-status">
            {dataLoading ? (
              <div className="loading-status">
                <div className="spinner"></div>
                <span>Loading your financial data...</span>
              </div>
            ) : (
              <div className="data-summary">
                <div className="data-item">
                  <span className="data-label">Transactions</span>
                  <span className="data-value">{financialData.transactions.length}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Budget Categories</span>
                  <span className="data-value">{financialData.budget.length}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Monthly Income</span>
                  <span className="data-value">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(financialData.income)}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Savings Goals</span>
                  <span className="data-value">{financialData.savingsGoals.length}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className={`advice-container ${adviceHasScroll ? 'has-scroll' : ''}`}>
            {loading ? (
              <div className="advice-loading">
                <div className="advice-loading-animation">
                  <div className="spinner"></div>
                </div>
                <p>Analyzing your financial data and generating personalized advice...</p>
                <p className="loading-subtext">This may take a few moments as the AI reviews your transactions and patterns</p>
              </div>
            ) : advice ? (
              <>
                <div 
                  className="advice-content"
                  ref={adviceContentRef}
                  dangerouslySetInnerHTML={{ __html: formatAdvice(advice) }}
                />
                <button 
                  className="copy-btn" 
                  onClick={() => handleCopyContent(advice, 'Advice')}
                  title="Copy advice to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <div className={`copy-success ${showCopySuccess ? 'show' : ''}`}>Copied!</div>
                {adviceHasScroll && <div className="scroll-indicator"></div>}
              </>
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
            
            <div className="sample-questions-container">
              <h3 className="sample-questions-heading">Try one of these questions:</h3>
              <div className="sample-questions-list">
                {sampleQuestions.map((q, index) => (
                  <button
                    key={index}
                    type="button"
                    className="sample-question-btn"
                    onClick={() => handleSampleQuestionClick(q)}
                    disabled={answerLoading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="ask-btn"
              disabled={answerLoading || !question.trim()}
            >
              {answerLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Getting Answer...
                </>
              ) : 'Ask Question'}
            </button>
          </form>
          
          <div className={`answer-container ${answerHasScroll ? 'has-scroll' : ''}`}>
            {answerLoading ? (
              <div className="answer-loading">
                <div className="spinner"></div>
                <p>Finding the best answer to your question...</p>
              </div>
            ) : streamedAnswer ? (
              <>
                <div 
                  className={`answer-content ${isStreaming ? 'is-streaming' : ''}`}
                  ref={answerContentRef}
                  dangerouslySetInnerHTML={{ __html: formatAdvice(streamedAnswer) }}
                />
                <button 
                  className="copy-btn" 
                  onClick={() => handleCopyContent(streamedAnswer, 'Answer')}
                  title="Copy answer to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                {!isStreaming && answerHasScroll && <div className="scroll-indicator"></div>}
                {isStreaming && (
                  <div className="streaming-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                )}
              </>
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
