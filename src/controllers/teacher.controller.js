import Teacher from "../models/teacher.model.js";
import Notification from "../models/notification.model.js";
import Parent from "../models/parent.model.js";
import Student from "../models/student.model.js";

// Get own profile (teacher can only access their own data)
export const getMyProfile = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.userId)
            .select('-password')
            .populate('students', 'fullName email');
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        
        res.status(200).json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new student and assign to this teacher
export const createStudent = async (req, res) => {
    try {
        const teacherId = req.userId;
        const { fullName, grade, phoneNumber, address } = req.body;

        if (!fullName) {
            return res.status(400).json({ success: false, message: 'fullName is required' });
        }

        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const student = new Student({
            fullName,
            grade,
            phoneNumber,
            address,
            primaryTeacher: teacherId
        });

        await student.save();

        // Add student to teacher's list if not already there
        if (!Array.isArray(teacher.students)) {
            teacher.students = [];
        }
        if (!teacher.students.includes(student._id)) {
            teacher.students.push(student._id);
            await teacher.save();
        }

        res.status(201).json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update own profile (teacher can only update their own data)
export const updateMyProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber, subject, classes, students, department, employeeId } = req.body;
        
        const teacher = await Teacher.findById(req.userId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        
        if (fullName) teacher.fullName = fullName;
        if (phoneNumber) teacher.phoneNumber = phoneNumber;
        if (subject) teacher.subject = subject;
        if (classes) teacher.classes = classes;
        if (students) teacher.students = students;
        if (department) teacher.department = department;
        if (employeeId) teacher.employeeId = employeeId;
        
        await teacher.save();
        
        const teacherResponse = teacher.toObject();
        delete teacherResponse.password;
        
        res.status(200).json({ success: true, data: teacherResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get own notifications (teacher can only access their own notifications)
export const getMyNotifications = async (req, res) => {
    try {
        const teacherId = req.userId;
        const { isRead, limit = 50, skip = 0 } = req.query;
        
        const query = { 
            recipient: teacherId, 
            recipientModel: 'Teacher' 
        };
        
        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }
        
        const notifications = await Notification.find(query)
            .populate('sender', 'fullName email')
            .populate('relatedStudent', 'fullName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        
        const total = await Notification.countDocuments(query);
        
        res.status(200).json({ 
            success: true, 
            data: notifications,
            total,
            unread: await Notification.countDocuments({ ...query, isRead: false })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send notification from teacher to parent (teacher can only send as themselves)
export const sendNotificationToParent = async (req, res) => {
    try {
        const teacherId = req.userId; // Use authenticated user's ID
        const { parentId, title, message, type, priority, relatedStudent } = req.body;
        
        if (!parentId || !title || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'parentId, title, and message are required' 
            });
        }
        
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        
        const parent = await Parent.findById(parentId);
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }
        
        const notification = new Notification({
            sender: teacherId,
            senderModel: 'Teacher',
            recipient: parentId,
            recipientModel: 'Parent',
            title,
            message,
            type: type || 'general',
            priority: priority || 'medium',
            relatedStudent
        });
        
        await notification.save();
        
        // Emit real-time notification via WebSocket
        const io = req.app.get('io');
        io.to(`user-${parentId}`).emit('new-notification', {
            notification: await Notification.findById(notification._id)
                .populate('sender', 'fullName email')
                .populate('relatedStudent', 'fullName')
        });
        
        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send notification to multiple parents (e.g., class announcement) - teacher can only send as themselves
export const sendNotificationToMultipleParents = async (req, res) => {
    try {
        const teacherId = req.userId; // Use authenticated user's ID
        const { parentIds, title, message, type, priority, relatedStudent } = req.body;
        
        if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Parent IDs array is required' });
        }
        
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }
        
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        
        const notifications = [];
        const io = req.app.get('io');
        
        for (const parentId of parentIds) {
            const parent = await Parent.findById(parentId);
            if (!parent) continue; // Skip invalid parent IDs
            
            const notification = new Notification({
                sender: teacherId,
                senderModel: 'Teacher',
                recipient: parentId,
                recipientModel: 'Parent',
                title,
                message,
                type: type || 'general',
                priority: priority || 'medium',
                relatedStudent
            });
            
            await notification.save();
            
            // Emit real-time notification
            io.to(`user-${parentId}`).emit('new-notification', {
                notification: await Notification.findById(notification._id)
                    .populate('sender', 'fullName email')
                    .populate('relatedStudent', 'fullName')
            });
            
            notifications.push(notification);
        }
        
        res.status(201).json({ success: true, data: notifications, count: notifications.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all students assigned to teacher
export const getMyStudents = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.userId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const students = await Student.find({ _id: { $in: teacher.students } })
            .populate('parent', 'fullName email phoneNumber address')
            .sort({ fullName: 1 });

        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student details by ID
export const getStudentById = async (req, res) => {
    try {
        const { studentId } = req.params;
        const teacher = await Teacher.findById(req.userId);
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Check if student is assigned to this teacher
        if (!teacher.students.includes(studentId)) {
            return res.status(403).json({ success: false, message: 'Student not assigned to you' });
        }

        const student = await Student.findById(studentId)
            .populate('parent', 'fullName email phoneNumber address emergencyContact')
            .populate('releasedBy', 'fullName email');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if there's a recent school_reached notification for this student
        // Only check notifications from today to ensure it's relevant
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const schoolReachedNotification = await Notification.findOne({
            recipient: req.userId,
            recipientModel: 'Teacher',
            type: 'school_reached',
            relatedStudent: studentId,
            createdAt: { $gte: todayStart }
        }).sort({ createdAt: -1 });

        // Convert student to object and add the flag
        const studentData = student.toObject();
        studentData.hasSchoolReachedNotification = !!schoolReachedNotification;

        res.status(200).json({ success: true, data: studentData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Release student (mark as released)
export const releaseStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const teacher = await Teacher.findById(req.userId);
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Check if student is assigned to this teacher
        if (!teacher.students.includes(studentId)) {
            return res.status(403).json({ success: false, message: 'Student not assigned to you' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if parent has sent a school_reached notification today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const schoolReachedNotification = await Notification.findOne({
            recipient: req.userId,
            recipientModel: 'Teacher',
            type: 'school_reached',
            relatedStudent: studentId,
            createdAt: { $gte: todayStart }
        });

        if (!schoolReachedNotification) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot release student. Parent must send a "School Reached" notification first.' 
            });
        }

        // Update student as released
        student.isReleased = true;
        student.releasedAt = new Date();
        student.releasedBy = req.userId;
        await student.save();

        // Send notification to parent
        const notification = new Notification({
            sender: req.userId,
            senderModel: 'Teacher',
            recipient: student.parent,
            recipientModel: 'Parent',
            title: 'Student Released',
            message: `${student.fullName} has been released from school by ${teacher.fullName} at ${new Date().toLocaleTimeString()}`,
            type: 'student_released',
            priority: 'high',
            relatedStudent: student._id // Send student ID, not name
        });

        await notification.save();

        // Emit real-time notification
        const io = req.app.get('io');
        io.to(`user-${student.parent}`).emit('new-notification', {
            notification: await Notification.findById(notification._id)
                .populate('sender', 'fullName email')
                .populate('relatedStudent', 'fullName')
        });

        res.status(200).json({ 
            success: true, 
            message: 'Student released successfully',
            data: student 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

