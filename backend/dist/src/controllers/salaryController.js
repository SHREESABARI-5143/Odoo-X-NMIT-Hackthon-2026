"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalaryConfig = getSalaryConfig;
exports.updateSalaryConfig = updateSalaryConfig;
const prisma_1 = require("../utils/prisma");
async function getSalaryConfig(req, res) {
    try {
        const { employeeId } = req.params;
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;
        if (currentUserRole !== 'ADMIN_HR' && currentUserId !== employeeId) {
            return res.status(403).json({ message: 'You do not have permission to perform this action.' });
        }
        let config = await prisma_1.prisma.salaryConfig.findUnique({
            where: { employeeId },
        });
        if (!config) {
            config = await prisma_1.prisma.salaryConfig.create({
                data: {
                    employeeId,
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
        }
        const isReadOnly = currentUserRole !== 'ADMIN_HR';
        const componentsSum = config.basicSalary +
            config.hra +
            config.standardAllowance +
            config.performanceBonus +
            config.lta +
            config.fixedAllowance;
        const grossSalary = componentsSum;
        const totalDeductions = config.employeePf + config.professionalTax;
        const netSalary = Math.max(0, grossSalary - totalDeductions);
        return res.json({
            config: {
                ...config,
                grossSalary,
                totalDeductions,
                netSalary,
            },
            isReadOnly,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error fetching salary configuration.' });
    }
}
async function updateSalaryConfig(req, res) {
    try {
        const { employeeId } = req.params;
        const currentUserRole = req.user?.role;
        if (currentUserRole !== 'ADMIN_HR') {
            return res.status(403).json({ message: 'You do not have permission to perform this action.' });
        }
        const { monthlyWage, workingDays, breakHours, basicSalary, hra, standardAllowance, performanceBonus, lta, fixedAllowance, employeePf, employerPf, professionalTax, } = req.body;
        const targetMonthlyWage = Number(monthlyWage) || 60000;
        const bSalary = Number(basicSalary) || 0;
        const h = Number(hra) || 0;
        const sAllow = Number(standardAllowance) || 0;
        const pBonus = Number(performanceBonus) || 0;
        const l = Number(lta) || 0;
        const fAllow = Number(fixedAllowance) || 0;
        const componentsSum = bSalary + h + sAllow + pBonus + l + fAllow;
        // Backend rule: Salary components cannot exceed configured monthly wage
        if (componentsSum > targetMonthlyWage) {
            return res.status(400).json({ message: 'Salary components cannot exceed the configured wage.' });
        }
        const yearlyWage = targetMonthlyWage * 12;
        const updated = await prisma_1.prisma.salaryConfig.upsert({
            where: { employeeId },
            update: {
                monthlyWage: targetMonthlyWage,
                yearlyWage,
                workingDays: Number(workingDays) || 22,
                breakHours: Number(breakHours) || 1.0,
                basicSalary: bSalary,
                hra: h,
                standardAllowance: sAllow,
                performanceBonus: pBonus,
                lta: l,
                fixedAllowance: fAllow,
                employeePf: Number(employeePf) || 1800,
                employerPf: Number(employerPf) || 1800,
                professionalTax: Number(professionalTax) || 200,
            },
            create: {
                employeeId,
                monthlyWage: targetMonthlyWage,
                yearlyWage,
                workingDays: Number(workingDays) || 22,
                breakHours: Number(breakHours) || 1.0,
                basicSalary: bSalary,
                hra: h,
                standardAllowance: sAllow,
                performanceBonus: pBonus,
                lta: l,
                fixedAllowance: fAllow,
                employeePf: Number(employeePf) || 1800,
                employerPf: Number(employerPf) || 1800,
                professionalTax: Number(professionalTax) || 200,
            },
        });
        return res.json({
            message: 'Salary configuration updated.',
            config: updated,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error updating salary configuration.' });
    }
}
