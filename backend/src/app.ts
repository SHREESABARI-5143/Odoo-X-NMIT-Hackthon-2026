import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import salaryRoutes from './routes/salaryRoutes';
import payrollRoutes from './routes/payrollRoutes';
import documentRoutes from './routes/documentRoutes';
import companyRoutes from './routes/companyRoutes';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/company', companyRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'Dayflow HRMS API' });
});

export default app;
