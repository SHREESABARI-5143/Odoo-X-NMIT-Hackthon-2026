"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const salaryController_1 = require("../controllers/salaryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/:employeeId', authMiddleware_1.authenticateToken, salaryController_1.getSalaryConfig);
router.put('/:employeeId', authMiddleware_1.authenticateToken, authMiddleware_1.requireAdmin, salaryController_1.updateSalaryConfig);
exports.default = router;
