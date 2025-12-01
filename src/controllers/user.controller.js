import User from "../models/user.model.js";

// Save or update FCM token for the authenticated user
export const updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.fcmToken = fcmToken || null;
        await user.save();

        res.status(200).json({ success: true, message: "FCM token updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

