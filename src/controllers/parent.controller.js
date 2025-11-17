import Parent from "../models/parent.model.js";
import Notification from "../models/notification.model.js";
import Teacher from "../models/teacher.model.js";

// Get own profile (parent can only access their own data)
export const getMyProfile = async (req, res) => {
    try {
        const parent = await Parent.findById(req.userId)
            .select('-password')
            .populate('children', 'fullName email');
        
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }
        
        res.status(200).json({ success: true, data: parent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update own profile (parent can only update their own data)
export const updateMyProfile = async (req, res) => {
    try {
        const { fullName, phoneNumber, address, emergencyContact, children } = req.body;
        
        const parent = await Parent.findById(req.userId);
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }
        
        if (fullName) parent.fullName = fullName;
        if (phoneNumber) parent.phoneNumber = phoneNumber;
        if (address) parent.address = address;
        if (emergencyContact) parent.emergencyContact = emergencyContact;
        if (children) parent.children = children;
        
        await parent.save();
        
        const parentResponse = parent.toObject();
        delete parentResponse.password;
        
        res.status(200).json({ success: true, data: parentResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get own notifications (parent can only access their own notifications)
export const getMyNotifications = async (req, res) => {
    try {
        const parentId = req.userId;
        const { isRead, limit = 50, skip = 0 } = req.query;
        
        const query = { 
            recipient: parentId, 
            recipientModel: 'Parent' 
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

// Send notification from parent to teacher (parent can only send as themselves)
export const sendNotificationToTeacher = async (req, res) => {
    try {
        const parentId = req.userId; // Use authenticated user's ID
        const { teacherId, title, message, type, priority, relatedStudent } = req.body;
        
        if (!teacherId || !title || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'teacherId, title, and message are required' 
            });
        }
        
        const parent = await Parent.findById(parentId);
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }
        
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }
        
        const notification = new Notification({
            sender: parentId,
            senderModel: 'Parent',
            recipient: teacherId,
            recipientModel: 'Teacher',
            title,
            message,
            type: type || 'general',
            priority: priority || 'medium',
            relatedStudent
        });
        
        await notification.save();
        
        // Emit real-time notification via WebSocket
        const io = req.app.get('io');
        io.to(`user-${teacherId}`).emit('new-notification', {
            notification: await Notification.findById(notification._id)
                .populate('sender', 'fullName email')
                .populate('relatedStudent', 'fullName')
        });
        
        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

