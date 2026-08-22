import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateLoginId } from '../utils/loginIdGenerator';
import { encrypt, decrypt, maskBankAccount } from '../utils/crypto';

export async function getEmployees(req: AuthRequest, res: Response) {
  try {
    const { search, department, status } = req.query;

    const where: any = {};

    if (search) {
      const queryStr = String(search).trim();
      where.OR = [
        { firstName: { contains: queryStr } },
        { lastName: { contains: queryStr } },
        { email: { contains: queryStr } },
        { loginId: { contains: queryStr } },
        { employeeCode: { contains: queryStr } },
      ];
    }

    if (department && department !== 'all') {
      where.department = String(department);
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        loginId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        jobPosition: true,
        department: true,
        location: true,
        avatarUrl: true,
        role: true,
        dateOfJoining: true,
        employeeCode: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendances = await prisma.attendance.findMany({
      where: { date: todayStr },
    });

    const attendanceMap = new Map<string, string>();
    todayAttendances.forEach((a) => {
      attendanceMap.set(a.employeeId, a.status);
    });

    const result = employees.map((emp) => {
      const todayStatus = attendanceMap.get(emp.id) || 'ABSENT';
      return {
        ...emp,
        todayStatus,
      };
    });

    if (status && status !== 'all') {
      const filtered = result.filter((emp) => emp.todayStatus === status);
      return res.json(filtered);
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ message: 'Something went wrong while loading employees.' });
  }
}

export async function getEmployeeById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const isSelf = currentUserId === id;
    const isAdmin = currentUserRole === 'ADMIN_HR';

    // Decrypt sensitive info for authorized view
    const plainBankAccount = decrypt(user.bankAccount) || user.bankAccount;
    const plainIfsc = decrypt(user.ifsc) || user.ifsc;
    const plainPan = decrypt(user.pan) || user.pan;
    const plainUan = decrypt(user.uan) || user.uan;
    const plainPersonalEmail = decrypt(user.personalEmail) || user.personalEmail;
    const plainAddress = decrypt(user.address) || user.address;

    const maskedAccount = maskBankAccount(user.bankAccount);

    if (!isAdmin && !isSelf) {
      // Return public info only
      return res.json({
        id: user.id,
        loginId: user.loginId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        jobPosition: user.jobPosition,
        department: user.department,
        manager: user.manager,
        location: user.location,
        avatarUrl: user.avatarUrl,
        role: user.role,
        skills: user.skills ? JSON.parse(user.skills) : [],
        certifications: user.certifications ? JSON.parse(user.certifications) : [],
        about: user.about,
        interests: user.interests,
        isRestricted: true,
      });
    }

    // Return full decrypted profile for authorized self or admin
    return res.json({
      ...user,
      bankAccount: maskedAccount,
      rawBankAccount: isAdmin ? plainBankAccount : undefined,
      ifsc: plainIfsc,
      pan: plainPan,
      uan: plainUan,
      personalEmail: plainPersonalEmail,
      address: plainAddress,
      skills: user.skills ? JSON.parse(user.skills) : [],
      certifications: user.certifications ? JSON.parse(user.certifications) : [],
      isRestricted: false,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error fetching employee profile.' });
  }
}

export async function createEmployee(req: AuthRequest, res: Response) {
  try {
    const {
      companyName,
      firstName,
      lastName,
      email,
      phone,
      password,
      jobPosition,
      department,
      manager,
      location,
      role,
      dateOfJoining,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'An employee with this email already exists.' });
    }

    const cName = companyName || 'Dayflow Technologies';
    const loginId = await generateLoginId(cName, firstName, lastName, dateOfJoining);
    const hashedPassword = await bcrypt.hash(password, 10);
    const empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = await prisma.user.create({
      data: {
        loginId,
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone: phone || '',
        password: hashedPassword,
        firstLogin: true,
        role: role || 'EMPLOYEE',
        companyName: cName,
        jobPosition: jobPosition || 'Software Engineer',
        department: department || 'Engineering',
        manager: manager || 'Admin HR',
        location: location || 'Headquarters',
        dateOfJoining: dateOfJoining || new Date().toISOString().split('T')[0],
        employeeCode: empCode,
        bankAccount: encrypt('123456789012'),
        bankName: 'HDFC Bank',
        ifsc: encrypt('HDFC0001234'),
        pan: encrypt('ABCDE1234F'),
        uan: encrypt('100900800700'),
        skills: JSON.stringify(['JavaScript', 'React', 'Communication']),
        certifications: JSON.stringify([
          { name: 'Certified Scrum Master', issuer: 'Scrum Alliance', year: '2025' },
        ]),
        about: 'Passionate team member dedicated to excellence in software development and collaboration.',
        interests: 'Technology, Problem Solving, Continuous Learning',
      },
    });

    // Create default leave allocation
    await prisma.leaveAllocation.create({
      data: {
        employeeId: newUser.id,
        paidAllocated: 15,
        paidUsed: 0,
        sickAllocated: 10,
        sickUsed: 0,
        unpaidAllocated: 5,
        unpaidUsed: 0,
        year: 2026,
      },
    });

    // Create default salary config
    await prisma.salaryConfig.create({
      data: {
        employeeId: newUser.id,
        monthlyWage: 60000,
        yearlyWage: 720000,
        workingDays: 22,
        breakHours: 1.0,
        basicSalary: 30000,
        hra: 15000,
        standardAllowance: 5000,
        performanceBonus: 5000,
        lta: 2500,
        fixedAllowance: 2500,
        employeePf: 1800,
        employerPf: 1800,
        professionalTax: 200,
      },
    });

    return res.status(201).json({
      message: 'Employee created successfully.',
      generatedLoginId: loginId,
      temporaryPassword: password,
      employee: {
        id: newUser.id,
        loginId: newUser.loginId,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error creating employee.' });
  }
}

export async function updateEmployee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    if (currentUserId !== id && currentUserRole !== 'ADMIN_HR') {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }

    const {
      firstName,
      lastName,
      phone,
      address,
      dob,
      nationality,
      personalEmail,
      gender,
      maritalStatus,
      about,
      interests,
      avatarUrl,
      jobPosition,
      department,
      manager,
      location,
    } = req.body;

    const dataToUpdate: any = {};
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (address !== undefined) dataToUpdate.address = encrypt(address);
    if (dob !== undefined) dataToUpdate.dob = dob;
    if (nationality !== undefined) dataToUpdate.nationality = nationality;
    if (personalEmail !== undefined) dataToUpdate.personalEmail = encrypt(personalEmail);
    if (gender !== undefined) dataToUpdate.gender = gender;
    if (maritalStatus !== undefined) dataToUpdate.maritalStatus = maritalStatus;
    if (about !== undefined) dataToUpdate.about = about;
    if (interests !== undefined) dataToUpdate.interests = interests;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;

    if (currentUserRole === 'ADMIN_HR') {
      if (firstName !== undefined) dataToUpdate.firstName = firstName;
      if (lastName !== undefined) dataToUpdate.lastName = lastName;
      if (jobPosition !== undefined) dataToUpdate.jobPosition = jobPosition;
      if (department !== undefined) dataToUpdate.department = department;
      if (manager !== undefined) dataToUpdate.manager = manager;
      if (location !== undefined) dataToUpdate.location = location;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return res.json({
      message: 'Profile updated successfully.',
      employee: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
}

export async function addSkill(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { skill } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const existingSkills: string[] = user.skills ? JSON.parse(user.skills) : [];
    if (skill && !existingSkills.includes(skill)) {
      existingSkills.push(skill);
      await prisma.user.update({
        where: { id },
        data: { skills: JSON.stringify(existingSkills) },
      });
    }

    return res.json({ message: 'Skill added.', skills: existingSkills });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error adding skill.' });
  }
}

export async function addCertification(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, issuer, year } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const existingCerts: any[] = user.certifications ? JSON.parse(user.certifications) : [];
    if (name && issuer) {
      existingCerts.push({ name, issuer, year: year || '2026' });
      await prisma.user.update({
        where: { id },
        data: { certifications: JSON.stringify(existingCerts) },
      });
    }

    return res.json({ message: 'Certification added.', certifications: existingCerts });
  } catch (error: any) {
    return res.status(500).json({ message: 'Server error adding certification.' });
  }
}
