import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    studentId: "",
    teacherkey: "",
  });
  const [error, setError] = useState("");
  const UniquTeacherCode = "123456";
  const navigate = useNavigate();
  const Endpoint =  process.env.REACT_APP_BACKEND_API_ENDPOINT  ;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if(formData.role === "teacher") {
        console.log("Teacher key is", formData.teacherkey);
        console.log("UniquTeacherCode: ", UniquTeacherCode);
        if(formData.teacherkey !== UniquTeacherCode) {
          setError("Invalid Teacher Key");
          return;
        }
      }
      const res = await axios.post(
        `${Endpoint}/api/auth/register`,
        formData
      );
      console.log("Registration successful:", res.data);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center">Register</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          {formData.role === "student" ? (
            <input
              type="text"
              placeholder="Student ID"
              value={formData.studentId}
              onChange={(e) =>
                setFormData({ ...formData, studentId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          ) : (
            <input
              type="text"
              placeholder="Teacher Key"
              value={formData.teacherkey}
              onChange={(e) =>
                setFormData({ ...formData, teacherkey: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          )}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
