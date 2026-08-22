import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { employeeApi } from '../api/employeeApi';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Search, UserPlus, Copy, Check, Filter, Mail, Phone, MapPin, Building2, UserCheck } from 'lucide-react';

export const Employees: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states for Employee Creation
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    loginId: string;
    tempPass: string;
  } | null>(null);

  const [copiedLoginId, setCopiedLoginId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    companyName: 'Dayflow Technologies',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    jobPosition: 'Software Engineer',
    department: 'Engineering',
    location: 'Headquarters',
  });

  useEffect(() => {
    if (searchParams.get('action') === 'create' && isAdmin) {
      setCreateModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, isAdmin, setSearchParams]);

  // Debounce search term by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: employees, isLoading, isError } = useQuery({
    queryKey: ['employees', debouncedSearch, selectedDept, selectedStatus],
    queryFn: () =>
      employeeApi.getEmployees({
        search: debouncedSearch,
        department: selectedDept,
        status: selectedStatus,
      }),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: (data) => {
      showToast('Employee created successfully.', 'success');
      showToast('Login ID generated successfully.', 'success');
      setCreateModalOpen(false);
      setCreatedCredentialsModal({
        loginId: data.generatedLoginId,
        tempPass: data.temporaryPassword,
      });
      setFormData({
        companyName: 'Dayflow Technologies',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        jobPosition: 'Software Engineer',
        department: 'Engineering',
        location: 'Headquarters',
      });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'An employee with this email already exists.', 'error');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    createEmployeeMutation.mutate(formData);
  };

  const copyToClipboard = (text: string, type: 'login' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'login') {
      setCopiedLoginId(true);
      setTimeout(() => setCopiedLoginId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-[#252525]">Employee Directory</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Manage your organization workforce and team structure.
          </p>
        </div>
        {isAdmin && (
          <Button
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setCreateModalOpen(true)}
          >
            CREATE EMPLOYEE
          </Button>
        )}
      </div>

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E7E4E1]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, Login ID, email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F7F5] border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-[#F7F7F5] border border-[#E7E4E1] rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Design">Design</option>
            <option value="Product">Product</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-[#F7F7F5] border border-[#E7E4E1] rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Today Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="HALF_DAY">Half-day</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <EmptyState title="Something went wrong while loading employees." description="Please check your backend connection." />
      ) : employees?.length === 0 ? (
        <EmptyState title="No employees found." description="Try adjusting your search query or department filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees?.map((emp: any) => (
            <div
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs hover:border-[#714B67]/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#714B67]/10 text-[#714B67] font-bold text-base flex items-center justify-center border border-[#714B67]/20 overflow-hidden">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>
                          {emp.firstName?.[0]}
                          {emp.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#252525]">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-xs text-[#6B6B6B] font-medium">{emp.jobPosition || 'Employee'}</p>
                    </div>
                  </div>
                  <StatusBadge status={emp.todayStatus || 'ABSENT'} size="sm" />
                </div>

                <div className="mt-4 pt-4 border-t border-[#E7E4E1] space-y-2 text-xs text-[#6B6B6B]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#714B67]" />
                    <span>{emp.department || 'Engineering'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#714B67]" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#714B67]" />
                    <span>{emp.location || 'Headquarters'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E7E4E1] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6B6B6B]">LOGIN ID:</span>
                <span className="font-bold text-[#714B67] bg-[#714B67]/10 px-2 py-0.5 rounded">
                  {emp.loginId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Employee"
        subtitle="System will automatically generate Login ID and temporary password."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                First Name <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Last Name <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Work Email <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@dayflow.com"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Job Position
              </label>
              <input
                type="text"
                value={formData.jobPosition}
                onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                placeholder="Senior Full Stack Engineer"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Temporary Password <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password@123"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Confirm Temporary Password <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Password@123"
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#E7E4E1]">
            <Button variant="outline" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createEmployeeMutation.isPending}>
              Create Employee & Generate ID
            </Button>
          </div>
        </form>
      </Modal>

      {/* CREATED CREDENTIALS ONE-TIME DISPLAY MODAL */}
      {createdCredentialsModal && (
        <Modal
          isOpen={!!createdCredentialsModal}
          onClose={() => setCreatedCredentialsModal(null)}
          title="Employee Created Successfully"
        >
          <div className="space-y-5 py-2">
            <div className="p-3.5 rounded-xl bg-[#3FA66B]/15 border border-[#3FA66B]/30 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-[#3FA66B] flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#252525]">Account Provisioned</p>
                <p className="text-[11px] text-[#6B6B6B]">
                  Temporary password will be displayed only once. Please copy or save it securely.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E7E4E1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                    GENERATED LOGIN ID
                  </span>
                  <p className="text-base font-mono font-bold text-[#714B67]">
                    {createdCredentialsModal.loginId}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={copiedLoginId ? <Check className="w-3.5 h-3.5 text-[#3FA66B]" /> : <Copy className="w-3.5 h-3.5" />}
                  onClick={() => copyToClipboard(createdCredentialsModal.loginId, 'login')}
                >
                  {copiedLoginId ? 'Copied' : 'COPY'}
                </Button>
              </div>

              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E7E4E1] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6B6B] tracking-wider">
                    TEMPORARY PASSWORD
                  </span>
                  <p className="text-base font-mono font-bold text-[#252525]">
                    {createdCredentialsModal.tempPass}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={copiedPass ? <Check className="w-3.5 h-3.5 text-[#3FA66B]" /> : <Copy className="w-3.5 h-3.5" />}
                  onClick={() => copyToClipboard(createdCredentialsModal.tempPass, 'pass')}
                >
                  {copiedPass ? 'Copied' : 'COPY'}
                </Button>
              </div>
            </div>

            <Button
              className="w-full py-2.5"
              onClick={() => setCreatedCredentialsModal(null)}
            >
              DONE
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
