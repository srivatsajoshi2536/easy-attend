import React, { useState } from 'react';
import axios from 'axios';

const NewClass = ({ onClose, onClassCreated }) => {
  const [className, setClassName] = useState('');
  const [error, setError] = useState('');
  const Endpoint =  process.env.REACT_APP_BACKEND_API_ENDPOINT  ;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Attempting to create class:', {
        name: className,
        token: token
      });

      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      // First, test if the route exists
      try {
        const testResponse = await axios.get(`${Endpoint}/api/class/test`);
        console.log('Route test response:', testResponse.data);
      } catch (testErr) {
        console.error('Route test failed:', testErr);
      }

      // Then try to create the class
      const res = await axios.post(
        `${Endpoint}/api/class/create`,
        { name: className },
        { 
          headers: { 
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Class creation response:', res.data);
      onClassCreated(res.data);
      onClose();
    } catch (err) {
      console.error('Class creation error:', {
        message: err.message,
        response: err.response,
        status: err.response?.status
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create class';
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create New Class</h2>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Class Name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-4"
            required
          />
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClass; 