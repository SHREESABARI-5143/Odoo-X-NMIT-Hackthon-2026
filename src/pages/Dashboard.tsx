import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { 
  Employee, Attendance, LeaveRequest, LeaveAllocation 
} from '../types';
import { 
  Clock, Calendar, Award, CheckSquare, PlusCircle, 
  UserCheck, Users, DollarSign, CalendarDays, ArrowRight,
  Settings as SettingsIcon
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export const Dashboard: React.FC = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  // Common stats & lists
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Employee specific states
  const [ownAllocations, setOwnAllocations] = useState<LeaveAllocation[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeCheckInTime, setActiveCheckInTime] = useState<string | null>(null);
  const [todayWorkHours, setTodayWorkHours] = useState<number>(0);
  const [checkInTimer, setCheckInTimer] = useState<string>('00:00:00');

  const [isCheckActionLoading, setIsCheckActionLoading] = useState(false);

  // Load all dashboard content
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (role === 'ADMIN') {
        const [empList, attList, leaveList] = await Promise.all([
          api.employees.getAll(),
          api.attendance.getAll(),
          api.timeOff.getAllRequests()
        ]);
        setEmployees(empList);
        setAttendances(attList);
        setLeaveRequests(leaveList);
      } else if (role === 'EMPLOYEE' && user?.employeeId) {
        const empId = user.employeeId;
        const [ownEmp, ownAtts, ownRequests, allocations] = await Promise.all([
          api.employees.getById(empId),
          api.attendance.getByEmployeeId(empId),
          api.timeOff.getByEmployeeId(empId),
          api.timeOff.getAllocations(empId)
        ]);

        setAttendances(ownAtts);
        setLeaveRequests(ownRequests);
        setOwnAllocations(allocations);

        // Check if currently checked in (active logs have checkIn but no checkOut)
        const active = ownAtts.find(a => a.date === new Date().toISOString().split('T')[0] && !a.checkOut);
        if (active) {
          setIsCheckedIn(true);
          setActiveCheckInTime(active.checkIn);
        } else {
          setIsCheckedIn(false);
          setActiveCheckInTime(null);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast('Failed to load dashboard data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, role]);

  // Live timer tick for check-in duration
  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn && activeCheckInTime) {
      const calculateDuration = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const checkInDate = new Date(`${todayStr}T${activeCheckInTime}`);
        const now = new Date();
        const diffMs = now.getTime() - checkInDate.getTime();
        
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          setCheckInTimer(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
        }
      };
      
      calculateDuration();
      interval = setInterval(calculateDuration, 1000);
    } else {
      setCheckInTimer('00:00:00');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, activeCheckInTime]);

  // Check In handler
  const handleCheckIn = async () => {
    if (!user?.employeeId) return;
    setIsCheckActionLoading(true);
    try {
      await api.attendance.checkIn(user.employeeId);
      toast('Checked in successfully.', 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Unable to check in.', 'error');
    } finally {
      setIsCheckActionLoading(false);
    }
  };

  // Check Out handler
  const handleCheckOut = async () => {
    if (!user?.employeeId) return;
    setIsCheckActionLoading(true);
    try {
      await api.attendance.checkOut(user.employeeId);
      toast('Checked out successfully.', 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Unable to check out.', 'error');
    } finally {
      setIsCheckActionLoading(false);
    }
  };

  // Dashboard Stats Calculations for Admin
  const todayStr = new Date().toISOString().split('T')[0];
  
  const totalEmployees = employees.length;
  const presentToday = employees.filter(e => e.status === 'PRESENT').length;
  const halfDayToday = employees.filter(e => e.status === 'HALF-DAY').length;
  const onLeaveToday = employees.filter(e => e.status === 'ON LEAVE').length;
  const absentToday = employees.filter(e => e.status === 'ABSENT').length;
  
  const pendingLeaveRequests = leaveRequests.filter(r => r.status === 'PENDING').length;
  
  // Total leaves remaining for Employee (Paid + Sick)
  const totalLeavesRemaining = ownAllocations.reduce((sum, a) => a.leaveType !== 'UNPAID_LEAVE' ? sum + a.remaining : sum, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-6 border border-border rounded-md shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hello, {user?.name}!</h1>
          <p className="text-text-secondary text-sm">
            {role === 'ADMIN' ? 'Admin Portal Dashboard' : 'Employee Self Service Dashboard'} • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {role === 'EMPLOYEE' && (
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isCheckedIn ? 'bg-status-present animate-pulse' : 'bg-status-rejected'}`} />
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              {isCheckedIn ? 'Status: Present' : 'Status: Checked Out'}
            </span>
          </div>
        )}
      </div>

      {/* RENDER ADMIN DASHBOARD */}
      {role === 'ADMIN' && (
        <>
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Employees</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-primary">{totalEmployees}</span>
                <Users className="w-6 h-6 text-primary/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Present Today</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-status-present">{presentToday}</span>
                <UserCheck className="w-6 h-6 text-status-present/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Half-day Today</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-status-halfday">{halfDayToday}</span>
                <Clock className="w-6 h-6 text-status-halfday/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">On Leave Today</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-status-onleave">{onLeaveToday}</span>
                <CalendarDays className="w-6 h-6 text-status-onleave/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Absent Today</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-text-secondary">{absentToday}</span>
                <Clock className="w-6 h-6 text-text-secondary/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Pending Leaves</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-status-pending">{pendingLeaveRequests}</span>
                <Calendar className="w-6 h-6 text-status-pending/40 shrink-0" />
              </div>
            </div>

          </div>

          {/* Quick Actions & Recent Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Pending Leave Approvals queue */}
            <div className="bg-white border border-border rounded-md shadow-sm flex flex-col lg:col-span-2 overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-card flex justify-between items-center">
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wide">Pending Time Off Requests</h3>
                <span className="bg-status-pending/10 text-status-pending text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingLeaveRequests} Pending
                </span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border max-h-[350px]">
                {leaveRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                  <div className="p-8 text-center text-text-secondary text-sm">
                    No pending leave requests to approve.
                  </div>
                ) : (
                  leaveRequests.filter(r => r.status === 'PENDING').map(req => (
                    <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-card/50 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-text-primary text-sm">{req.employeeName}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                          <span className="font-medium text-primary">Type: {req.leaveType.replace(/_/g, ' ')}</span>
                          <span>Dates: {req.startDate} to {req.endDate}</span>
                          <span className="font-semibold">Duration: {req.duration} days</span>
                        </div>
                        {req.remarks && <p className="text-xs italic text-text-secondary mt-1 bg-card p-2 rounded">"{req.remarks}"</p>}
                      </div>
                      <button 
                        onClick={() => navigate('/time-off')}
                        className="px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Quick actions panel */}
            <div className="bg-white border border-border rounded-md shadow-sm p-5 flex flex-col">
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wide mb-4 border-b border-border pb-2">Admin Shortcuts</h3>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <button 
                  onClick={() => navigate('/employees')} 
                  className="flex flex-col items-center justify-center p-4 border border-border rounded-md hover:bg-card transition-colors text-center gap-2 group"
                >
                  <PlusCircle className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-text-primary">Add Employee</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/payroll')} 
                  className="flex flex-col items-center justify-center p-4 border border-border rounded-md hover:bg-card transition-colors text-center gap-2 group"
                >
                  <DollarSign className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-text-primary">Manage Payroll</span>
                </button>
                <button 
                  onClick={() => navigate('/attendance')} 
                  className="flex flex-col items-center justify-center p-4 border border-border rounded-md hover:bg-card transition-colors text-center gap-2 group"
                >
                  <Clock className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-text-primary">Attendance Logs</span>
                </button>
                <button 
                  onClick={() => navigate('/settings')} 
                  className="flex flex-col items-center justify-center p-4 border border-border rounded-md hover:bg-card transition-colors text-center gap-2 group"
                >
                  <SettingsIcon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-text-primary">HR Settings</span>
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* RENDER EMPLOYEE DASHBOARD */}
      {role === 'EMPLOYEE' && (
        <>
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Leave Balance</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-primary">{totalLeavesRemaining} Days</span>
                <Calendar className="w-6 h-6 text-primary/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Pending Leaves</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-status-pending">
                  {leaveRequests.filter(r => r.status === 'PENDING').length} Requests
                </span>
                <Clock className="w-6 h-6 text-status-pending/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Attendances Logged</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-status-present">
                  {attendances.filter(a => a.status === 'PRESENT').length} Days
                </span>
                <UserCheck className="w-6 h-6 text-status-present/40 shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
              <span className="text-text-secondary text-xs font-bold uppercase tracking-wider">Working Days (Total)</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-3xl font-black text-text-secondary">{attendances.length} Days</span>
                <Clock className="w-6 h-6 text-text-secondary/40 shrink-0" />
              </div>
            </div>

          </div>

          {/* Core Check-in & Logs split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Quick Actions Check-In Check-Out timer */}
            <div className="bg-white border border-border rounded-md shadow-sm p-6 flex flex-col justify-between gap-6">
              <div>
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wide border-b border-border pb-2 mb-4">
                  Check-in / Check-out
                </h3>
                
                <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-md text-center">
                  <span className="text-xs text-text-secondary font-bold uppercase tracking-wide">TODAY'S SHIFT WORK HOURS</span>
                  <div className="text-3xl font-black text-primary font-mono my-3 tracking-wide">
                    {isCheckedIn ? checkInTimer : '00:00:00'}
                  </div>
                  {isCheckedIn && activeCheckInTime && (
                    <span className="text-xs text-status-present font-semibold">
                      Checked in at {activeCheckInTime}
                    </span>
                  )}
                  {!isCheckedIn && (
                    <span className="text-xs text-text-secondary italic">
                      You are currently checked out.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {!isCheckedIn ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckActionLoading}
                    className="flex-1 bg-status-present hover:bg-status-present/95 text-white font-bold py-3 uppercase tracking-wider text-sm rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isCheckActionLoading ? 'Please wait...' : 'Check In'}
                  </button>
                ) : (
                  <button
                    onClick={handleCheckOut}
                    disabled={isCheckActionLoading}
                    className="flex-1 bg-status-rejected hover:bg-status-rejected/95 text-white font-bold py-3 uppercase tracking-wider text-sm rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isCheckActionLoading ? 'Please wait...' : 'Check Out'}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Recent logs (Attendance & Time Off requests summaries) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Recent Attendances */}
              <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden flex-1">
                <div className="px-5 py-3 border-b border-border bg-card flex justify-between items-center">
                  <h3 className="font-bold text-text-primary text-xs uppercase tracking-wide">Recent Attendance Logs</h3>
                  <button 
                    onClick={() => navigate('/attendance')} 
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm divide-y divide-border">
                    <thead className="text-xs font-semibold uppercase tracking-wider text-text-secondary bg-card">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Check In</th>
                        <th className="px-4 py-2">Check Out</th>
                        <th className="px-4 py-2">Work Hours</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attendances.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">No attendance logs.</td>
                        </tr>
                      ) : (
                        attendances.slice(0, 4).map(att => (
                          <tr key={att.id} className="hover:bg-card/30">
                            <td className="px-4 py-2.5 font-medium">{att.date}</td>
                            <td className="px-4 py-2.5">{att.checkIn}</td>
                            <td className="px-4 py-2.5">{att.checkOut || '—'}</td>
                            <td className="px-4 py-2.5">{att.workHours !== undefined ? `${att.workHours}h` : '—'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${
                                att.status === 'PRESENT' ? 'bg-status-present/10 text-status-present' :
                                att.status === 'HALF-DAY' ? 'bg-status-halfday/10 text-status-halfday' :
                                'bg-status-rejected/10 text-status-rejected'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  att.status === 'PRESENT' ? 'bg-status-present' :
                                  att.status === 'HALF-DAY' ? 'bg-status-halfday' :
                                  'bg-status-rejected'
                                }`} />
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Leave Requests */}
              <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden flex-1">
                <div className="px-5 py-3 border-b border-border bg-card flex justify-between items-center">
                  <h3 className="font-bold text-text-primary text-xs uppercase tracking-wide">Recent Time Off Requests</h3>
                  <button 
                    onClick={() => navigate('/time-off')} 
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Request leave
                  </button>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-sm divide-y divide-border">
                    <thead className="text-xs font-semibold uppercase tracking-wider text-text-secondary bg-card">
                      <tr>
                        <th className="px-4 py-2">Leave Type</th>
                        <th className="px-4 py-2">Dates</th>
                        <th className="px-4 py-2">Duration</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leaveRequests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">No leave requests.</td>
                        </tr>
                      ) : (
                        leaveRequests.slice(0, 4).map(req => (
                          <tr key={req.id} className="hover:bg-card/30">
                            <td className="px-4 py-2.5 font-bold text-primary">{req.leaveType.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-2.5 text-xs">{req.startDate} to {req.endDate}</td>
                            <td className="px-4 py-2.5">{req.duration} days</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${
                                req.status === 'APPROVED' ? 'bg-status-approved/10 text-status-approved' :
                                req.status === 'PENDING' ? 'bg-status-pending/10 text-status-pending' :
                                'bg-status-rejected/10 text-status-rejected'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  req.status === 'APPROVED' ? 'bg-status-approved' :
                                  req.status === 'PENDING' ? 'bg-status-pending' :
                                  'bg-status-rejected'
                                }`} />
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};
export default Dashboard;
