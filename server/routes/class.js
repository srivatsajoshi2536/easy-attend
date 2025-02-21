const router = require('express').Router();
const Class = require('../models/Class');
const verifyToken = require('../middleware/auth');
const Attendance = require('../models/Attendance');

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Class route is working' });
});

// Create new class
router.post('/create', verifyToken, async (req, res) => {
  try {
    console.log('Creating class:', req.body);
    
    if (!req.user || req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied - Teacher role required' });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    const newClass = new Class({
      name,
      teacher: req.user.id,
      students: []
    });

    const savedClass = await newClass.save();
    console.log('Created class:', savedClass);
    
    // Verify the class was saved with a name
    const verifiedClass = await Class.findById(savedClass._id);
    console.log('Verified saved class:', verifiedClass);

    res.json(savedClass);
  } catch (err) {
    console.error('Error creating class:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get teacher's classes
router.get('/teacher-classes', verifyToken, async (req, res) => {
  try {
    console.log('Fetching classes for teacher:', req.user.id);
    const classes = await Class.find({ teacher: req.user.id })
      .populate('students', 'name studentId');
    console.log('Found classes:', classes);
    res.json(classes);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add students to class
router.post('/add-students', verifyToken, async (req, res) => {
  try {
    const { classId, studentIds } = req.body;
    console.log('Adding students to class:', { classId, studentIds });

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    classDoc.students = [...new Set([...classDoc.students, ...studentIds])];
    await classDoc.save();

    const updatedClass = await Class.findById(classId)
      .populate('students', 'name studentId');

    console.log('Updated class:', updatedClass);
    res.json(updatedClass);
  } catch (err) {
    console.error('Error adding students:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get students for a specific class
router.get('/:classId/students', verifyToken, async (req, res) => {
  try {
    console.log('Fetching students for class:', req.params.classId);
    
    const classDoc = await Class.findById(req.params.classId)
      .populate({
        path: 'students',
        select: 'name studentId'
      });

    if (!classDoc) {
      console.log('Class not found');
      return res.status(404).json({ message: 'Class not found' });
    }

    // Verify teacher ownership
    if (classDoc.teacher.toString() !== req.user.id) {
      console.log('Teacher mismatch:', {
        classTeacher: classDoc.teacher,
        requestingTeacher: req.user.id
      });
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Found students:', classDoc.students);
    res.json(classDoc.students);
  } catch (err) {
    console.error('Error fetching class students:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 