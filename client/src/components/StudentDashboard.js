import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { FaUser, FaCalendarAlt, FaSignOutAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Endpoint = process.env.BACKEND_API_ENDPOINT || "http://localhost:5000";

const socket = io(Endpoint);

const StudentDashboard = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    presentDays: 0,
    absentDays: 0
  });
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching attendance for student:', user.id);
      
      const res = await axios.get(`${Endpoint}/api/attendance/student`, {
        headers: { Authorization: localStorage.getItem('token') }
      });
      
      console.log('Received attendance data:', res.data);
      
      const sortedAttendance = res.data.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      setAttendance(sortedAttendance);
      
      // Calculate stats
      const totalDays = sortedAttendance.length;
      const presentDays = sortedAttendance.filter(a => a.status === 'present').length;
      const absentDays = totalDays - presentDays;
      
      // Get unique classes
      const uniqueClasses = new Set(sortedAttendance.map(a => a.className)).size;

      setStats({
        totalClasses: uniqueClasses,
        presentDays,
        absentDays
      });
      
      setPercentage(totalDays > 0 ? (presentDays / totalDays) * 100 : 0);
      calculateMonthlyStats(sortedAttendance);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    const handleAttendanceUpdate = (data) => {
      console.log('Student Dashboard received update:', data);

      if (data.type === 'single' && data.record) {
        const receivedId = String(data.record.studentId);
        const userId = String(user.id);

        if (receivedId === userId) {
          console.log('Updating attendance for current student');
          setAttendance(prev => {
            // Remove old record if exists
            const filtered = prev.filter(a => 
              !(a.classId === data.record.classId && a.date === data.record.date)
            );
            // Add new record
            const updated = [data.record, ...filtered];
            // Sort by date
            updated.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Update stats
            const presentDays = updated.filter(a => a.status === 'present').length;
            const totalDays = updated.length;
            const uniqueClasses = new Set(updated.map(a => a.className)).size;

            setStats({
              totalClasses: uniqueClasses,
              presentDays,
              absentDays: totalDays - presentDays
            });

            setPercentage(totalDays > 0 ? (presentDays / totalDays) * 100 : 0);
            calculateMonthlyStats(updated);

            return updated;
          });
        }
      } else if (data.type === 'bulk') {
        fetchAttendance();
      }
    };

    socket.on('attendanceUpdate', handleAttendanceUpdate);
    fetchAttendance();

    return () => {
      socket.off('attendanceUpdate', handleAttendanceUpdate);
    };
  }, [user.id, fetchAttendance]);

  const calculateMonthlyStats = (attendanceData) => {
    const monthlyData = attendanceData.reduce((acc, record) => {
      const month = new Date(record.date).toLocaleString('default', { month: 'short' });
      if (!acc[month]) {
        acc[month] = { present: 0, total: 0 };
      }
      acc[month].total++;
      if (record.status === 'present') {
        acc[month].present++;
      }
      return acc;
    }, {});

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      percentage: (data.present / data.total) * 100
    }));

    setMonthlyStats(chartData);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <FaUser className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-semibold">Student Dashboard</span>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <FaCalendarAlt className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Classes</p>
                <p className="text-2xl font-semibold">{stats.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <FaCheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Present Days</p>
                <p className="text-2xl font-semibold text-green-600">{stats.presentDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500">
                <FaTimesCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Absent Days</p>
                <p className="text-2xl font-semibold text-red-600">{stats.absentDays}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Attendance Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Percentage Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Overall Attendance</h2>
          <div className="flex items-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeDasharray={`${percentage}, 100`}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold">
                {percentage.toFixed(1)}%
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm text-gray-500">Target: 75%</div>
              <div className={`text-lg font-semibold ${percentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                {percentage >= 75 ? 'On Track' : 'Need Improvement'}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Attendance History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.className}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 