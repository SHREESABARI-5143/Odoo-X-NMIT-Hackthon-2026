import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'dayflow_super_secret_jwt_key_2026';

export async function login(req: AuthRequest, res: Response) {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Invalid Login ID or password.' });
    }

    const user = await prisma.user.findFirst({
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

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid Login ID or password.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        role: user.role,
        firstLogin: user.firstLogin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error during login.' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        firstLogin: false,
      },
    });

    return res.json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error during password change.' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching user.' });
  }
}
