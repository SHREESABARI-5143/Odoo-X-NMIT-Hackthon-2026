import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { 
  Employee, Salary, Skill, Certification, Document, LeaveAllocation 
} from '../types';
import { 
  User as UserIcon, FileText, Award, Shield, DollarSign, Calendar, 
  MapPin, Briefcase, Mail, Phone, Eye, EyeOff, Plus, Trash2, Download, 
  Upload, Save, X, Edit2, ShieldAlert
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { SkeletonProfile } from '../components/ui/Skeleton';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole } = useAuth();
  const { toast } = useToast();

  const isOwnProfile = currentUser?.employeeId === id;
  const isAdmin = currentRole === 'ADMIN';
  const canEdit = isAdmin || isOwnProfile;

  // States
  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'security' | 'documents' | 'salary'>('resume');
  const [isLoading, setIsLoading] = useState(true);
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salary, setSalary] = useState<Salary | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [leaveAllocations, setLeaveAllocations] = useState<LeaveAllocation[]>([]);

  // Toggle reveal sensitive data
  const [revealSecurity, setRevealSecurity] = useState(false);

  // Resume editing / modal states
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');
  
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certExpiry, setCertExpiry] = useState('');

  // Private Info editing state
  const [isEditingPrivate, setIsEditingPrivate] = useState(false);
  const [phoneVal, setPhoneVal] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [dobVal, setDobVal] = useState('1995-01-01');
  const [addressVal, setAddressVal] = useState('');
  const [nationalityVal, setNationalityVal] = useState('American');
  const [personalEmailVal, setPersonalEmailVal] = useState('');
  const [genderVal, setGenderVal] = useState('Male');
  const [maritalStatusVal, setMaritalStatusVal] = useState('Single');

  // Documents modal state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Aadhaar');
  const [isDocUploading, setIsDocUploading] = useState(false);

  // Salary editing state (Admin only)
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [monthlyWageVal, setMonthlyWageVal] = useState<number>(0);
  const [workingDaysVal, setWorkingDaysVal] = useState<number>(5);

  const loadProfileData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const empData = await api.employees.getById(id);
      setEmployee(empData);
      
      // Load public tabs first (Resume)
      const [skillsList, certsList] = await Promise.all([
        api.skills.getByEmployeeId(id),
        api.certifications.getByEmployeeId(id)
      ]);
      setSkills(skillsList);
      setCertifications(certsList);

      // Initialize Private values from employee details
      setPhoneVal(empData.phone || '');
      setLocationVal(empData.location || '');
      setPersonalEmailVal(empData.email || '');

      // Load sensitive details only if admin or viewing own profile
      if (isAdmin || isOwnProfile) {
        const [salaryData, docsList, allocations] = await Promise.all([
          api.salary.getByEmployeeId(id),
          api.documents.getByEmployeeId(id),
          api.timeOff.getAllocations(id)
        ]);
        setSalary(salaryData);
        setDocuments(docsList);
        setLeaveAllocations(allocations);
        
        setMonthlyWageVal(salaryData.monthlyWage);
        setWorkingDaysVal(salaryData.workingDaysPerWeek);
      }
    } catch (err: any) {
      console.error(err);
      toast('Failed to load profile details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [id]);

  // Skill submission
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newSkillName.trim()) return;
    try {
      await api.skills.add(id, newSkillName, newSkillLevel);
      toast('Skill added.', 'success');
      setIsSkillModalOpen(false);
      setNewSkillName('');
      const list = await api.skills.getByEmployeeId(id);
      setSkills(list);
    } catch (err: any) {
      toast('Failed to add skill.', 'error');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm('Delete this skill?')) return;
    try {
      await api.skills.delete(skillId);
      toast('Skill deleted.', 'success');
      const list = await api.skills.getByEmployeeId(id!);
      setSkills(list);
    } catch (err: any) {
      toast('Failed to delete skill.', 'error');
    }
  };

  // Certification submission
  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !certName.trim() || !certOrg.trim() || !certDate) return;
    try {
      await api.certifications.add(id, certName, certOrg, certDate, certExpiry || undefined);
      toast('Certification added.', 'success');
      setIsCertModalOpen(false);
      setCertName('');
      setCertOrg('');
      setCertDate('');
      setCertExpiry('');
      const list = await api.certifications.getByEmployeeId(id);
      setCertifications(list);
    } catch (err: any) {
      toast('Failed to add certification.', 'error');
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      await api.certifications.delete(certId);
      toast('Certification deleted.', 'success');
      const list = await api.certifications.getByEmployeeId(id!);
      setCertifications(list);
    } catch (err: any) {
      toast('Failed to delete certification.', 'error');
    }
  };

  // Private Info Save
  const handleSavePrivate = async () => {
    if (!id || !employee) return;
    try {
      await api.employees.update(id, {
        phone: phoneVal,
        location: locationVal
      });
      // Mock other private fields saving to localstorage user profile private section if you want
      // For now we simulate success
      toast('Private information saved.', 'success');
      setIsEditingPrivate(false);
      loadProfileData();
    } catch (err) {
      toast('Failed to update private info.', 'error');
    }
  };

  // Document Upload
  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !docName.trim()) return;
    setIsDocUploading(true);
    try {
      await api.documents.upload(id, docName, docType, '1.5 MB');
      toast('Document uploaded successfully.', 'success');
      setIsDocModalOpen(false);
      setDocName('');
      const list = await api.documents.getByEmployeeId(id);
      setDocuments(list);
    } catch (err) {
      toast('Failed to upload document.', 'error');
    } finally {
      setIsDocUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) return;
    try {
      await api.documents.delete(docId);
      toast('Document deleted.', 'success');
      const list = await api.documents.getByEmployeeId(id!);
      setDocuments(list);
    } catch (err) {
      toast('Failed to delete document.', 'error');
    }
  };

  // Salary Save (Admin only)
  const handleSaveSalary = async () => {
    if (!id) return;
    try {
      await api.salary.update(id, {
        monthlyWage: monthlyWageVal,
        workingDaysPerWeek: workingDaysVal
      });
      toast('Salary configurations updated.', 'success');
      setIsEditingSalary(false);
      loadProfileData();
    } catch (err) {
      toast('Failed to update salary.', 'error');
    }
  };

  if (isLoading) {
    return <SkeletonProfile />;
  }

  if (!employee) {
    return (
      <div className="bg-white border border-border p-12 text-center rounded">
        <h2 className="text-xl font-bold text-text-primary">Employee profile not found</h2>
        <button onClick={() => navigate('/employees')} className="mt-4 text-primary font-bold hover:underline">
          Return to directory
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Profile summary header */}
      <div className="bg-white border border-border rounded-md shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <img 
          src={employee.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
          alt="" 
          className="w-24 h-24 rounded-full object-cover border border-border" 
        />
        
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">{employee.firstName} {employee.lastName}</h1>
            <span className="bg-card text-text-secondary border border-border text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              {employee.code}
            </span>
          </div>
          
          <p className="text-sm text-text-secondary font-semibold flex items-center gap-1.5 mt-1">
            <Briefcase className="w-4 h-4 text-text-secondary shrink-0" />
            {employee.jobPosition} • <span className="text-primary">{employee.department}</span>
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 mt-3 text-xs text-text-secondary border-t border-border pt-3 w-full">
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{employee.email}</span>
            {employee.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{employee.phone}</span>}
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{employee.location}</span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-border bg-white rounded-t-md flex overflow-x-auto shadow-sm select-none">
        
        <button
          onClick={() => setActiveTab('resume')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
            activeTab === 'resume' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Resume</span>
        </button>

        <button
          onClick={() => setActiveTab('private')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
            activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Private Info</span>
        </button>

        {(isAdmin || isOwnProfile) && (
          <>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
                activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
                activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </button>

            <button
              onClick={() => setActiveTab('salary')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
                activeTab === 'salary' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Salary</span>
            </button>
          </>
        )}

      </div>

      {/* TABS CONTAINER */}
      <div className="bg-white border border-t-0 border-border rounded-b-md shadow-sm p-6 min-h-[300px]">

        {/* 1. RESUME TAB */}
        {activeTab === 'resume' && (
          <div className="flex flex-col gap-6">
            
            {/* About / Bio */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-1.5 mb-3">About Me</h3>
              <p className="text-sm text-text-primary leading-relaxed bg-card p-4 rounded border border-border/40">
                Senior HR/Engineering executive focused on developing scalable platforms, optimizing human resource architectures, and leading collaborative project workflows. Enjoys active problem solving and mentorship.
              </p>
            </div>

            {/* Skills Panel */}
            <div>
              <div className="flex justify-between items-center border-b border-border pb-1.5 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Skills & Expertise</h3>
                {canEdit && (
                  <button 
                    onClick={() => setIsSkillModalOpen(true)}
                    className="text-xs text-primary font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill</span>
                  </button>
                )}
              </div>
              {skills.length === 0 ? (
                <p className="text-sm text-text-secondary italic">No skills listed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span 
                      key={skill.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-card text-text-primary text-xs font-bold rounded-full border border-border"
                    >
                      <span>{skill.name}</span>
                      <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                        {skill.level}
                      </span>
                      {canEdit && (
                        <button 
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-text-secondary hover:text-status-error ml-1 focus:outline-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications Panel */}
            <div>
              <div className="flex justify-between items-center border-b border-border pb-1.5 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Licenses & Certifications</h3>
                {canEdit && (
                  <button 
                    onClick={() => setIsCertModalOpen(true)}
                    className="text-xs text-primary font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Certificate</span>
                  </button>
                )}
              </div>
              {certifications.length === 0 ? (
                <p className="text-sm text-text-secondary italic">No certifications listed yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certifications.map(cert => (
                    <div key={cert.id} className="border border-border rounded p-4 bg-card/20 flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-text-primary text-sm">{cert.name}</span>
                        <span className="text-xs text-text-secondary">{cert.organization}</span>
                        <span className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Issued: {cert.issueDate} {cert.expiryDate ? `• Expires: ${cert.expiryDate}` : ''}
                        </span>
                      </div>
                      {canEdit && (
                        <button 
                          onClick={() => handleDeleteCert(cert.id)}
                          className="text-text-secondary hover:text-status-error p-1 rounded hover:bg-card shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. PRIVATE INFO TAB */}
        {activeTab === 'private' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-border pb-1.5 mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Personal Profile Data</h3>
              {canEdit && !isEditingPrivate && (
                <button 
                  onClick={() => setIsEditingPrivate(true)}
                  className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Info</span>
                </button>
              )}
              {isEditingPrivate && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingPrivate(false)}
                    className="text-xs text-text-secondary font-bold hover:underline px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePrivate}
                    className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded font-bold transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Residential Address</span>
                {isEditingPrivate ? (
                  <input 
                    type="text" 
                    value={addressVal} 
                    onChange={e => setAddressVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  />
                ) : (
                  <span className="text-text-primary font-medium">{addressVal || 'Not Provided'}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Personal Phone</span>
                {isEditingPrivate ? (
                  <input 
                    type="text" 
                    value={phoneVal} 
                    onChange={e => setPhoneVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  />
                ) : (
                  <span className="text-text-primary font-medium">{phoneVal || 'Not Provided'}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Nationality</span>
                {isEditingPrivate ? (
                  <input 
                    type="text" 
                    value={nationalityVal} 
                    onChange={e => setNationalityVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  />
                ) : (
                  <span className="text-text-primary font-medium">{nationalityVal}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Personal Email</span>
                {isEditingPrivate ? (
                  <input 
                    type="email" 
                    value={personalEmailVal} 
                    onChange={e => setPersonalEmailVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  />
                ) : (
                  <span className="text-text-primary font-medium">{personalEmailVal}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Date of Birth</span>
                {isEditingPrivate ? (
                  <input 
                    type="date" 
                    value={dobVal} 
                    onChange={e => setDobVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  />
                ) : (
                  <span className="text-text-primary font-medium">{dobVal}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Gender</span>
                {isEditingPrivate ? (
                  <select 
                    value={genderVal} 
                    onChange={e => setGenderVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <span className="text-text-primary font-medium">{genderVal}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Marital Status</span>
                {isEditingPrivate ? (
                  <select 
                    value={maritalStatusVal} 
                    onChange={e => setMaritalStatusVal(e.target.value)}
                    className="border border-border rounded text-sm px-2.5 py-1 bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                ) : (
                  <span className="text-text-primary font-medium">{maritalStatusVal}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Date of Joining</span>
                <span className="text-text-primary font-semibold">{employee.dateOfJoining}</span>
              </div>
            </div>

          </div>
        )}

        {/* 3. SECURITY TAB */}
        {activeTab === 'security' && (isAdmin || isOwnProfile) && (
          <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-center border-b border-border pb-1.5 mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Sensitive Security & Bank Details</h3>
              <button
                onClick={() => setRevealSecurity(!revealSecurity)}
                className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
              >
                {revealSecurity ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Mask Details</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal Details</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Bank Account Number</span>
                <span className="text-text-primary font-mono font-medium">
                  {revealSecurity ? '1092 8837 4738 221' : 'XXXX XXXX XXXX 8221'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Bank Name & Branch</span>
                <span className="text-text-primary font-medium">
                  {revealSecurity ? 'Chase Bank, Manhattan Branch' : 'Chase Bank, Manhattan Branch'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">IFSC Code / Routing</span>
                <span className="text-text-primary font-mono font-medium">
                  {revealSecurity ? 'CHASUS33NXX' : 'XXXXXX33NXX'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Permanent Account Number (PAN)</span>
                <span className="text-text-primary font-mono font-medium">
                  {revealSecurity ? 'ABCDE1234F' : 'XXXXX1234X'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Universal Account Number (UAN)</span>
                <span className="text-text-primary font-mono font-medium">
                  {revealSecurity ? '1008 3829 3991' : 'XXXX XXXX 3991'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-text-secondary uppercase">Company Login Code</span>
                <span className="text-text-primary font-mono font-bold">{employee.code}</span>
              </div>
            </div>

            <div className="p-3 bg-status-pending/10 rounded flex items-start gap-2 border border-status-pending/30 mt-4">
              <ShieldAlert className="w-5 h-5 text-status-pending shrink-0" />
              <p className="text-[11px] text-status-pending leading-relaxed">
                <b>Security Warning:</b> Keep these credentials confidential. Do not store sensitive banking data in browser localStorage or expose them via URLs.
              </p>
            </div>

          </div>
        )}

        {/* 4. DOCUMENTS TAB */}
        {activeTab === 'documents' && (isAdmin || isOwnProfile) && (
          <div className="flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-border pb-1.5 mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Document Repository</h3>
              <button 
                onClick={() => setIsDocModalOpen(true)}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-1.5 rounded shadow transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>

            <Table<Document>
              headers={[
                { key: 'name', label: 'Document Name' },
                { key: 'type', label: 'Type' },
                { key: 'uploadedDate', label: 'Uploaded Date' },
                { key: 'uploadedBy', label: 'Uploaded By' },
                { key: 'status', label: 'Status' },
                { key: 'actions', label: '' }
              ]}
              data={documents}
              renderRow={(doc) => (
                <tr key={doc.id} className="hover:bg-card/25 transition-colors">
                  <td className="px-6 py-4 font-bold text-text-primary">{doc.name}</td>
                  <td className="px-6 py-4 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded inline-block mt-3">{doc.type}</td>
                  <td className="px-6 py-4 text-text-secondary">{doc.uploadedDate}</td>
                  <td className="px-6 py-4 text-text-secondary">{doc.uploadedBy}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-status-approved/10 text-status-approved border border-status-approved/20`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => toast(`Viewing file: ${doc.name}`, 'info')}
                        className="p-1 rounded hover:bg-card text-text-secondary hover:text-text-primary"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toast(`Downloaded file: ${doc.name}`, 'success')}
                        className="p-1 rounded hover:bg-card text-text-secondary hover:text-text-primary"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1 rounded hover:bg-red-50 text-text-secondary hover:text-status-error"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              emptyMessage="No documents uploaded yet."
            />

          </div>
        )}

        {/* 5. SALARY TAB */}
        {activeTab === 'salary' && (isAdmin || isOwnProfile) && salary && (
          <div className="flex flex-col gap-6">
            
            <div className="flex justify-between items-center border-b border-border pb-1.5 mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Salary Configuration</h3>
              {isAdmin && !isEditingSalary && (
                <button
                  onClick={() => setIsEditingSalary(true)}
                  className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure Payroll</span>
                </button>
              )}
              {isEditingSalary && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditingSalary(false)}
                    className="text-xs text-text-secondary font-bold hover:underline px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveSalary}
                    className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded font-bold transition-colors animate-in"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded border border-border">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Gross Monthly Wage</span>
                {isEditingSalary ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-bold text-text-primary text-lg">$</span>
                    <input 
                      type="number" 
                      value={monthlyWageVal}
                      onChange={e => setMonthlyWageVal(Number(e.target.value))}
                      className="border border-border rounded text-sm px-2 py-1 bg-white font-bold max-w-[120px]"
                    />
                  </div>
                ) : (
                  <h4 className="text-2xl font-black text-primary mt-1">${salary.monthlyWage}</h4>
                )}
              </div>

              <div className="bg-card p-4 rounded border border-border">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Estimated Annualized Wage</span>
                <h4 className="text-2xl font-black text-text-primary mt-1">${salary.yearlyWage}</h4>
              </div>

              <div className="bg-card p-4 rounded border border-border">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Net Pay (Take-Home estimate)</span>
                <h4 className="text-2xl font-black text-status-present mt-1">${salary.netSalary}</h4>
              </div>
            </div>

            {/* Salary component details */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-text-secondary uppercase mb-3 tracking-wide">Breakdown Components</h4>
              
              <table className="w-full text-left text-sm border-collapse border border-border rounded">
                <thead className="bg-card font-bold text-text-primary">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3">Salary Component</th>
                    <th className="px-4 py-3">Calculation Type</th>
                    <th className="px-4 py-3">Percentage / Ratio</th>
                    <th className="px-4 py-3 text-right">Computed Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2.5 font-bold">Basic Salary</td>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">PERCENTAGE_OF_WAGE</td>
                    <td className="px-4 py-2.5">50%</td>
                    <td className="px-4 py-2.5 text-right font-semibold">${salary.basic}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">House Rent Allowance (HRA)</td>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">PERCENTAGE_OF_BASIC</td>
                    <td className="px-4 py-2.5">40% of basic</td>
                    <td className="px-4 py-2.5 text-right font-semibold">${salary.hra}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">Standard Special Allowance</td>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">FIXED</td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5 text-right font-semibold">${salary.allowance}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-bold">Performance Bonus Target</td>
                    <td className="px-4 py-2.5 text-xs text-text-secondary">FIXED</td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5 text-right font-semibold">${salary.bonus}</td>
                  </tr>
                  <tr className="bg-red-50/30 text-status-error font-medium">
                    <td className="px-4 py-2.5">PF Employee Contribution Deducted</td>
                    <td className="px-4 py-2.5 text-xs">PERCENTAGE_OF_BASIC</td>
                    <td className="px-4 py-2.5">12% of basic</td>
                    <td className="px-4 py-2.5 text-right">- ${salary.pfEmployee}</td>
                  </tr>
                  <tr className="bg-red-50/30 text-status-error font-medium">
                    <td className="px-4 py-2.5">Professional Tax</td>
                    <td className="px-4 py-2.5 text-xs">FIXED</td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5 text-right">- ${salary.professionalTax}</td>
                  </tr>
                </tbody>
              </table>

            </div>

          </div>
        )}

      </div>

      {/* MODAL ADD SKILL */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Add Skill"
        size="sm"
      >
        <form onSubmit={handleAddSkill} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Skill Name</label>
            <input 
              type="text" 
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              placeholder="e.g. TypeScript, Project Management"
              className="border border-border rounded text-sm px-3 py-2 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Skill Level</label>
            <select
              value={newSkillLevel}
              onChange={e => setNewSkillLevel(e.target.value)}
              className="border border-border rounded text-sm px-3 py-2 bg-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button 
              type="button" 
              onClick={() => setIsSkillModalOpen(false)}
              className="px-3 py-1.5 border border-border rounded text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold shadow hover:bg-primary-hover"
            >
              Add Skill
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL ADD CERTIFICATION */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Add Certification"
        size="sm"
      >
        <form onSubmit={handleAddCert} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Certificate Title</label>
            <input 
              type="text" 
              value={certName}
              onChange={e => setCertName(e.target.value)}
              placeholder="e.g. AWS Solutions Architect"
              className="border border-border rounded text-sm px-3 py-2 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Issuing Organization</label>
            <input 
              type="text" 
              value={certOrg}
              onChange={e => setCertOrg(e.target.value)}
              placeholder="e.g. Amazon Web Services, Scrum Alliance"
              className="border border-border rounded text-sm px-3 py-2 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Issue Date</label>
              <input 
                type="date" 
                value={certDate}
                onChange={e => setCertDate(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 bg-white"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Expiry Date (optional)</label>
              <input 
                type="date" 
                value={certExpiry}
                onChange={e => setCertExpiry(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button 
              type="button" 
              onClick={() => setIsCertModalOpen(false)}
              className="px-3 py-1.5 border border-border rounded text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold shadow hover:bg-primary-hover"
            >
              Save Certificate
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL UPLOAD DOCUMENT */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Document"
        size="sm"
      >
        <form onSubmit={handleDocUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Document Name</label>
            <input 
              type="text" 
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="e.g. Aadhaar_Card.pdf, Resume_2026.docx"
              className="border border-border rounded text-sm px-3 py-2 bg-white"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="border border-border rounded text-sm px-3 py-2 bg-white"
            >
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="Resume">Resume</option>
              <option value="Offer Letter">Offer Letter</option>
              <option value="Joining Letter">Joining Letter</option>
              <option value="Experience Certificate">Experience Certificate</option>
              <option value="Bank Document">Bank Document</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Select File</label>
            <div className="border-2 border-dashed border-border rounded p-6 flex flex-col items-center justify-center bg-card cursor-pointer">
              <Upload className="w-8 h-8 text-text-secondary mb-2" />
              <span className="text-xs text-text-secondary">Drag and drop file here or click to browse</span>
              <span className="text-[10px] text-text-secondary/70 mt-1">Accepted: PDF, PNG, JPG, JPEG (Max 5MB)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button 
              type="button" 
              onClick={() => setIsDocModalOpen(false)}
              className="px-3 py-1.5 border border-border rounded text-xs"
              disabled={isDocUploading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold shadow hover:bg-primary-hover flex items-center gap-1"
              disabled={isDocUploading}
            >
              {isDocUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
export default EmployeeProfile;
