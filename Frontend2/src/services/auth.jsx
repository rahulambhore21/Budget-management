import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    // Store token in the response object for easier access
    return {
      ...response.data,
      token: response.data.token
    };
  } catch (error) {
    console.error('Login API error:', error.response?.data || error.message);
    throw error;
  }
};

export const signup = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, { email, password });
    // Store token in the response object for easier access
    return {
      ...response.data,
      token: response.data.token
    };
  } catch (error) {
    console.error('Signup API error:', error.response?.data || error.message);
    throw error;
  }
};

// Add a token verification endpoint if available
export const verifyToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Token verification error:', error.response?.data || error.message);
    throw error;
  }
};