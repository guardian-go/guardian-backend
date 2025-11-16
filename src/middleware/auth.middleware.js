import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Verify JWT token and attach user to request
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided. Please provide a valid authentication token.' 
            });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication token is required' 
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.SECRET || 'default_secret');
        
        // Get user from database
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found. Token is invalid.' 
            });
        }
        
        // Attach user to request
        req.user = user;
        req.userId = user._id.toString();
        req.userRole = user.role;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication error: ' + error.message 
        });
    }
};

// Check if user has specific role
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }
        
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Required role: ${roles.join(' or ')}` 
            });
        }
        
        next();
    };
};

// Check if user is accessing their own resource
export const checkOwnership = (paramName = 'id') => {
    return (req, res, next) => {
        const resourceId = req.params[paramName];
        const userId = req.userId;
        
        if (resourceId !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only access your own resources.' 
            });
        }
        
        next();
    };
};

// Combined middleware: authenticate + check ownership
export const authenticateAndOwn = (paramName = 'id') => {
    return [
        authenticate,
        checkOwnership(paramName)
    ];
};

