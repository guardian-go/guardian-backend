// This controller is kept for backward compatibility
// Use /api/auth/me instead for getting current user profile
export const getProfile = async (req, res) => {
    try {
        res.status(200).json({ 
            success: true, 
            message: 'Please use /api/auth/me endpoint to get your profile',
            data: req.user 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

