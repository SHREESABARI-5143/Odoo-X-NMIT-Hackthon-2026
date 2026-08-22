import { PrismaClient, Role, EmployeeStatus, DocumentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clean existing data ─────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.employeeSkill.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.securityInfo.deleteMany();
  await prisma.privateInfo.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.company.deleteMany();
  await prisma.loginIdCounter.deleteMany();

  // ─── Company ─────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: 'Odoo Inc',
      logoUrl: null,
      defaultWorkingDays: 5,
      defaultBreakHours: 1.0,
    },
  });
  console.log('✅ Company created:', company.name);

  // ─── Skills ──────────────────────────────────────────────
  const skills = await Promise.all([
    prisma.skill.create({ data: { name: 'JavaScript' } }),
    prisma.skill.create({ data: { name: 'TypeScript' } }),
    prisma.skill.create({ data: { name: 'Python' } }),
    prisma.skill.create({ data: { name: 'React' } }),
    prisma.skill.create({ data: { name: 'Node.js' } }),
    prisma.skill.create({ data: { name: 'PostgreSQL' } }),
    prisma.skill.create({ data: { name: 'Docker' } }),
    prisma.skill.create({ data: { name: 'AWS' } }),
  ]);
  console.log('✅ Skills created:', skills.length);

  // ─── Login ID Counter ────────────────────────────────────
  await prisma.loginIdCounter.create({
    data: { year: 2026, serial: 4 }, // 4 employees will be seeded
  });

  // ─── Hash passwords ──────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
  const empPassword1Hash = await bcrypt.hash('Temp@1234', 12);
  const empPassword2Hash = await bcrypt.hash('Temp@5678', 12);
  const empPassword3Hash = await bcrypt.hash('Temp@9012', 12);

  // ─── Admin — HR Admin ────────────────────────────────────
  const adminEmployee = await prisma.employee.create({
    data: {
      employeeCode: 'OIHR20260001',
      firstName: 'HR',
      lastName: 'Admin',
      fullName: 'HR Admin',
      company: 'Odoo Inc',
      department: 'Human Resources',
      jobPosition: 'HR Manager',
      manager: null,
      location: 'Bangalore',
      email: 'hr.admin@odoo.com',
      phone: '+91-9876543210',
      joiningDate: new Date('2026-01-15'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      loginId: 'OIHR20260001',
      email: 'hr.admin@odoo.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN_HR,
      firstLogin: false,
      employeeId: adminEmployee.id,
    },
  });

  await prisma.privateInfo.create({
    data: {
      employeeId: adminEmployee.id,
      dateOfBirth: new Date('1985-06-15'),
      address: '42 MG Road, Bangalore 560001',
      nationality: 'Indian',
      personalEmail: 'hr.admin.personal@gmail.com',
      gender: 'Female',
      maritalStatus: 'Married',
    },
  });

  await prisma.securityInfo.create({
    data: {
      employeeId: adminEmployee.id,
      bankDetails: 'HDFC Bank',
      accountNumber: '50100012345678',
      bankName: 'HDFC Bank',
      ifsc: 'HDFC0001234',
      pan: 'ABCDE1234F',
      uan: '100012345678',
      employeeCode: 'OIHR20260001',
    },
  });

  await prisma.resume.create({
    data: {
      employeeId: adminEmployee.id,
      about: 'Experienced HR professional with 10+ years in tech companies.',
      jobDescription: 'Managing HR operations, recruitment, and employee welfare.',
      interests: 'Organizational development, Employee engagement',
    },
  });

  console.log('✅ Admin created: OIHR20260001 / Admin@1234');

  // ─── Employee 1: John Doe ────────────────────────────────
  const johnEmployee = await prisma.employee.create({
    data: {
      employeeCode: 'OIJO20260002',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      company: 'Odoo Inc',
      department: 'Engineering',
      jobPosition: 'Senior Developer',
      manager: 'HR Admin',
      location: 'Bangalore',
      email: 'john.doe@odoo.com',
      phone: '+91-9876543211',
      joiningDate: new Date('2026-03-01'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      loginId: 'OIJO20260002',
      email: 'john.doe@odoo.com',
      passwordHash: empPassword1Hash,
      role: Role.EMPLOYEE,
      firstLogin: true,
      employeeId: johnEmployee.id,
    },
  });

  await prisma.privateInfo.create({
    data: {
      employeeId: johnEmployee.id,
      dateOfBirth: new Date('1992-08-22'),
      address: '15 Koramangala, Bangalore 560034',
      nationality: 'Indian',
      personalEmail: 'johndoe.personal@gmail.com',
      gender: 'Male',
      maritalStatus: 'Single',
    },
  });

  await prisma.securityInfo.create({
    data: {
      employeeId: johnEmployee.id,
      bankDetails: 'ICICI Bank',
      accountNumber: '00601050012345',
      bankName: 'ICICI Bank',
      ifsc: 'ICIC0000601',
      pan: 'FGHIJ5678K',
      uan: '100098765432',
      employeeCode: 'OIJO20260002',
    },
  });

  await prisma.resume.create({
    data: {
      employeeId: johnEmployee.id,
      about: 'Full-stack developer with expertise in React and Node.js.',
      jobDescription: 'Building scalable web applications and mentoring junior developers.',
      interests: 'Open source, AI/ML, Cloud computing',
    },
  });

  // John's skills
  await prisma.employeeSkill.createMany({
    data: [
      { employeeId: johnEmployee.id, skillId: skills[0].id }, // JavaScript
      { employeeId: johnEmployee.id, skillId: skills[1].id }, // TypeScript
      { employeeId: johnEmployee.id, skillId: skills[3].id }, // React
      { employeeId: johnEmployee.id, skillId: skills[4].id }, // Node.js
    ],
  });

  // John's certifications
  await prisma.certification.createMany({
    data: [
      {
        employeeId: johnEmployee.id,
        name: 'AWS Certified Solutions Architect',
        issuingOrganization: 'Amazon Web Services',
        issueDate: new Date('2025-06-15'),
        expiryDate: new Date('2028-06-15'),
      },
      {
        employeeId: johnEmployee.id,
        name: 'Meta Frontend Developer Certificate',
        issuingOrganization: 'Meta',
        issueDate: new Date('2024-12-01'),
        expiryDate: null,
      },
    ],
  });

  console.log('✅ Employee created: John Doe (OIJO20260002 / Temp@1234)');

  // ─── Employee 2: Jane Smith ──────────────────────────────
  const janeEmployee = await prisma.employee.create({
    data: {
      employeeCode: 'OIJA20260003',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      company: 'Odoo Inc',
      department: 'Engineering',
      jobPosition: 'Product Manager',
      manager: 'HR Admin',
      location: 'Mumbai',
      email: 'jane.smith@odoo.com',
      phone: '+91-9876543212',
      joiningDate: new Date('2026-04-15'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      loginId: 'OIJA20260003',
      email: 'jane.smith@odoo.com',
      passwordHash: empPassword2Hash,
      role: Role.EMPLOYEE,
      firstLogin: true,
      employeeId: janeEmployee.id,
    },
  });

  await prisma.privateInfo.create({
    data: {
      employeeId: janeEmployee.id,
      dateOfBirth: new Date('1990-11-05'),
      address: '78 Andheri West, Mumbai 400058',
      nationality: 'Indian',
      personalEmail: 'janesmith.personal@gmail.com',
      gender: 'Female',
      maritalStatus: 'Married',
    },
  });

  await prisma.securityInfo.create({
    data: {
      employeeId: janeEmployee.id,
      bankDetails: 'SBI',
      accountNumber: '32145678901234',
      bankName: 'State Bank of India',
      ifsc: 'SBIN0001234',
      pan: 'KLMNO9012P',
      uan: '100076543210',
      employeeCode: 'OIJA20260003',
    },
  });

  await prisma.resume.create({
    data: {
      employeeId: janeEmployee.id,
      about: 'Product manager with a passion for user-centric design.',
      jobDescription: 'Leading product strategy and cross-functional team collaboration.',
      interests: 'UX Research, Data Analytics, Agile methodologies',
    },
  });

  // Jane's skills
  await prisma.employeeSkill.createMany({
    data: [
      { employeeId: janeEmployee.id, skillId: skills[2].id }, // Python
      { employeeId: janeEmployee.id, skillId: skills[5].id }, // PostgreSQL
      { employeeId: janeEmployee.id, skillId: skills[7].id }, // AWS
    ],
  });

  // Jane's certifications
  await prisma.certification.create({
    data: {
      employeeId: janeEmployee.id,
      name: 'Certified Scrum Product Owner',
      issuingOrganization: 'Scrum Alliance',
      issueDate: new Date('2025-09-01'),
      expiryDate: new Date('2027-09-01'),
    },
  });

  console.log('✅ Employee created: Jane Smith (OIJA20260003 / Temp@5678)');

  // ─── Employee 3: Alex Kumar ──────────────────────────────
  const alexEmployee = await prisma.employee.create({
    data: {
      employeeCode: 'OIAL20260004',
      firstName: 'Alex',
      lastName: 'Kumar',
      fullName: 'Alex Kumar',
      company: 'Odoo Inc',
      department: 'DevOps',
      jobPosition: 'DevOps Engineer',
      manager: 'HR Admin',
      location: 'Hyderabad',
      email: 'alex.kumar@odoo.com',
      phone: '+91-9876543213',
      joiningDate: new Date('2026-05-20'),
      status: EmployeeStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      loginId: 'OIAL20260004',
      email: 'alex.kumar@odoo.com',
      passwordHash: empPassword3Hash,
      role: Role.EMPLOYEE,
      firstLogin: true,
      employeeId: alexEmployee.id,
    },
  });

  await prisma.privateInfo.create({
    data: {
      employeeId: alexEmployee.id,
      dateOfBirth: new Date('1995-02-28'),
      address: '23 Hitech City, Hyderabad 500081',
      nationality: 'Indian',
      personalEmail: 'alexkumar.personal@gmail.com',
      gender: 'Male',
      maritalStatus: 'Single',
    },
  });

  await prisma.securityInfo.create({
    data: {
      employeeId: alexEmployee.id,
      bankDetails: 'Axis Bank',
      accountNumber: '91601234567890',
      bankName: 'Axis Bank',
      ifsc: 'UTIB0001234',
      pan: 'QRSTU3456V',
      uan: '100054321098',
      employeeCode: 'OIAL20260004',
    },
  });

  await prisma.resume.create({
    data: {
      employeeId: alexEmployee.id,
      about: 'DevOps engineer specializing in CI/CD pipelines and cloud infrastructure.',
      jobDescription: 'Managing deployment pipelines, infrastructure as code, and monitoring.',
      interests: 'Kubernetes, Terraform, Site Reliability Engineering',
    },
  });

  // Alex's skills
  await prisma.employeeSkill.createMany({
    data: [
      { employeeId: alexEmployee.id, skillId: skills[6].id }, // Docker
      { employeeId: alexEmployee.id, skillId: skills[7].id }, // AWS
      { employeeId: alexEmployee.id, skillId: skills[2].id }, // Python
      { employeeId: alexEmployee.id, skillId: skills[4].id }, // Node.js
    ],
  });

  // Alex's certifications
  await prisma.certification.createMany({
    data: [
      {
        employeeId: alexEmployee.id,
        name: 'Certified Kubernetes Administrator',
        issuingOrganization: 'Cloud Native Computing Foundation',
        issueDate: new Date('2025-03-10'),
        expiryDate: new Date('2028-03-10'),
      },
      {
        employeeId: alexEmployee.id,
        name: 'AWS Certified DevOps Engineer',
        issuingOrganization: 'Amazon Web Services',
        issueDate: new Date('2025-08-20'),
        expiryDate: new Date('2028-08-20'),
      },
    ],
  });

  console.log('✅ Employee created: Alex Kumar (OIAL20260004 / Temp@9012)');

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  console.log('  🌱 Seed completed successfully!');
  console.log('════════════════════════════════════════════');
  console.log('');
  console.log('  Seeded accounts:');
  console.log('  ─────────────────────────────────────────');
  console.log('  Admin:    OIHR20260001 / Admin@1234');
  console.log('  Employee: OIJO20260002 / Temp@1234  (John Doe)');
  console.log('  Employee: OIJA20260003 / Temp@5678  (Jane Smith)');
  console.log('  Employee: OIAL20260004 / Temp@9012  (Alex Kumar)');
  console.log('');
  console.log('  Employee passwords require change on first login.');
  console.log('════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
