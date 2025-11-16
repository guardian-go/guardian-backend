import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Parent from "../models/parent.model.js";
import Teacher from "../models/teacher.model.js";

// Register Parent
export const registerParent = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, address, emergencyContact, children } = req.body;
        
        // Validate required fields
        if (!fullName || !email || !password || !phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields: fullName, email, password, phoneNumber' 
            });
        }
        
        // Check if parent already exists
        const existingParent = await Parent.findOne({ email });
        if (existingParent) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parent with this email already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create parent
        const parent = new Parent({
            fullName,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
            emergencyContact,
            children: children || []
        });
        
        await parent.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: parent._id, role: parent.role },
            process.env.SECRET || 'default_secret',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const parentResponse = parent.toObject();
        delete parentResponse.password;
        
        res.status(201).json({ 
            success: true, 
            message: 'Parent registered successfully',
            data: parentResponse,
            token 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Register Teacher
export const registerTeacher = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, subject, classes, department, employeeId } = req.body;
        
        // Validate required fields
        if (!fullName || !email || !password || !phoneNumber || !subject) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields: fullName, email, password, phoneNumber, subject' 
            });
        }
        
        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            return res.status(400).json({ 
                success: false, 
                message: 'Teacher with this email already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create teacher
        const teacher = new Teacher({
            fullName,
            email,
            password: hashedPassword,
            phoneNumber,
            subject,
            classes: classes || [],
            students: [],
            department,
            employeeId
        });
        
        await teacher.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: teacher._id, role: teacher.role },
            process.env.SECRET || 'default_secret',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const teacherResponse = teacher.toObject();
        delete teacherResponse.password;
        
        res.status(201).json({ 
            success: true, 
            message: 'Teacher registered successfully',
            data: teacherResponse,
            token 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login (works for both Parent and Teacher)
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }
        
        // Find user (could be Parent or Teacher)
        const user = await Parent.findOne({ email }) || await Teacher.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET || 'default_secret',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({ 
            success: true, 
            message: 'Login successful',
            data: userResponse,
            token 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({ success: true, data: userResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

