import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Employee, EmployeeStatus } from '../types';
import { 
  Search, Filter, Plus, Grid, List, Check, Copy, UserCheck, 
  MapPin, Briefcase, Mail, Phone, Calendar, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export const Employees: React.FC = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Create Employee Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('Dayflow Inc.');
  const [departmentForm, setDepartmentForm] = useState('Engineering');
  const [jobPosition, setJobPosition] = useState('Software Developer');
  const [locationForm, setLocationForm] = useState('San Francisco, CA');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [profilePicture, setProfilePicture] = useState('');

  // Create success credential modal state
  const [createdCredentials, setCreatedCredentials] = useState<{ loginId: string; tempPass: string } | null>(null);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const list = await api.employees.getAll(search, {
        department,
        location,
        status
      });
      setEmployees(list);
    } catch (err: any) {
      toast('Failed to load employee list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department, location, status]);

  const handleClearFilters = () => {
    setSearch('');
    setDepartment('');
    setLocation('');
    setStatus('');
    toast('Filters cleared.', 'info');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      toast('Please enter the required fields.', 'warning');
      return;
    }

    setIsSubmitLoading(true);
    try {
      const response = await api.employees.create({
        loginId: email,
        firstName,
        lastName,
        email,
        phone,
        company,
        department: departmentForm,
        jobPosition,
        location: locationForm,
        dateOfJoining,
        profilePicture: profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
      });

      toast('Employee account successfully created.', 'success');
      
      // Open credentials view modal
      setCreatedCredentials({
        loginId: response.employee.email,
        tempPass: response.tempPassword
      });

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setProfilePicture('');
      
      // Close creation modal
      setIsCreateOpen(false);
      // Reload employees
      fetchEmployees();
    } catch (err: any) {
      toast(err.message || 'Failed to create employee.', 'error');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'login' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'login') {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
    toast('Copied to clipboard.', 'success');
  };

  // Status Badge Helper
  const renderStatusBadge = (empStatus: EmployeeStatus) => {
    const colorClasses = 
      empStatus === 'PRESENT' ? 'bg-status-present/10 text-status-present border-status-present' :
      empStatus === 'HALF-DAY' ? 'bg-status-halfday/10 text-status-halfday border-status-halfday' :
      empStatus === 'ON LEAVE' ? 'bg-status-onleave/10 text-status-onleave border-status-onleave' :
      'bg-status-rejected/10 text-status-rejected border-status-rejected'; // ABSENT
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-bold ${colorClasses}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          empStatus === 'PRESENT' ? 'bg-status-present' :
          empStatus === 'HALF-DAY' ? 'bg-status-halfday' :
          empStatus === 'ON LEAVE' ? 'bg-status-onleave' :
          'bg-status-rejected'
        }`} />
        {empStatus.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-border rounded-md shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Employee Directory</h1>
          <p className="text-text-secondary text-sm">Search and view company staff records.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-border rounded overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-card text-primary' : 'bg-white text-text-secondary hover:text-text-primary'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-card text-primary' : 'bg-white text-text-secondary hover:text-text-primary'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create Button (Admin only) */}
          {role === 'ADMIN' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-4 py-2 rounded shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search employees by name, code, job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-border rounded text-sm focus:outline-none focus:border-primary bg-white"
          />
        </div>

        {/* Department Filter */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="border border-border rounded text-sm px-3 py-1.5 bg-white text-text-primary focus:outline-none"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Product">Product</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
        </select>

        {/* Location Filter */}
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border border-border rounded text-sm px-3 py-1.5 bg-white text-text-primary focus:outline-none"
        >
          <option value="">All Locations</option>
          <option value="San Francisco, CA">San Francisco, CA</option>
          <option value="New York, NY">New York, NY</option>
          <option value="Remote">Remote</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-border rounded text-sm px-3 py-1.5 bg-white text-text-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="HALF-DAY">Half-day</option>
          <option value="ON LEAVE">On Leave</option>
          <option value="ABSENT">Absent</option>
        </select>

        {/* Clear Filters */}
        <button
          onClick={handleClearFilters}
          className="text-text-secondary hover:text-text-primary text-sm font-semibold px-2 py-1.5 transition-colors border border-transparent hover:border-border rounded"
        >
          Clear
        </button>
      </div>

      {/* Directory Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white border border-border rounded-md p-12 text-center text-text-secondary">
          No employees found matching the filters.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map(emp => (
            <div 
              key={emp.id}
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white border border-border hover:border-primary/40 rounded-md shadow-sm p-5 flex gap-4 cursor-pointer hover:shadow-md transition-all duration-200"
            >
              <img 
                src={emp.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                alt={`${emp.firstName} ${emp.lastName}`} 
                className="w-16 h-16 rounded-full object-cover shrink-0 border border-border" 
              />
              
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-bold text-text-primary text-sm truncate">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <span className="text-xs text-text-secondary font-mono">{emp.code}</span>
                  </div>
                  <p className="text-xs text-text-secondary font-medium truncate mt-0.5">{emp.jobPosition}</p>
                  <p className="text-xs text-primary font-semibold mt-1">{emp.department}</p>
                </div>
                
                <div className="flex items-center justify-between mt-3 border-t border-border/60 pt-2.5">
                  <span className="text-[11px] text-text-secondary flex items-center gap-0.5 truncate">
                    <MapPin className="w-3 h-3 text-text-secondary" />
                    {emp.location}
                  </span>
                  {renderStatusBadge(emp.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-border rounded-md shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-border">
            <thead className="bg-card text-xs uppercase tracking-wider text-text-secondary font-bold">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Job Title</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map(emp => (
                <tr 
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-card/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img 
                      src={emp.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover border border-border" 
                    />
                    <span className="font-bold text-text-primary">
                      {emp.firstName} {emp.lastName}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{emp.code}</td>
                  <td className="px-6 py-4 text-text-secondary">{emp.jobPosition}</td>
                  <td className="px-6 py-4 font-semibold text-primary">{emp.department}</td>
                  <td className="px-6 py-4 text-text-secondary">{emp.location}</td>
                  <td className="px-6 py-4">{renderStatusBadge(emp.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 rounded hover:bg-card text-text-secondary hover:text-text-primary">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Employee"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">First Name <span className="text-status-error">*</span></label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                required
                disabled={isSubmitLoading}
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Last Name <span className="text-status-error">*</span></label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                required
                disabled={isSubmitLoading}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Corporate Email <span className="text-status-error">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                required
                disabled={isSubmitLoading}
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Mobile Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                disabled={isSubmitLoading}
              />
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Department</label>
              <select
                value={departmentForm}
                onChange={(e) => setDepartmentForm(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                disabled={isSubmitLoading}
              >
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            {/* Job Position */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Job Position</label>
              <input
                type="text"
                value={jobPosition}
                onChange={(e) => setJobPosition(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                disabled={isSubmitLoading}
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Location</label>
              <input
                type="text"
                value={locationForm}
                onChange={(e) => setLocationForm(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                disabled={isSubmitLoading}
              />
            </div>

            {/* Date of Joining */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Date of Joining</label>
              <input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                disabled={isSubmitLoading}
              />
            </div>

            {/* Profile Picture URL */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-bold text-text-secondary uppercase">Profile Picture URL</label>
              <input
                type="text"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="border border-border rounded text-sm px-3 py-2 focus:outline-none focus:border-primary bg-white"
                disabled={isSubmitLoading}
              />
            </div>

          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-border rounded text-sm hover:bg-card transition-colors text-text-primary"
              disabled={isSubmitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded shadow transition-colors flex items-center gap-1.5"
              disabled={isSubmitLoading}
            >
              {isSubmitLoading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CREDENTIAL SUCCESS MODAL */}
      <Modal
        isOpen={createdCredentials !== null}
        onClose={() => setCreatedCredentials(null)}
        title="Employee Account Created"
        size="sm"
      >
        {createdCredentials && (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-status-present/10 rounded flex items-center gap-2 border border-status-present/30">
              <UserCheck className="w-5 h-5 text-status-present shrink-0" />
              <span className="text-sm font-bold text-status-present">Created Successfully!</span>
            </div>
            
            <p className="text-xs text-text-secondary">
              The employee account has been created. Provide these temporary credentials to the employee to sign in:
            </p>

            <div className="flex flex-col gap-3 mt-2">
              {/* Login ID */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Login ID / Corporate Email</span>
                <div className="flex border border-border rounded bg-card overflow-hidden">
                  <span className="flex-1 px-3 py-2 text-xs font-mono select-all truncate">{createdCredentials.loginId}</span>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(createdCredentials.loginId, 'login')}
                    className="p-2 border-l border-border bg-white hover:bg-card transition-colors text-text-secondary"
                  >
                    {copiedLogin ? <Check className="w-4 h-4 text-status-present" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Temporary Password */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Temporary Password</span>
                <div className="flex border border-border rounded bg-card overflow-hidden">
                  <span className="flex-1 px-3 py-2 text-xs font-mono select-all truncate">{createdCredentials.tempPass}</span>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(createdCredentials.tempPass, 'pass')}
                    className="p-2 border-l border-border bg-white hover:bg-card transition-colors text-text-secondary"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-status-present" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-status-pending/10 rounded flex items-start gap-2 border border-status-pending/30 mt-2">
              <ShieldAlert className="w-5 h-5 text-status-pending shrink-0" />
              <p className="text-[11px] font-medium text-status-pending leading-relaxed">
                <b>Caution:</b> This temporary password is only shown now. Make sure to copy it before closing this dialog. The employee will be forced to change this on their first login.
              </p>
            </div>

            <button
              onClick={() => setCreatedCredentials(null)}
              className="mt-4 w-full bg-primary hover:bg-primary-hover text-white py-2 text-sm font-bold uppercase rounded shadow transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default Employees;
