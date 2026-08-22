"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = uploadDocument;
exports.getEmployeeDocuments = getEmployeeDocuments;
exports.downloadDocument = downloadDocument;
exports.deleteDocument = deleteDocument;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../utils/prisma");
async function uploadDocument(req, res) {
    try {
        const uploadedById = req.user?.id;
        if (!uploadedById)
            return res.status(401).json({ message: 'Unauthorized' });
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const { employeeId, name, type } = req.body;
        const targetEmployeeId = employeeId || uploadedById;
        // Check permission: if target isn't self, must be admin
        if (targetEmployeeId !== uploadedById && req.user?.role !== 'ADMIN_HR') {
            return res.status(403).json({ message: 'You do not have permission to perform this action.' });
        }
        const fileUrl = `/uploads/${file.filename}`;
        const document = await prisma_1.prisma.document.create({
            data: {
                employeeId: targetEmployeeId,
                name: name || file.originalname,
                type: type || 'Other',
                fileUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedById,
            },
        });
        return res.status(201).json({
            message: 'Document uploaded successfully.',
            document,
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error uploading document.' });
    }
}
async function getEmployeeDocuments(req, res) {
    try {
        const { employeeId } = req.params;
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;
        if (currentUserId !== employeeId && currentUserRole !== 'ADMIN_HR') {
            return res.status(403).json({ message: 'You do not have permission to perform this action.' });
        }
        const documents = await prisma_1.prisma.document.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(documents);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error fetching documents.' });
    }
}
async function downloadDocument(req, res) {
    try {
        const { id } = req.params;
        const document = await prisma_1.prisma.document.findUnique({ where: { id } });
        if (!document)
            return res.status(404).json({ message: 'Document not found.' });
        const filePath = path_1.default.join(__dirname, '../../', document.fileUrl);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ message: 'File asset not found on server.' });
        }
        return res.download(filePath, document.name);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error downloading document.' });
    }
}
async function deleteDocument(req, res) {
    try {
        const { id } = req.params;
        const currentUserRole = req.user?.role;
        if (currentUserRole !== 'ADMIN_HR') {
            return res.status(403).json({ message: 'You do not have permission to perform this action.' });
        }
        const document = await prisma_1.prisma.document.findUnique({ where: { id } });
        if (!document)
            return res.status(404).json({ message: 'Document not found.' });
        const filePath = path_1.default.join(__dirname, '../../', document.fileUrl);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        await prisma_1.prisma.document.delete({ where: { id } });
        return res.json({ message: 'Document deleted.' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error deleting document.' });
    }
}
