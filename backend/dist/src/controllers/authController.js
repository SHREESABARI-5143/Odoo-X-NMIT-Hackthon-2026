"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.changePassword = changePassword;
exports.getMe = getMe;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_super_secret_jwt_key_2026';
async function login(req, res) {
    try {
        const { loginId, password } = req.body;
        if (!loginId || !password) {
            return res.status(400).json({ message: 'Invalid Login ID or password.' });
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { loginId: loginId.trim() },
                    { email: loginId.trim().toLowerCase() },
                ],
            },
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Login ID or password.' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid Login ID or password.' });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            loginId: user.loginId,
            email: user.email,
            role: user.role,
            firstLogin: user.firstLogin,
        }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            token,
            user: {
                id: user.id,
                loginId: user.loginId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                firstLogin: user.firstLogin,
                avatarUrl: user.avatarUrl,
                companyName: user.companyName,
                jobPosition: user.jobPosition,
                department: user.department,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error during login.' });
    }
}
async function changePassword(req, res) {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: 'Password must contain uppercase, lowercase, number, and special character.',
            });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (currentPassword) {
            const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isValid) {
                return res.status(400).json({ message: 'Current password is incorrect.' });
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                firstLogin: false,
            },
        });
        return res.json({ message: 'Password changed successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error during password change.' });
    }
}
async function getMe(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                loginId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                firstLogin: true,
                role: true,
                companyName: true,
                jobPosition: true,
                department: true,
                manager: true,
                location: true,
                avatarUrl: true,
                dateOfJoining: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.json(user);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error fetching user.' });
    }
}
