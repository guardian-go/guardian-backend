import Notification from "../models/notification.model.js";

// Get notification by ID (user can only access their own notifications)
export const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate('sender', 'fullName email')
            .populate('recipient', 'fullName email')
            .populate('relatedStudent', 'fullName');
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        // Check if user is the recipient or sender
        const userId = req.userId.toString();
        const recipientId = notification.recipient._id ? notification.recipient._id.toString() : notification.recipient.toString();
        const senderId = notification.sender._id ? notification.sender._id.toString() : notification.sender.toString();
        
        if (userId !== recipientId && userId !== senderId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only access your own notifications.' 
            });
        }
        
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark notification as read (user can only mark their own notifications as read)
export const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        // Check if user is the recipient
        const userId = req.userId.toString();
        const recipientId = notification.recipient.toString();
        
        if (userId !== recipientId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only mark your own notifications as read.' 
            });
        }
        
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
        
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark multiple notifications as read (user can only mark their own notifications)
export const markNotificationsAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.userId.toString();
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ success: false, message: 'Notification IDs array is required' });
        }
        
        // Only update notifications where user is the recipient
        const result = await Notification.updateMany(
            { 
                _id: { $in: notificationIds },
                recipient: userId
            },
            { 
                $set: { 
                    isRead: true, 
                    readAt: new Date() 
                } 
            }
        );
        
        res.status(200).json({ 
            success: true, 
            message: `${result.modifiedCount} notifications marked as read`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete notification (user can only delete their own notifications)
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        // Check if user is the recipient or sender
        const userId = req.userId.toString();
        const recipientId = notification.recipient.toString();
        const senderId = notification.sender.toString();
        
        if (userId !== recipientId && userId !== senderId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only delete your own notifications.' 
            });
        }
        
        await Notification.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete multiple notifications (user can only delete their own notifications)
export const deleteNotifications = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.userId.toString();
        
        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ success: false, message: 'Notification IDs array is required' });
        }
        
        // Only delete notifications where user is recipient or sender
        const result = await Notification.deleteMany({ 
            _id: { $in: notificationIds },
            $or: [
                { recipient: userId },
                { sender: userId }
            ]
        });
        
        res.status(200).json({ 
            success: true, 
            message: `${result.deletedCount} notifications deleted`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get own notifications (user can only see notifications where they are recipient or sender)
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.userId.toString();
        const { type, isRead, limit = 50, skip = 0 } = req.query;
        
        const query = {
            $or: [
                { recipient: userId },
                { sender: userId }
            ]
        };
        
        if (type) query.type = type;
        if (isRead !== undefined) query.isRead = isRead === 'true';
        
        const notifications = await Notification.find(query)
            .populate('sender', 'fullName email')
            .populate('recipient', 'fullName email')
            .populate('relatedStudent', 'fullName')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));
        
        const total = await Notification.countDocuments(query);
        
        res.status(200).json({ 
            success: true, 
            data: notifications,
            total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

