import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';

const ManageStudents = ({ classId, onClose, onStudentAdded }) => {
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const Endpoint =  process.env.REACT_APP_BACKEND_API_ENDPOINT;

  useEffect(() => {
    if (!classId) {
      console.error('No classId provided');
      setError('Invalid class selected');
      return;
    }
    console.log('ManageStudents mounted with classId:', classId);
    fetchAvailableStudents();
  }, [classId]);

  const fetchAvailableStudents = async () => {
    try {
      console.log('Fetching available students');
      const res = await axios.get(`${Endpoint}/api/auth/unassigned-students`, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      console.log('Available students:', res.data);
      setAvailableStudents(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      if (!classId) {
        console.error('No classId provided to ManageStudents');
        setError('No class selected');
        return;
      }

      if (selectedStudents.length === 0) {
        setError('Please select at least one student');
        return;
      }

      console.log('Attempting to add students:', {
        classId,
        selectedStudents,
        token: localStorage.getItem('token')?.substring(0, 10) + '...'
      });

      const response = await axios.post(
        `${Endpoint}/api/class/add-students`,
        {
          classId,
          studentIds: selectedStudents
        },
        {
          headers: { 
            'Authorization': localStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);
      onStudentAdded();
      onClose();
    } catch (err) {
      console.error('Error in handleSaveAll:', {
        error: err,
        response: err.response?.data,
        classId,
        selectedStudents
      });
      setError(err.response?.data?.message || 'Failed to add students to class');
    }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Students</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md"
          />
        </div>

        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">{student.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4">{student.studentId}</td>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={(e) => toggleStudent(student._id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {selectedStudents.length} students selected
          </div>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={selectedStudents.length === 0}
            >
              Save All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents; 