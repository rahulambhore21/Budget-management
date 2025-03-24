import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Login user
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register new user
export const signup = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Check token validity
export const validateToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
};