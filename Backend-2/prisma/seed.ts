import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Cleaning all dummy records and initializing clean system...');

  // Clean up all existing data in reverse dependency order
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveAllocation.deleteMany();
  await prisma.salaryComponent.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.pFConfiguration.deleteMany();
  await prisma.taxConfiguration.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();

  const defaultPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Create Initial System Administrator
  const adminEmp = await prisma.employee.create({
    data: {
      employeeCode: 'ADM001',
      firstName: 'Sarah',
      lastName: 'Connor',
      fullName: 'Sarah Connor',
      company: 'Dayflow Technologies',
      department: 'Human Resources',
      jobPosition: 'HR Director',
      location: 'Bangalore, India',
      email: 'admin@dayflow.com',
      phone: '+91 9876543210',
      joiningDate: new Date('2024-01-01')
    }
  });

  await prisma.user.create({
    data: {
      loginId: 'ADM001',
      email: 'admin@dayflow.com',
      passwordHash: hashedPassword,
      role: 'ADMIN_HR',
      firstLogin: false,
      employeeId: adminEmp.id
    }
  });

  // 2. Create System Leave Types
  await prisma.leaveType.createMany({
    data: [
      {
        name: 'Paid Leave',
        allocation: 18,
        requiresAttachment: false,
        paid: true
      },
      {
        name: 'Sick Leave',
        allocation: 12,
        requiresAttachment: true,
        paid: true
      },
      {
        name: 'Unpaid Leave',
        allocation: 30,
        requiresAttachment: false,
        paid: false
      }
    ]
  });

  console.log('✅ System initialized cleanly with 0 dummy records!');
  console.log('🔑 Admin Account: admin@dayflow.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during clean seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
