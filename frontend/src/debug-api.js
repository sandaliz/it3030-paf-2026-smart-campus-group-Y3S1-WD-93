// Debug API calls
import apiInstance from './services/axiosInstance.js';

const testUsersEndpoint = async () => {
  console.log('Testing users endpoint...');
  console.log('Base URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080');
  
  try {
    const response = await apiInstance.get('/api/admin/dashboard/users');
    console.log('Full response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Response headers:', response.headers);
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
  }
};

testUsersEndpoint();
