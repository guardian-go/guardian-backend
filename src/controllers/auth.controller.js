import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Parent from "../models/parent.model.js";
import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";

// Get all teachers (public endpoint for registration)
export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
            .select('fullName email _id subject department employeeId')
            .sort({ fullName: 1 });
        
        res.status(200).json({ success: true, data: teachers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Register Parent
export const registerParent = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, address, emergencyContact, parentPhoto, student } = req.body;
        
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
            photo: parentPhoto, // Store parent photo URL from Cloudinary
            children: []
        });
        
        await parent.save();
        
        // Create student if provided
        let studentData = null;
        if (student && student.fullName) {
            if (!student.relation) {
                return res.status(400).json({
                    success: false,
                    message: 'Student relation to parent is required'
                });
            }

            // Validate teacher if provided
            let teacher = null;
            if (student.teacherId) {
                teacher = await Teacher.findById(student.teacherId);
                if (!teacher) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid teacher ID provided'
                    });
                }
            }

            const newStudent = new Student({
                fullName: student.fullName,
                grade: student.grade,
                photo: student.photo, // Store student photo URL from Cloudinary
                dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
                parent: parent._id,
                relation: student.relation,
                address: address, // Use parent's address
                primaryTeacher: student.teacherId || undefined,
            });
            
            await newStudent.save();
            
            // Add student to parent's children array
            parent.children.push(newStudent._id);
            await parent.save();
            
            // If teacher was provided, add student to teacher's students array
            if (teacher && student.teacherId) {
                if (!Array.isArray(teacher.students)) {
                    teacher.students = [];
                }
                if (!teacher.students.includes(newStudent._id)) {
                    teacher.students.push(newStudent._id);
                    await teacher.save();
                }
            }
            
            studentData = newStudent.toObject();
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: parent._id, role: parent.role },
            process.env.SECRET || 'default_secret',
            { expiresIn: '7d' }
        );
        
        // Remove password from response
        const parentResponse = parent.toObject();
        delete parentResponse.password;
        
        // Populate children in response
        await parent.populate('children', 'fullName grade photo');
        
        res.status(201).json({ 
            success: true, 
            message: 'Parent registered successfully',
            data: {
                ...parentResponse,
                children: parent.children
            },
            student: studentData,
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
        // Try Parent first, then Teacher
        let user = await Parent.findOne({ email });
        if (!user) {
            user = await Teacher.findOne({ email });
        }
        
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

