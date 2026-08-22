import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import leaveRoutes from './routes/leave.routes';
import leaveAllocationRoutes from './routes/leaveAllocation.routes';
import salaryRoutes from './routes/salary.routes';
import payrollRoutes from './routes/payroll.routes';
import uploadRoutes from './routes/upload.routes';
import companyRoutes from './routes/company.routes';
import profileRoutes from './routes/profile.routes';

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root overview endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Dayflow HRMS — BE-2 API',
    status: 'ACTIVE',
    version: '1.0.0',
    documentation: {
      health: 'GET /health',
      auth: 'POST /auth/login',
      attendance: {
        checkIn: 'POST /attendance/check-in',
        checkOut: 'POST /attendance/check-out',
        myAttendance: 'GET /attendance/my?view=daily|weekly|monthly',
        adminAttendance: 'GET /attendance?view=daily|weekly|monthly'
      },
      timeOff: {
        request: 'POST /time-off',
        myRequests: 'GET /time-off/my',
        adminList: 'GET /time-off',
        approve: 'PUT /time-off/:id/approve',
        reject: 'PUT /time-off/:id/reject'
      },
      leaveAllocation: {
        list: 'GET /leave-allocation',
        update: 'PUT /leave-allocation'
      },
      salary: {
        getSalary: 'GET /employees/:id/salary',
        updateSalary: 'PUT /employees/:id/salary'
      },
      payroll: {
        dashboard: 'GET /payroll?month=8&year=2026',
        employeeDetail: 'GET /payroll/:employeeId?month=8&year=2026'
      },
      uploads: 'POST /upload/leave-attachment'
    }
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Dayflow HRMS BE-2 service is running.' });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);  // Employee list/detail (must come before salary)
app.use('/employees', salaryRoutes);    // Employee salary sub-routes
app.use('/attendance', attendanceRoutes);
app.use('/time-off', leaveRoutes);
app.use('/leave-allocation', leaveAllocationRoutes);
app.use('/payroll', payrollRoutes);
app.use('/upload', uploadRoutes);
app.use('/company', companyRoutes);
app.use('/', profileRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    message: err.message || 'Internal server error'
  });
});

export default app;
