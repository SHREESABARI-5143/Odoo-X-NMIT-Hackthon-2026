"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payrollController_1 = require("../controllers/payrollController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/dashboard', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, payrollController_1.getPayrollDashboard);
exports.default = router;
