import Notification from "../models/notification.model.js";

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

