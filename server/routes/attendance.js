const router = require('express').Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const verifyToken = require('../middleware/auth');
const socket = require('../socket');

// Get attendance by date
router.get('/date/:date', verifyToken, async (req, res) => {
  try {
    const attendance = await Attendance.find({
      date: new Date(req.params.date)
    }).populate('student', 'name email studentId');
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark attendance
router.post('/mark', verifyToken, async (req, res) => {
  try {
    const { studentId, classId, date, status } = req.body;
    console.log('Marking attendance:', { studentId, classId, date, status });

    // Get class details
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error(`Class not found with id: ${classId}`);
    }

    // Convert IDs to ObjectId
    const studentObjectId = mongoose.Types.ObjectId(studentId);
    const classObjectId = mongoose.Types.ObjectId(classId);

    let attendance = await Attendance.findOne({
      student: studentObjectId,
      class: classObjectId,
      date: new Date(date)
    });

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = new Attendance({
        student: studentObjectId,
        class: classObjectId,
        date: new Date(date),
        status,
        markedBy: req.user.id
      });
      await attendance.save();
    }

    // Get the complete record with populated fields
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('class', 'name')
      .lean();

    // Emit socket event with the updated attendance record
    const formattedRecord = {
      _id: attendance._id.toString(),
      studentId: studentId,
      classId: classId,
      className: classDoc.name,
      date: new Date(date).toISOString().split('T')[0],
      status: status
    };

    // Emit the attendance update
    socket.emit('attendanceUpdate', {
      type: 'single',
      record: formattedRecord
    });

    res.json(formattedRecord);
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get student's attendance
router.get('/student', verifyToken, async (req, res) => {
  try {
    console.log('Fetching attendance for student:', req.user.id);
    
    const studentObjectId = mongoose.Types.ObjectId(req.user.id);
    
    // Get all attendance records with class details
    const attendanceRecords = await Attendance.aggregate([
      { 
        $match: { 
          student: studentObjectId 
        } 
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'class',
          foreignField: '_id',
          as: 'classDetails'
        }
      },
      { $unwind: '$classDetails' },
      {
        $project: {
          _id: 1,
          date: 1,
          status: 1,
          className: '$classDetails.name',
          classId: '$classDetails._id',
          studentId: '$student'
        }
      },
      { $sort: { date: -1 } }
    ]);

    console.log('Found attendance records:', attendanceRecords);

    // Transform dates to ISO string format
    const formattedRecords = attendanceRecords.map(record => ({
      ...record,
      date: new Date(record.date).toISOString().split('T')[0]
    }));

    res.json(formattedRecords);
  } catch (err) {
    console.error('Error fetching student attendance:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get attendance by class and date
router.get('/class/:classId/date/:date', verifyToken, async (req, res) => {
  try {
    const { classId, date } = req.params;
    console.log('Fetching attendance for:', { classId, date });

    const attendance = await Attendance.find({
      class: classId,
      date: date
    }).populate('class', 'name');

    console.log('Found attendance records:', attendance);
    res.json(attendance);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 