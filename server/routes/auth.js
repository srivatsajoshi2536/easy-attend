const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' });
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;
    console.log('Registering new user:', { name, email, role, studentId });

    // Create user without checking for duplicates (for testing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      studentId: role === 'student' ? studentId : undefined
    });

    await user.save();
    console.log('User saved successfully:', user);

    res.json({ 
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Registration failed',
      error: err.message 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email); // Debug log

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for:', email); // Debug log
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      'your_jwt_secret',
      { expiresIn: '1h' }
    );

    console.log('Login successful for:', email); // Debug log
    res.json({ 
      token, 
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (err) {
    console.error('Login error:', err); // Debug log
    res.status(500).json({ message: err.message });
  }
});

// Get teacher's students
router.get('/students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const students = await User.find({ 
      role: 'student',
      assignedTeacher: req.user.id 
    }).select('-password');
    
    console.log('Teacher\'s students:', students); // Debug log
    res.json(students);
  } catch (err) {
    console.error('Error fetching teacher\'s students:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get unassigned students
router.get('/unassigned-students', verifyToken, async (req, res) => {
  try {
    console.log('Teacher requesting students:', req.user);
    
    // Get ALL students for now (remove filters for testing)
    const students = await User.find({
      role: 'student'
    });

    console.log('Found students:', students);

    if (!students || students.length === 0) {
      return res.json([]);
    }

    res.json(students);
  } catch (err) {
    console.error('Error in unassigned-students:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Assign students to teacher
router.post('/assign-students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentIds } = req.body;
    console.log('Assigning students:', studentIds, 'to teacher:', req.user.id);

    // Update all selected students
    const result = await User.updateMany(
      { _id: { $in: studentIds } },
      { $set: { assignedTeacher: req.user.id } }
    );

    console.log('Assignment result:', result);
    res.json({ message: 'Students assigned successfully' });
  } catch (err) {
    console.error('Error assigning students:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add this test route
router.get('/test/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log('All users:', users);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add at the top of your routes
router.get('/test-students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    console.log('All students in DB:', students);
    res.json({
      message: 'Students found',
      count: students.length,
      students: students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        studentId: s.studentId
      }))
    });
  } catch (err) {
    console.error('Test route error:', err);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

module.exports = router; 