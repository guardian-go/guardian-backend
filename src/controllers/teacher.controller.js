import Teacher from "../models/teacher.model.js";
import Notification from "../models/notification.model.js";
import Parent from "../models/parent.model.js";

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

