import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

// In-memory / DB profile helpers for skills, certifications, documents
let skillsDb: Array<{ id: string; employeeId: string; name: string; level: string }> = [];
let certsDb: Array<{ id: string; employeeId: string; name: string; organization: string; issueDate: string; expiryDate?: string }> = [];
let docsDb: Array<{ id: string; employeeId: string; name: string; type: string; fileSize?: string; uploadedBy?: string; status: string; uploadedDate: string }> = [];

// ================= SKILLS =================
router.get('/skills', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.query as { employeeId?: string };
    const list = employeeId ? skillsDb.filter(s => s.employeeId === employeeId) : skillsDb;
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/skills', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, name, level } = req.body;
    const targetEmpId = employeeId || req.user?.employeeId;
    const newSkill = {
      id: 'S' + String(skillsDb.length + 1).padStart(3, '0'),
      employeeId: targetEmpId,
      name,
      level: level || 'Beginner'
    };
    skillsDb.push(newSkill);
    res.status(201).json(newSkill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/skills/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    skillsDb = skillsDb.filter(s => s.id !== id);
    res.json({ message: 'Skill deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= CERTIFICATIONS =================
router.get('/certifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.query as { employeeId?: string };
    const list = employeeId ? certsDb.filter(c => c.employeeId === employeeId) : certsDb;
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/certifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId, name, organization, issueDate, expiryDate } = req.body;
    const targetEmpId = employeeId || req.user?.employeeId;
    const newCert = {
      id: 'C' + String(certsDb.length + 1).padStart(3, '0'),
      employeeId: targetEmpId,
      name,
      organization,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || undefined
    };
    certsDb.push(newCert);
    res.status(201).json(newCert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/certifications/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    certsDb = certsDb.filter(c => c.id !== id);
    res.json({ message: 'Certification deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ================= DOCUMENTS =================
router.get('/employees/:id/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const list = docsDb.filter(d => d.employeeId === id);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/employees/:id/documents', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, fileSize } = req.body;
    const newDoc = {
      id: 'D' + String(docsDb.length + 1).padStart(3, '0'),
      employeeId: id,
      name: name || 'Document',
      type: type || 'ID_PROOF',
      fileSize: fileSize || '1.2 MB',
      uploadedBy: req.user?.email || 'User',
      status: 'APPROVED',
      uploadedDate: new Date().toISOString().split('T')[0]
    };
    docsDb.push(newDoc);
    res.status(201).json(newDoc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/documents/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    docsDb = docsDb.filter(d => d.id !== id);
    res.json({ message: 'Document deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
