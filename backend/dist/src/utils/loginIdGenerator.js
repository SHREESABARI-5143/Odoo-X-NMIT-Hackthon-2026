"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLoginId = generateLoginId;
const prisma_1 = require("./prisma");
async function generateLoginId(companyName, firstName, lastName, dateOfJoining) {
    const companyCode = (companyName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'DF').toUpperCase().padEnd(2, 'X');
    const fnCode = (firstName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'FN').toUpperCase().padEnd(2, 'X');
    const lnCode = (lastName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'LN').toUpperCase().padEnd(2, 'X');
    const joiningYear = dateOfJoining ? new Date(dateOfJoining).getFullYear().toString() : new Date().getFullYear().toString();
    // Find highest serial for this year
    const prefix = `${companyCode}${fnCode}${lnCode}${joiningYear}`;
    const count = await prisma_1.prisma.user.count();
    const serialNumber = (count + 1).toString().padStart(4, '0');
    return `${prefix}${serialNumber}`;
}
