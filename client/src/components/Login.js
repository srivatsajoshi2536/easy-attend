import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    try {
      console.log('Attempting login with:', formData); // Debug log
      
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      console.log('Login response:', res.data); // Debug log
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (res.data.role === 'student') {
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err.response || err); // Debug log
      setError(
        err.response?.data?.message || 
        'Unable to connect to server. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            className="w-full px-3 py-2 border rounded-md"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
        <div className="text-center mt-4">
          <p>Don't have an account? <a href="/register" className="text-blue-600 hover:text-blue-800">Register here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 