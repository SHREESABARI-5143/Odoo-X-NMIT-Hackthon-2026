"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIn = checkIn;
exports.checkOut = checkOut;
exports.getTodayAttendance = getTodayAttendance;
exports.getAttendanceHistory = getAttendanceHistory;
const prisma_1 = require("../utils/prisma");
function formatTimeString(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}
function parseTimeToMinutes(timeStr) {
    if (!timeStr)
        return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match)
        return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours < 12)
        hours += 12;
    if (ampm === 'AM' && hours === 12)
        hours = 0;
    return hours * 60 + minutes;
}
async function checkIn(req, res) {
    try {
        const employeeId = req.user?.id;
        if (!employeeId)
            return res.status(401).json({ message: 'Unauthorized' });
        const todayStr = new Date().toISOString().split('T')[0];
        const nowTimeStr = formatTimeString(new Date());
        // Check if approved leave exists for today
        const approvedLeave = await prisma_1.prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: { lte: todayStr },
                endDate: { gte: todayStr },
            },
        });
        let existing = await prisma_1.prisma.attendance.findFirst({
            where: { employeeId, date: todayStr },
        });
        if (existing && existing.checkIn && !existing.checkOut) {
            return res.status(400).json({ message: 'You are already checked in for today.' });
        }
        const initialStatus = approvedLeave ? 'ON_LEAVE' : 'PRESENT';
        if (existing) {
            existing = await prisma_1.prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    checkIn: nowTimeStr,
                    checkOut: null,
                    status: initialStatus,
                },
            });
        }
        else {
            existing = await prisma_1.prisma.attendance.create({
                data: {
                    employeeId,
                    date: todayStr,
                    checkIn: nowTimeStr,
                    status: initialStatus,
                },
            });
        }
        return res.json({
            message: 'Checked in successfully.',
            attendance: existing,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error during check-in.' });
    }
}
async function checkOut(req, res) {
    try {
        const employeeId = req.user?.id;
        if (!employeeId)
            return res.status(401).json({ message: 'Unauthorized' });
        const todayStr = new Date().toISOString().split('T')[0];
        const nowTimeStr = formatTimeString(new Date());
        const existing = await prisma_1.prisma.attendance.findFirst({
            where: { employeeId, date: todayStr },
        });
        if (!existing || !existing.checkIn) {
            return res.status(400).json({ message: 'You must check in first before checking out.' });
        }
        const startMins = parseTimeToMinutes(existing.checkIn);
        const endMins = parseTimeToMinutes(nowTimeStr);
        const totalMins = Math.max(0, endMins - startMins);
        const extraMins = totalMins > 480 ? totalMins - 480 : 0; // Standard 8 hours = 480 mins
        // Half-day threshold = 4 hours (240 mins)
        let finalStatus = 'PRESENT';
        if (existing.status === 'ON_LEAVE') {
            finalStatus = 'ON_LEAVE';
        }
        else if (totalMins < 240) {
            finalStatus = 'HALF_DAY';
        }
        else {
            finalStatus = 'PRESENT';
        }
        const updated = await prisma_1.prisma.attendance.update({
            where: { id: existing.id },
            data: {
                checkOut: nowTimeStr,
                workHoursMins: totalMins,
                extraHoursMins: extraMins,
                status: finalStatus,
            },
        });
        return res.json({
            message: 'Checked out successfully.',
            attendance: updated,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error during check-out.' });
    }
}
async function getTodayAttendance(req, res) {
    try {
        const employeeId = req.user?.id;
        if (!employeeId)
            return res.status(401).json({ message: 'Unauthorized' });
        const todayStr = new Date().toISOString().split('T')[0];
        const attendance = await prisma_1.prisma.attendance.findFirst({
            where: { employeeId, date: todayStr },
        });
        const leave = await prisma_1.prisma.leaveRequest.findFirst({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: { lte: todayStr },
                endDate: { gte: todayStr },
            },
        });
        return res.json({
            todayStr,
            attendance,
            isOnLeave: !!leave,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error fetching today attendance.' });
    }
}
async function getAttendanceHistory(req, res) {
    try {
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;
        const { employeeId, view, month, year } = req.query;
        let targetEmployeeId = currentUserId;
        if (currentUserRole === 'ADMIN_HR' && employeeId && employeeId !== 'all') {
            targetEmployeeId = String(employeeId);
        }
        const where = {};
        if (currentUserRole !== 'ADMIN_HR' || (employeeId && employeeId !== 'all')) {
            where.employeeId = targetEmployeeId;
        }
        const records = await prisma_1.prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' },
            take: 100,
        });
        // Map employee details if admin view
        const userIds = [...new Set(records.map((r) => r.employeeId))];
        const users = await prisma_1.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true, loginId: true, department: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const formattedRecords = records.map((r) => {
            const user = userMap.get(r.employeeId);
            const hours = Math.floor(r.workHoursMins / 60);
            const mins = r.workHoursMins % 60;
            const extraHours = Math.floor(r.extraHoursMins / 60);
            const extraMins = r.extraHoursMins % 60;
            return {
                ...r,
                employeeName: user ? `${user.firstName} ${user.lastName}` : 'Employee',
                employeeLoginId: user ? user.loginId : '',
                department: user ? user.department : '',
                workHoursFormatted: `${hours}h ${mins}m`,
                extraHoursFormatted: `${extraHours}h ${extraMins}m`,
            };
        });
        // Compute summary stats
        const totalDays = formattedRecords.length;
        const daysPresent = formattedRecords.filter((r) => r.status === 'PRESENT').length;
        const halfDays = formattedRecords.filter((r) => r.status === 'HALF_DAY').length;
        const leaveCount = formattedRecords.filter((r) => r.status === 'ON_LEAVE').length;
        const absentCount = formattedRecords.filter((r) => r.status === 'ABSENT').length;
        const totalWorkedMins = formattedRecords.reduce((acc, r) => acc + r.workHoursMins, 0);
        const totalExtraMins = formattedRecords.reduce((acc, r) => acc + r.extraHoursMins, 0);
        return res.json({
            records: formattedRecords,
            summary: {
                totalDays,
                daysPresent,
                halfDays,
                leaveCount,
                absentCount,
                totalWorkedFormatted: `${Math.floor(totalWorkedMins / 60)}h ${totalWorkedMins % 60}m`,
                totalExtraFormatted: `${Math.floor(totalExtraMins / 60)}h ${totalExtraMins % 60}m`,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error fetching attendance history.' });
    }
}
