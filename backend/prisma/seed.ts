import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encrypt } from '../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Dayflow HRMS database...');

  // 1. Company Settings
  await prisma.companySettings.deleteMany();
  await prisma.companySettings.create({
    data: {
      companyName: 'Emplora Technologies',
      workingDays: 5,
      breakHours: 1.0,
      defaultPaidLeave: 15,
      defaultSickLeave: 10,
      defaultUnpaidLeave: 5,
      pfPercentage: 12,
      professionalTaxAmount: 200,
    },
  });

  // Clean existing data
  await prisma.document.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveAllocation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.salaryConfig.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 2. Admin User
  const admin = await prisma.user.create({
    data: {
      loginId: 'DFADAD20260001',
      firstName: 'Admin',
      lastName: 'HR Officer',
      email: 'admin@dayflow.com',
      phone: '+1 555-0192',
      password: defaultPasswordHash,
      firstLogin: false,
      role: 'ADMIN_HR',
      companyName: 'Emplora Technologies',
      jobPosition: 'Head of People & HR Operations',
      department: 'Human Resources',
      manager: 'Executive Board',
      location: 'San Francisco HQ',
      dateOfJoining: '2024-01-15',
      employeeCode: 'EMP-1001',
      bankAccount: encrypt('987654321098'),
      bankName: 'Silicon Valley Bank',
      ifsc: encrypt('SVBK0001234'),
      pan: encrypt('ADMIN1234P'),
      uan: encrypt('100000000001'),
      about: 'Leading HR and talent operations at Dayflow Technologies.',
      skills: JSON.stringify(['HR Operations', 'Talent Acquisition', 'Payroll', 'Compliance']),
      certifications: JSON.stringify([{ name: 'SHRM-SCP', issuer: 'SHRM', year: '2023' }]),
    },
  });

  // 3. Employee 1: John Doe
  const john = await prisma.user.create({
    data: {
      loginId: 'OIJO20260001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@dayflow.com',
      phone: '+1 555-0101',
      password: defaultPasswordHash,
      firstLogin: false,
      role: 'EMPLOYEE',
      companyName: 'Dayflow Technologies',
      jobPosition: 'Senior Full Stack Engineer',
      department: 'Engineering',
      manager: 'Admin HR Officer',
      location: 'San Francisco HQ',
      dateOfJoining: '2025-03-01',
      employeeCode: 'EMP-2001',
      bankAccount: encrypt('123456789012'),
      bankName: 'Chase Bank',
      ifsc: encrypt('CHAS0009876'),
      pan: encrypt('ABCDE1234F'),
      uan: encrypt('100900800701'),
      dob: '1992-06-15',
      address: encrypt('742 Evergreen Terrace, San Francisco, CA'),
      nationality: 'American',
      personalEmail: encrypt('john.doe.personal@gmail.com'),
      gender: 'Male',
      maritalStatus: 'Married',
      about: 'Passionate about building scalable backend services and responsive frontends.',
      interests: 'Open Source, Photography, Hiking',
      skills: JSON.stringify(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS']),
      certifications: JSON.stringify([
        { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', year: '2024' },
        { name: 'Professional Scrum Master I', issuer: 'Scrum.org', year: '2023' },
      ]),
    },
  });

  // 4. Employee 2: Jane Smith (First login = true)
  const jane = await prisma.user.create({
    data: {
      loginId: 'OIJASM20260002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@dayflow.com',
      phone: '+1 555-0102',
      password: defaultPasswordHash,
      firstLogin: true,
      role: 'EMPLOYEE',
      companyName: 'Dayflow Technologies',
      jobPosition: 'Product Designer',
      department: 'Design',
      manager: 'Admin HR Officer',
      location: 'New York Remote',
      dateOfJoining: '2026-01-10',
      employeeCode: 'EMP-2002',
      bankAccount: encrypt('234567890123'),
      bankName: 'Bank of America',
      ifsc: encrypt('BOFA0004321'),
      pan: encrypt('XYZPS5678G'),
      uan: encrypt('100900800702'),
      dob: '1995-11-20',
      address: encrypt('100 Broadway Ave, New York, NY'),
      nationality: 'American',
      personalEmail: encrypt('jane.smith.design@gmail.com'),
      gender: 'Female',
      maritalStatus: 'Single',
      about: 'Crafting modern human-centered user experiences and enterprise visual identities.',
      interests: 'UI/UX Design, Typography, Motion Graphics',
      skills: JSON.stringify(['Figma', 'User Research', 'Design Systems', 'Prototyping', 'CSS']),
      certifications: JSON.stringify([
        { name: 'Google UX Design Professional Certificate', issuer: 'Coursera', year: '2024' },
      ]),
    },
  });

  // 5. Employee 3: Alex Wong
  const alex = await prisma.user.create({
    data: {
      loginId: 'OIALWO20260003',
      firstName: 'Alex',
      lastName: 'Wong',
      email: 'alex.wong@dayflow.com',
      phone: '+1 555-0103',
      password: defaultPasswordHash,
      firstLogin: false,
      role: 'EMPLOYEE',
      companyName: 'Dayflow Technologies',
      jobPosition: 'QA Lead & Automation Engineer',
      department: 'Engineering',
      manager: 'John Doe',
      location: 'San Francisco HQ',
      dateOfJoining: '2025-08-15',
      employeeCode: 'EMP-2003',
      bankAccount: encrypt('345678901234'),
      bankName: 'Wells Fargo',
      ifsc: encrypt('WFGO0007788'),
      pan: encrypt('ALEXW9876K'),
      uan: encrypt('100900800703'),
      dob: '1993-04-10',
      address: encrypt('500 Market St, San Francisco, CA'),
      nationality: 'American',
      personalEmail: encrypt('alex.wong.qa@gmail.com'),
      gender: 'Male',
      maritalStatus: 'Single',
      about: 'Dedicated to ensuring seamless performance, accessibility, and zero-bug releases.',
      interests: 'Automated Testing, Security, Cyber-fiction',
      skills: JSON.stringify(['Playwright', 'Jest', 'Cypress', 'API Testing', 'TypeScript']),
      certifications: JSON.stringify([{ name: 'ISTQB Certified Tester', issuer: 'ISTQB', year: '2023' }]),
    },
  });

  // 6. Leave Allocations
  await prisma.leaveAllocation.createMany({
    data: [
      { employeeId: admin.id, paidAllocated: 20, paidUsed: 2, sickAllocated: 12, sickUsed: 0, unpaidAllocated: 5, unpaidUsed: 0, year: 2026 },
      { employeeId: john.id, paidAllocated: 15, paidUsed: 3, sickAllocated: 10, sickUsed: 1, unpaidAllocated: 5, unpaidUsed: 0, year: 2026 },
      { employeeId: jane.id, paidAllocated: 15, paidUsed: 0, sickAllocated: 10, sickUsed: 0, unpaidAllocated: 5, unpaidUsed: 0, year: 2026 },
      { employeeId: alex.id, paidAllocated: 15, paidUsed: 1, sickAllocated: 10, sickUsed: 2, unpaidAllocated: 5, unpaidUsed: 0, year: 2026 },
    ],
  });

  // 7. Salary Configurations
  await prisma.salaryConfig.createMany({
    data: [
      {
        employeeId: admin.id,
        monthlyWage: 120000,
        yearlyWage: 1440000,
        workingDays: 22,
        breakHours: 1.0,
        basicSalary: 60000,
        hra: 30000,
        standardAllowance: 10000,
        performanceBonus: 10000,
        lta: 5000,
        fixedAllowance: 5000,
        employeePf: 1800,
        employerPf: 1800,
        professionalTax: 200,
      },
      {
        employeeId: john.id,
        monthlyWage: 85000,
        yearlyWage: 1020000,
        workingDays: 22,
        breakHours: 1.0,
        basicSalary: 42500,
        hra: 21250,
        standardAllowance: 7250,
        performanceBonus: 6000,
        lta: 4000,
        fixedAllowance: 4000,
        employeePf: 1800,
        employerPf: 1800,
        professionalTax: 200,
      },
      {
        employeeId: jane.id,
        monthlyWage: 75000,
        yearlyWage: 900000,
        workingDays: 22,
        breakHours: 1.0,
        basicSalary: 37500,
        hra: 18750,
        standardAllowance: 6750,
        performanceBonus: 5000,
        lta: 3500,
        fixedAllowance: 3500,
        employeePf: 1800,
        employerPf: 1800,
        professionalTax: 200,
      },
      {
        employeeId: alex.id,
        monthlyWage: 65000,
        yearlyWage: 780000,
        workingDays: 22,
        breakHours: 1.0,
        basicSalary: 32500,
        hra: 16250,
        standardAllowance: 6250,
        performanceBonus: 4000,
        lta: 3000,
        fixedAllowance: 3000,
        employeePf: 1800,
        employerPf: 1800,
        professionalTax: 200,
      },
    ],
  });

  // 8. Attendance Records (covering PRESENT, HALF_DAY, ON_LEAVE, ABSENT)
  const todayStr = new Date().toISOString().split('T')[0];
  const dates = [];
  for (let i = 1; i <= 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Today check-in for John
  await prisma.attendance.create({
    data: {
      employeeId: john.id,
      date: todayStr,
      checkIn: '09:14 AM',
      checkOut: null,
      status: 'PRESENT',
    },
  });

  // Past attendances for John
  await prisma.attendance.createMany({
    data: [
      { employeeId: john.id, date: dates[0], checkIn: '09:00 AM', checkOut: '05:30 PM', workHoursMins: 510, extraHoursMins: 30, status: 'PRESENT' },
      { employeeId: john.id, date: dates[1], checkIn: '09:30 AM', checkOut: '01:15 PM', workHoursMins: 225, extraHoursMins: 0, status: 'HALF_DAY' },
      { employeeId: john.id, date: dates[2], checkIn: null, checkOut: null, workHoursMins: 0, extraHoursMins: 0, status: 'ON_LEAVE' },
      { employeeId: john.id, date: dates[3], checkIn: null, checkOut: null, workHoursMins: 0, extraHoursMins: 0, status: 'ABSENT' },
    ],
  });

  // Past attendances for Alex
  await prisma.attendance.createMany({
    data: [
      { employeeId: alex.id, date: todayStr, checkIn: '08:45 AM', checkOut: null, status: 'PRESENT' },
      { employeeId: alex.id, date: dates[0], checkIn: '09:05 AM', checkOut: '05:45 PM', workHoursMins: 520, extraHoursMins: 40, status: 'PRESENT' },
      { employeeId: alex.id, date: dates[1], checkIn: '10:00 AM', checkOut: '01:30 PM', workHoursMins: 210, extraHoursMins: 0, status: 'HALF_DAY' },
    ],
  });

  // 9. Leave Requests (Approved with comment, Rejected with comment, Pending)
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: john.id,
        leaveType: 'Paid',
        startDate: dates[2],
        endDate: dates[2],
        duration: 1.0,
        reason: 'Personal family emergency.',
        status: 'APPROVED',
        rejectionComment: 'Approved. Take care!',
        approvedById: admin.id,
      },
      {
        employeeId: john.id,
        leaveType: 'Sick',
        startDate: dates[6],
        endDate: dates[6],
        duration: 1.0,
        reason: 'Doctor appointment & fever.',
        status: 'REJECTED',
        rejectionComment: 'Please reschedule to a day without major client delivery.',
        approvedById: admin.id,
      },
      {
        employeeId: alex.id,
        leaveType: 'Paid',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        duration: 3.0,
        reason: 'Annual vacation trip.',
        status: 'PENDING',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('  Admin User:     admin@dayflow.com  / Password@123 (Login ID: DFADAD20260001)');
  console.log('  Employee 1:     john.doe@dayflow.com / Password@123 (Login ID: OIJO20260001)');
  console.log('  Employee 2:     jane.smith@dayflow.com / Password@123 (Login ID: OIJASM20260002 - First login)');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
