"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const leaveRoutes_1 = __importDefault(require("./routes/leaveRoutes"));
const salaryRoutes_1 = __importDefault(require("./routes/salaryRoutes"));
const payrollRoutes_1 = __importDefault(require("./routes/payrollRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Register API routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/employees', employeeRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
app.use('/api/leaves', leaveRoutes_1.default);
app.use('/api/salary', salaryRoutes_1.default);
app.use('/api/payroll', payrollRoutes_1.default);
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/company', companyRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', system: 'Dayflow HRMS API' });
});
exports.default = app;
