import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  FaUserGraduate,
  FaCalendarCheck,
  FaSignOutAlt,
  FaSearch,
  FaPlus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ManageStudents from "./ManageStudents";
import NewClass from "./NewClass";

const Endpoint =  process.env.REACT_APP_BACKEND_API_ENDPOINT  ;
const socket = io(Endpoint);

const ClassDetails = ({ classData, onClose, onAttendanceUpdate }) => {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [tempAttendance, setTempAttendance] = useState({});

  const fetchClassStudents = useCallback(async () => {
    try {
      console.log("Fetching students for class:", classData._id);

      const classRes = await axios.get(
        `${Endpoint}/api/class/${classData._id}/students`,
        {
          headers: { Authorization: localStorage.getItem("token") },
        }
      );
      console.log("Class students:", classRes.data);

      const attendanceRes = await axios.get(
        `${Endpoint}/api/attendance/class/${classData._id}/date/${date}`,
        {
          headers: { Authorization: localStorage.getItem("token") },
        }
      );
      console.log("Attendance data:", attendanceRes.data);

      const studentsWithAttendance = classRes.data.map((student) => ({
        ...student,
        attendance:
          attendanceRes.data.find(
            (a) => a.student.toString() === student._id.toString()
          )?.status || "Not marked",
      }));

      console.log("Students with attendance:", studentsWithAttendance);
      setStudents(studentsWithAttendance);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching class students:", err);
      setLoading(false);
    }
  }, [classData._id, date]);

  useEffect(() => {
    const handleAttendanceUpdate = (data) => {
      console.log("Teacher Dashboard received update:", data);

      if (data.type === "single" && data.record.classId === classData._id) {
        setStudents((prev) => {
          return prev.map((student) => {
            if (student._id === data.record.studentId) {
              return {
                ...student,
                attendance: data.record.status,
              };
            }
            return student;
          });
        });
      } else if (data.type === "bulk" && data.classId === classData._id) {
        fetchClassStudents();
      }
    };

    // Initial fetch and socket setup
    fetchClassStudents();
    socket.on("attendanceUpdate", handleAttendanceUpdate);

    return () => {
      socket.off("attendanceUpdate", handleAttendanceUpdate);
    };
  }, [classData._id, classData.name, date, fetchClassStudents]);

  const markTempAttendance = (studentId, status) => {
    setTempAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const saveAllAttendance = async () => {
    try {
      console.log("Starting to save attendance:", tempAttendance);

      const promises = Object.entries(tempAttendance).map(
        async ([studentId, status]) => {
          console.log("Processing attendance for student:", {
            studentId,
            status,
            classId: classData._id,
            className: classData.name,
          });

          const response = await axios.post(
            `${Endpoint}/api/attendance/mark`,
            {
              studentId,
              classId: classData._id,
              date,
              status,
            },
            {
              headers: { Authorization: localStorage.getItem("token") },
            }
          );

          return response.data;
        }
      );

      const results = await Promise.all(promises);
      console.log("All attendance saved:", results);

      // Update local state immediately
      setStudents((prev) =>
        prev.map((student) => ({
          ...student,
          attendance: tempAttendance[student._id] || student.attendance,
        }))
      );

      // Emit bulk update event
      socket.emit("attendanceUpdate", {
        type: "bulk",
        classId: classData._id,
        className: classData.name,
        date,
        updatedStudents: Object.keys(tempAttendance),
      });

      setTempAttendance({});
    } catch (err) {
      console.error("Error saving attendance:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{classData.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border rounded"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {Object.keys(tempAttendance).length} changes pending
          </div>
          <button
            onClick={saveAllAttendance}
            className={`px-4 py-2 rounded ${
              Object.keys(tempAttendance).length > 0
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={Object.keys(tempAttendance).length === 0}
          >
            Save All Changes
          </button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No students in this class yet
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="h-4 w-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-4">{student.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{student.studentId}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          markTempAttendance(student._id, "present")
                        }
                        className={`p-2 rounded-full ${
                          (tempAttendance[student._id] ||
                            student.attendance) === "present"
                            ? "bg-green-100"
                            : "hover:bg-green-100"
                        }`}
                      >
                        <svg
                          className={`h-5 w-5 ${
                            (tempAttendance[student._id] ||
                              student.attendance) === "present"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          markTempAttendance(student._id, "absent")
                        }
                        className={`p-2 rounded-full ${
                          (tempAttendance[student._id] ||
                            student.attendance) === "absent"
                            ? "bg-red-100"
                            : "hover:bg-red-100"
                        }`}
                      >
                        <svg
                          className={`h-5 w-5 ${
                            (tempAttendance[student._id] ||
                              student.attendance) === "absent"
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [showNewClass, setShowNewClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClassForDetails, setSelectedClassForDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [showManageStudents, setShowManageStudents] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [selectedClassForDelete, setSelectedClassForDelete] = useState(null);

  useEffect(() => {
    fetchClasses();

    const handleAttendanceUpdate = (data) => {
      console.log("Attendance update received:", data);
      fetchClasses();
    };

    socket.on("attendanceUpdate", handleAttendanceUpdate);

    return () => {
      socket.off("attendanceUpdate", handleAttendanceUpdate);
    };
  }, []);
  const handleDeleteClass = (classId) => {
    setSelectedClassForDelete(classId);
    setShowConfirmDialog(true);
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${Endpoint}/api/class/teacher-classes`, {
        headers: { Authorization: localStorage.getItem("token") },
      });
      setClasses(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleAddStudents = (classId) => {
    console.log("Opening add students for class:", classId);
    setSelectedClassId(classId);
    setShowManageStudents(true);
  };
  const deleteClass = async (classId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found. Please log in again.");
        return;
      }

      await axios.delete(`${Endpoint}/api/class/${classId}`, {
        headers: { Authorization: token },
      });

      setClasses(classes.filter((c) => c._id !== classId));
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Class deletion error:", err);
      console.error(
        err.response?.data?.message || err.message || "Failed to delete class"
      );
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <FaUserGraduate className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-semibold">
                Teacher Dashboard
              </span>
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
        {/* Search and New Class */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-xl">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md"
            />
          </div>
          <button
            onClick={() => setShowNewClass(true)}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <FaPlus className="mr-2" />
            New Class
          </button>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <div key={classItem._id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2">{classItem.name}</h3>
              <div className="text-gray-600 mb-4">
                {classItem.students.length} Students
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleAddStudents(classItem._id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Add Students
                </button>
                <button
                  onClick={() => setSelectedClassForDetails(classItem)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDeleteClass(classItem._id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this class?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteClass(selectedClassForDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewClass && (
        <NewClass
          onClose={() => setShowNewClass(false)}
          onClassCreated={(newClass) => {
            setClasses([...classes, newClass]);
            setShowNewClass(false);
          }}
        />
      )}

      {showManageStudents && (
        <ManageStudents
          classId={selectedClassId}
          onClose={() => {
            setShowManageStudents(false);
            setSelectedClassId(null);
          }}
          onStudentAdded={() => {
            fetchClasses();
            setShowManageStudents(false);
            setSelectedClassId(null);
          }}
        />
      )}

      {selectedClassForDetails && (
        <ClassDetails
          classData={selectedClassForDetails}
          onClose={() => setSelectedClassForDetails(null)}
          onAttendanceUpdate={() => {
            fetchClasses();
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
