import axios from 'axios';

const API_KEY = "AIzaSyDJSI1YWY6ESFhSIzFIUZPb0V0a1p33GKM"; // Replace with your actual API key
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Construct a prompt for financial advice based on user data
 * @param {Object} financialData - User's financial data including transactions, budget, etc.
 * @returns {string} - Constructed prompt for the AI
 */
const constructPrompt = (financialData) => {
  const { transactions, budget, income, savings, goals } = financialData;
  
  // Calculate total spending and income
  const totalSpending = transactions ? transactions.reduce((sum, tx) => sum + tx.amount, 0) : 0;
  const totalIncome = income ? income.reduce((sum, inc) => sum + inc.amount, 0) : 0;
  
  // Format transaction data
  let transactionText = '';
  if (transactions && transactions.length > 0) {
    // Group transactions by category
    const byCategory = transactions.reduce((acc, tx) => {
      if (!acc[tx.category]) acc[tx.category] = 0;
      acc[tx.category] += tx.amount;
      return acc;
    }, {});
    
    transactionText = 'Recent transactions by category:\n';
    Object.entries(byCategory).forEach(([category, amount]) => {
      transactionText += `- ${category}: ₹${amount}\n`;
    });
  }
  
  // Format budget data
  let budgetText = '';
  if (budget && budget.length > 0) {
    budgetText = 'Budget limits:\n';
    budget.forEach(b => {
      budgetText += `- ${b.category}: ₹${b.amount}\n`;
    });
  }
  
  // Format savings goals
  let goalsText = '';
  if (goals && goals.length > 0) {
    goalsText = 'Savings goals:\n';
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      goalsText += `- ${goal.name}: ₹${goal.currentAmount} saved of ₹${goal.targetAmount} target (${progress.toFixed(1)}%)\n`;
    });
  }
  
  // Construct the final prompt
  return `
As a financial advisor, analyze the following financial data and provide personalized advice:

${transactionText}

${budgetText}

${goalsText}

Monthly income: ₹${totalIncome}
Monthly expenses: ₹${totalSpending}
Savings rate: ${totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome * 100).toFixed(1) : 0}%

Based on this information, please provide:
1. A brief assessment of the current financial situation
2. 3-5 specific, actionable recommendations to improve financial health
3. Suggestions for optimizing spending in high-expense categories
4. Savings strategies aligned with the stated goals
5. Any potential concerns or risks in the current financial pattern

Please format your response as clear bullet points with practical, specific advice.
`;
};

/**
 * Generate financial advice based on transaction data and user's financial situation
 * @param {Object} financialData - User's financial data including transactions, budget, etc.
 * @returns {Promise<Object>} - Generated financial advice
 */
export const generateFinancialAdvice = async (financialData) => {
  try {
    const prompt = constructPrompt(financialData);
    
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`, 
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }
    );
    
    // Process and extract the text from response
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      const adviceText = response.data.candidates[0].content.parts[0].text;
      
      return {
        status: 'success',
        data: {
          advice: adviceText,
          generatedAt: new Date().toISOString()
        }
      };
    } else {
      console.error('Unexpected API response structure:', response.data);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating financial advice:', error);
    
    // Specific error handling for different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error('API Error Response:', error.response.data);
      
      if (error.response.status === 404) {
        throw new Error('AI service endpoint not found. Please check the API URL.');
      } else if (error.response.status === 400) {
        throw new Error('Invalid request to AI service. Please check your input data.');
      } else if (error.response.status === 403) {
        throw new Error('API key unauthorized. Please check your API key configuration.');
      } else {
        throw new Error(`AI service error (${error.response.status}): ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from AI service. Please check your network connection.');
    } else {
      // Something happened in setting up the request
      throw new Error(`Error setting up AI request: ${error.message}`);
    }
  }
};

/**
 * Get a quick response to a specific financial question
 * @param {String} question - User's financial question
 * @returns {Promise<Object>} - AI response to the question
 */
export const askFinancialQuestion = async (question) => {
  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`, 
      {
        contents: [
          {
            parts: [
              {
                text: `As a financial advisor, please answer this question in the context of personal finance in India: ${question}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }
    );

    const generatedText = response.data.candidates[0].content.parts[0].text;
    return { success: true, answer: generatedText };
  } catch (error) {
    console.error('Error asking financial question:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      answer: "I couldn't answer your question at this moment. Please try again later."
    };
  }
};
