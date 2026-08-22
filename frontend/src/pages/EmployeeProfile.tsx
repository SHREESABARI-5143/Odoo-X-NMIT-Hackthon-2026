import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { employeeApi } from '../api/employeeApi';
import { salaryApi } from '../api/salaryApi';
import { documentApi } from '../api/documentApi';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  User as UserIcon,
  FileText,
  DollarSign,
  ShieldCheck,
  Briefcase,
  Plus,
  Trash2,
  Download,
  Upload,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Edit2,
  Check,
} from 'lucide-react';

export const EmployeeProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const targetId = id || user?.id || '';
  const isSelf = user?.id === targetId;
  const canAccessFull = isSelf || isAdmin;

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'resume' | 'private' | 'security' | 'documents' | 'salary'>('resume');

  // Skill & Certification modal states
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '2026' });

  // Document upload modal state
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Resume');

  // Edit Profile modal state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    personalEmail: '',
    dob: '',
    gender: 'Male',
    maritalStatus: 'Single',
    nationality: '',
    about: '',
    interests: '',
  });

  // Query Employee Data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['employeeProfile', targetId],
    queryFn: () => employeeApi.getEmployeeById(targetId),
  });

  // Query Salary Data (if allowed)
  const { data: salaryData, isLoading: isLoadingSalary } = useQuery({
    queryKey: ['salaryConfig', targetId],
    queryFn: () => salaryApi.getSalaryConfig(targetId),
    enabled: canAccessFull,
  });

  // Query Documents Data (if allowed)
  const { data: documents, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['employeeDocuments', targetId],
    queryFn: () => documentApi.getEmployeeDocuments(targetId),
    enabled: canAccessFull,
  });

  // Salary Edit State (Admin Only)
  const [salaryForm, setSalaryForm] = useState({
    monthlyWage: 60000,
    basicSalary: 30000,
    hra: 15000,
    standardAllowance: 5000,
    performanceBonus: 5000,
    lta: 2500,
    fixedAllowance: 2500,
  });

  const [isEditingSalary, setIsEditingSalary] = useState(false);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => employeeApi.updateEmployee(targetId, data),
    onSuccess: (res) => {
      showToast('Profile updated successfully.', 'success');
      setEditProfileOpen(false);
      queryClient.invalidateQueries({ queryKey: ['employeeProfile', targetId] });
    },
    onError: () => showToast('Failed to update profile.', 'error'),
  });

  const addSkillMutation = useMutation({
    mutationFn: (skill: string) => employeeApi.addSkill(targetId, skill),
    onSuccess: () => {
      showToast('Profile updated successfully.', 'success');
      setSkillModalOpen(false);
      setNewSkill('');
      queryClient.invalidateQueries({ queryKey: ['employeeProfile', targetId] });
    },
  });

  const addCertMutation = useMutation({
    mutationFn: (cert: any) => employeeApi.addCertification(targetId, cert),
    onSuccess: () => {
      showToast('Profile updated successfully.', 'success');
      setCertModalOpen(false);
      setNewCert({ name: '', issuer: '', year: '2026' });
      queryClient.invalidateQueries({ queryKey: ['employeeProfile', targetId] });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: (formData: FormData) => documentApi.uploadDocument(formData),
    onSuccess: () => {
      showToast('Document uploaded successfully.', 'success');
      setDocModalOpen(false);
      setDocFile(null);
      setDocName('');
      queryClient.invalidateQueries({ queryKey: ['employeeDocuments', targetId] });
    },
    onError: () => showToast('Failed to upload document.', 'error'),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => documentApi.deleteDocument(docId),
    onSuccess: () => {
      showToast('Document deleted.', 'success');
      queryClient.invalidateQueries({ queryKey: ['employeeDocuments', targetId] });
    },
    onError: () => showToast('Failed to delete document.', 'error'),
  });

  const updateSalaryMutation = useMutation({
    mutationFn: (data: any) => salaryApi.updateSalaryConfig(targetId, data),
    onSuccess: (data) => {
      showToast('Salary configuration updated.', 'success');
      setIsEditingSalary(false);
      queryClient.invalidateQueries({ queryKey: ['salaryConfig', targetId] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Salary components cannot exceed the configured wage.', 'error');
    },
  });

  if (isLoading) return <TableSkeleton rows={4} />;

  const isRestricted = profile?.isRestricted;

  return (
    <div className="space-y-6">
      {/* Header Profile Section */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#714B67]/15 text-[#714B67] font-bold text-2xl flex items-center justify-center border-2 border-[#714B67]/20 overflow-hidden shadow-sm">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>
                  {profile?.firstName?.[0]}
                  {profile?.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[#252525]">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <span className="text-xs font-mono font-semibold bg-[#714B67]/10 text-[#714B67] px-2.5 py-0.5 rounded-full">
                  {profile?.loginId}
                </span>
              </div>
              <p className="text-sm font-medium text-[#6B6B6B] mt-0.5">
                {profile?.jobPosition || 'Employee'} • {profile?.department || 'Engineering'}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#6B6B6B]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#714B67]" /> {profile?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#714B67]" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#714B67]" /> {profile?.location || 'San Francisco HQ'}
                </span>
              </div>
            </div>
          </div>

          {(isSelf || isAdmin) && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-4 h-4" />}
              onClick={() => {
                setEditForm({
                  phone: profile?.phone || '',
                  address: profile?.address || '',
                  personalEmail: profile?.personalEmail || '',
                  dob: profile?.dob || '',
                  gender: profile?.gender || 'Male',
                  maritalStatus: profile?.maritalStatus || 'Single',
                  nationality: profile?.nationality || '',
                  about: profile?.about || '',
                  interests: profile?.interests || '',
                });
                setEditProfileOpen(true);
              }}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E7E4E1] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('resume')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'resume'
              ? 'border-[#714B67] text-[#714B67] bg-white'
              : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Resume
        </button>

        {!isRestricted && (
          <>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'private'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Private Info
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'security'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Security
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'documents'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
              }`}
            >
              <FileText className="w-4 h-4" /> Documents
            </button>

            <button
              onClick={() => setActiveTab('salary')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'salary'
                  ? 'border-[#714B67] text-[#714B67] bg-white'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Salary Info
            </button>
          </>
        )}
      </div>

      {/* TAB 1: RESUME */}
      {activeTab === 'resume' && (
        <div className="space-y-6 flow-fade-enter">
          <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] space-y-4">
            <h3 className="text-sm font-bold text-[#252525]">About</h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {profile?.about || 'No about description provided yet.'}
            </p>
          </div>

          {/* Skills Chips */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#252525]">Skills</h3>
              {canAccessFull && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setSkillModalOpen(true)}
                >
                  Add Skill
                </Button>
              )}
            </div>

            {!profile?.skills || profile.skills.length === 0 ? (
              <EmptyState title="No skills added yet." description="Add relevant skills to showcase your expertise." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#FFF1E2] text-[#714B67] border border-[#F6A23A]/30 rounded-full text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Cards */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#252525]">Certifications</h3>
              {canAccessFull && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setCertModalOpen(true)}
                >
                  Add Certification
                </Button>
              )}
            </div>

            {!profile?.certifications || profile.certifications.length === 0 ? (
              <EmptyState title="No certifications added yet." description="Include verified credentials and certifications." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.certifications.map((c: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E7E4E1]">
                    <h4 className="text-xs font-bold text-[#252525]">{c.name}</h4>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                      Issued by {c.issuer} • {c.year}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE INFO */}
      {activeTab === 'private' && !isRestricted && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] grid grid-cols-1 md:grid-cols-2 gap-6 flow-fade-enter">
          <div>
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Date of Birth
            </span>
            <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.dob || '1992-06-15'}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Date of Joining
            </span>
            <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.dateOfJoining || '2025-03-01'}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Residential Address
            </span>
            <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.address || '742 Evergreen Terrace, San Francisco, CA'}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Personal Email
            </span>
            <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.personalEmail || 'john.doe.personal@gmail.com'}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Gender
            </span>
            <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.gender || 'Male'}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
              Marital Status
            </span>
            <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.maritalStatus || 'Single'}</p>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & BANK DETAILS */}
      {activeTab === 'security' && !isRestricted && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] space-y-6 flow-fade-enter">
          <div className="flex items-center gap-2 text-sm font-bold text-[#252525] pb-3 border-b border-[#E7E4E1]">
            <Lock className="w-4 h-4 text-[#714B67]" /> Bank & Statutory Details
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Bank Name
              </span>
              <p className="text-sm font-semibold text-[#252525] mt-1">{profile?.bankName || 'HDFC Bank'}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Account Number (Masked)
              </span>
              <p className="text-sm font-mono font-bold text-[#714B67] mt-1">{profile?.bankAccount || '••••••••1234'}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                IFSC Code
              </span>
              <p className="text-sm font-mono font-semibold text-[#252525] mt-1">{profile?.ifsc || 'HDFC0001234'}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                PAN Number
              </span>
              <p className="text-sm font-mono font-semibold text-[#252525] mt-1">{profile?.pan || 'ABCDE1234F'}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                UAN Number
              </span>
              <p className="text-sm font-mono font-semibold text-[#252525] mt-1">{profile?.uan || '100900800701'}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Employee Code
              </span>
              <p className="text-sm font-mono font-semibold text-[#252525] mt-1">{profile?.employeeCode || 'EMP-2001'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS MODULE */}
      {activeTab === 'documents' && !isRestricted && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] space-y-4 flow-fade-enter">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#252525]">Uploaded Documents</h3>
            <Button
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => setDocModalOpen(true)}
            >
              Upload Document
            </Button>
          </div>

          {isLoadingDocs ? (
            <TableSkeleton rows={3} />
          ) : !documents || documents.length === 0 ? (
            <EmptyState title="No documents uploaded yet." description="Upload government ID, resume, or employment records." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F5] text-[#6B6B6B] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Document Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Uploaded Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E4E1]">
                  {documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-[#F7F7F5]/50">
                      <td className="p-3 font-semibold text-[#252525]">{doc.name}</td>
                      <td className="p-3 font-medium bg-[#714B67]/10 text-[#714B67] px-2 py-0.5 rounded max-w-fit">
                        {doc.type}
                      </td>
                      <td className="p-3 text-[#6B6B6B]">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => documentApi.downloadDocument(doc.id)}
                        >
                          Download
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => deleteDocMutation.mutate(doc.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SALARY INFO */}
      {activeTab === 'salary' && !isRestricted && (
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] space-y-6 flow-fade-enter">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E4E1]">
            <div>
              <h3 className="text-base font-bold text-[#252525]">Salary & Compensation Structure</h3>
              <p className="text-xs text-[#6B6B6B]">
                {salaryData?.isReadOnly ? 'Read-only view for employee.' : 'Admin editing controls enabled.'}
              </p>
            </div>
            {isAdmin && !isEditingSalary && (
              <Button
                size="sm"
                variant="outline"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (salaryData?.config) {
                    setSalaryForm({
                      monthlyWage: salaryData.config.monthlyWage,
                      basicSalary: salaryData.config.basicSalary,
                      hra: salaryData.config.hra,
                      standardAllowance: salaryData.config.standardAllowance,
                      performanceBonus: salaryData.config.performanceBonus,
                      lta: salaryData.config.lta,
                      fixedAllowance: salaryData.config.fixedAllowance,
                    });
                  }
                  setIsEditingSalary(true);
                }}
              >
                Edit Salary Components
              </Button>
            )}
          </div>

          {isLoadingSalary ? (
            <TableSkeleton rows={4} />
          ) : isEditingSalary ? (
            /* Admin Salary Edit Form */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSalaryMutation.mutate(salaryForm);
              }}
              className="space-y-4"
            >
              <div className="p-4 bg-[#FFF1E2] rounded-xl border border-[#F6A23A]/30">
                <label className="block text-xs font-bold text-[#714B67] mb-1">
                  Configured Monthly Wage ($)
                </label>
                <input
                  type="number"
                  required
                  value={salaryForm.monthlyWage}
                  onChange={(e) => setSalaryForm({ ...salaryForm, monthlyWage: Number(e.target.value) })}
                  className="w-full p-2 text-sm bg-white border border-[#E7E4E1] rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Basic Salary</label>
                  <input
                    type="number"
                    value={salaryForm.basicSalary}
                    onChange={(e) => setSalaryForm({ ...salaryForm, basicSalary: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">HRA</label>
                  <input
                    type="number"
                    value={salaryForm.hra}
                    onChange={(e) => setSalaryForm({ ...salaryForm, hra: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Standard Allowance</label>
                  <input
                    type="number"
                    value={salaryForm.standardAllowance}
                    onChange={(e) => setSalaryForm({ ...salaryForm, standardAllowance: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Performance Bonus</label>
                  <input
                    type="number"
                    value={salaryForm.performanceBonus}
                    onChange={(e) => setSalaryForm({ ...salaryForm, performanceBonus: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Leave Travel Allowance (LTA)</label>
                  <input
                    type="number"
                    value={salaryForm.lta}
                    onChange={(e) => setSalaryForm({ ...salaryForm, lta: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Fixed Allowance</label>
                  <input
                    type="number"
                    value={salaryForm.fixedAllowance}
                    onChange={(e) => setSalaryForm({ ...salaryForm, fixedAllowance: Number(e.target.value) })}
                    className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsEditingSalary(false)}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" isLoading={updateSalaryMutation.isPending}>
                  Save Salary Config
                </Button>
              </div>
            </form>
          ) : (
            /* Salary Overview Card */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E7E4E1]">
                  <span className="text-xs font-bold text-[#6B6B6B]">MONTHLY WAGE</span>
                  <p className="text-2xl font-bold text-[#714B67] mt-1">
                    ${salaryData?.config?.monthlyWage?.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E7E4E1]">
                  <span className="text-xs font-bold text-[#6B6B6B]">YEARLY WAGE</span>
                  <p className="text-2xl font-bold text-[#252525] mt-1">
                    ${salaryData?.config?.yearlyWage?.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-[#3FA66B]/10 rounded-xl border border-[#3FA66B]/30">
                  <span className="text-xs font-bold text-[#2E7D4E]">NET TAKE HOME</span>
                  <p className="text-2xl font-bold text-[#2E7D4E] mt-1">
                    ${salaryData?.config?.netSalary?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Components breakdown table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] text-[#6B6B6B] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Salary Component</th>
                      <th className="p-3 text-right">Monthly Amount ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E4E1]">
                    <tr>
                      <td className="p-3 font-semibold">Basic Salary</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.basicSalary}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">House Rent Allowance (HRA)</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.hra}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Standard Allowance</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.standardAllowance}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Performance Bonus</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.performanceBonus}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Leave Travel Allowance (LTA)</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.lta}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Fixed Allowance</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.fixedAllowance}</td>
                    </tr>
                    <tr className="bg-[#F7F7F5] font-bold text-[#714B67]">
                      <td className="p-3">Gross Salary Total</td>
                      <td className="p-3 text-right font-mono">${salaryData?.config?.grossSalary}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-[#D85C5C] font-semibold">Employee PF Deduction</td>
                      <td className="p-3 text-right font-mono text-[#D85C5C]">-${salaryData?.config?.employeePf}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-[#D85C5C] font-semibold">Professional Tax</td>
                      <td className="p-3 text-right font-mono text-[#D85C5C]">-${salaryData?.config?.professionalTax}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Edit Profile */}
      <Modal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Profile" maxWidth="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfileMutation.mutate(editForm);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Phone Number</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Personal Email</label>
              <input
                type="email"
                value={editForm.personalEmail}
                onChange={(e) => setEditForm({ ...editForm, personalEmail: e.target.value })}
                placeholder="personal@example.com"
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Date of Birth</label>
              <input
                type="date"
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Gender</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Marital Status</label>
              <select
                value={editForm.maritalStatus}
                onChange={(e) => setEditForm({ ...editForm, maritalStatus: e.target.value })}
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Residential Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Street address, City, State"
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Nationality</label>
              <input
                type="text"
                value={editForm.nationality}
                onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                placeholder="e.g. American, Indian, Canadian"
                className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">About Me</label>
            <textarea
              rows={3}
              value={editForm.about}
              onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
              placeholder="Brief overview of your background and career goals..."
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Personal Interests & Hobbies</label>
            <input
              type="text"
              value={editForm.interests}
              onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
              placeholder="e.g. Open Source, Photography, Hiking"
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E4E1]">
            <Button variant="outline" size="sm" type="button" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={updateProfileMutation.isPending}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Skill */}
      <Modal isOpen={skillModalOpen} onClose={() => setSkillModalOpen(false)} title="Add Skill">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newSkill) addSkillMutation.mutate(newSkill);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Skill Name</label>
            <input
              type="text"
              required
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="e.g. React, TypeScript, GraphQL"
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setSkillModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={addSkillMutation.isPending}>
              Add Skill
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Certification */}
      <Modal isOpen={certModalOpen} onClose={() => setCertModalOpen(false)} title="Add Certification">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addCertMutation.mutate(newCert);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Certification Name</label>
            <input
              type="text"
              required
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              placeholder="e.g. AWS Certified Architect"
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Issuing Organization</label>
            <input
              type="text"
              required
              value={newCert.issuer}
              onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
              placeholder="e.g. Amazon Web Services"
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Year</label>
            <input
              type="text"
              value={newCert.year}
              onChange={(e) => setNewCert({ ...newCert, year: e.target.value })}
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setCertModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={addCertMutation.isPending}>
              Add Certification
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Upload Document */}
      <Modal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} title="Upload Document">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!docFile) return;
            const formData = new FormData();
            formData.append('file', docFile);
            formData.append('employeeId', targetId);
            formData.append('name', docName || docFile.name);
            formData.append('type', docType);
            uploadDocMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
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

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Document Title</label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. John_Doe_Resume_2026.pdf"
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">Select File (PDF, JPG, PNG)</label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setDocFile(e.target.files[0]);
                }
              }}
              className="w-full p-2 text-xs border border-[#E7E4E1] rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setDocModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={uploadDocMutation.isPending}>
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
