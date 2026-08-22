import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { attendanceApi } from '../api/attendanceApi';
import { leaveApi } from '../api/leaveApi';
import { employeeApi } from '../api/employeeApi';
import { payrollApi } from '../api/payrollApi';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkdayRing } from '../components/ui/WorkdayRing';
import { WorkdayPulse } from '../components/ui/WorkdayPulse';
import { LeaveBalanceStrip } from '../components/ui/LeaveBalanceStrip';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Users, Clock, CalendarDays, WalletCards, UserPlus, CheckCircle, XCircle, LogIn, LogOut } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');

  // Fetch today's attendance status
  const { data: todayData, isLoading: isLoadingToday } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: attendanceApi.getToday,
  });

  // Fetch leave balances & requests for employee
  const { data: leaveData } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: leaveApi.getMyLeaves,
    enabled: !isAdmin,
  });

  // Fetch admin dashboard stats
  const { data: employeesData } = useQuery({
    queryKey: ['employeesList'],
    queryFn: () => employeeApi.getEmployees(),
    enabled: isAdmin,
  });

  const { data: allLeaves } = useQuery({
    queryKey: ['allLeaves'],
    queryFn: leaveApi.getAllLeaves,
    enabled: isAdmin,
  });

  const { data: payrollData } = useQuery({
    queryKey: ['payrollDashboard'],
    queryFn: () => payrollApi.getPayrollDashboard(),
    enabled: isAdmin,
  });

  // Mutations for Check-In and Check-Out
  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: (data) => {
      showToast(data.message || 'Checked in successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Check-in failed.', 'error');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: (data) => {
      showToast(data.message || 'Checked out successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Check-out failed.', 'error');
    },
  });

  // Mutations for Admin Leave Approve / Reject
  const approveLeaveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      leaveApi.approveLeave(id, comment),
    onSuccess: (data) => {
      showToast(data.message || 'Leave approved.', 'success');
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['employeesList'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to approve leave.', 'error');
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      leaveApi.rejectLeave(id, comment),
    onSuccess: (data) => {
      showToast(data.message || 'Leave rejected.', 'success');
      setRejectModalOpen(false);
      setRejectionComment('');
      setSelectedLeaveId(null);
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'A rejection comment is required.', 'error');
    },
  });

  const attendanceRecord = todayData?.attendance;
  const isCheckedIn = !!(attendanceRecord?.checkIn && !attendanceRecord?.checkOut);

  // Stats calculation for Admin
  const totalEmployees = employeesData?.length || 0;
  const presentToday = employeesData?.filter((e: any) => e.todayStatus === 'PRESENT').length || 0;
  const halfDaysToday = employeesData?.filter((e: any) => e.todayStatus === 'HALF_DAY').length || 0;
  const onLeaveToday = employeesData?.filter((e: any) => e.todayStatus === 'ON_LEAVE').length || 0;
  const absentToday = employeesData?.filter((e: any) => e.todayStatus === 'ABSENT').length || 0;

  const pendingLeaves = allLeaves?.filter((l: any) => l.status === 'PENDING') || [];

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-[#252525]">
            Good morning, {user?.firstName}!
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5 font-medium">
            {isAdmin ? "Here is today's HR operational summary." : "Here's your workday at a glance."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <Button
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => navigate('/employees?action=create')}
              >
                Create Employee
              </Button>
              <Button
                variant="outline"
                icon={<WalletCards className="w-4 h-4" />}
                onClick={() => navigate('/admin/payroll')}
              >
                Payroll Dashboard
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              icon={<CalendarDays className="w-4 h-4" />}
              onClick={() => navigate('/time-off')}
            >
              Request Time Off
            </Button>
          )}
        </div>
      </div>

      {/* EMPLOYEE DASHBOARD VIEW */}
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Attendance Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B]">
                  TODAY'S STATUS
                </span>
                <div className="mt-2">
                  <StatusBadge status={attendanceRecord?.status || 'NOT STARTED'} />
                </div>
              </div>
              <WorkdayRing
                workHoursMins={attendanceRecord?.workHoursMins || 0}
                isCheckedIn={isCheckedIn}
              />
            </div>

            <WorkdayPulse
              checkInTime={attendanceRecord?.checkIn}
              checkOutTime={attendanceRecord?.checkOut}
              status={attendanceRecord?.status}
            />

            <div className="pt-4 border-t border-[#E7E4E1] flex flex-wrap items-center justify-between gap-4">
              <div>
                {attendanceRecord?.checkIn ? (
                  <p className="text-xs font-semibold text-[#252525]">
                    Since:{' '}
                    <span className="text-[#714B67] font-bold">
                      {attendanceRecord.checkIn}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-[#6B6B6B]">Not checked in yet today.</p>
                )}
              </div>
              <div>
                {!isCheckedIn ? (
                  <Button
                    icon={<LogIn className="w-4 h-4" />}
                    isLoading={checkInMutation.isPending}
                    onClick={() => checkInMutation.mutate()}
                  >
                    CHECK IN →
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    icon={<LogOut className="w-4 h-4" />}
                    isLoading={checkOutMutation.isPending}
                    onClick={() => checkOutMutation.mutate()}
                  >
                    CHECK OUT →
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Leave Balances Strip */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#252525]">Leave Balances</h3>
            {leaveData ? (
              <LeaveBalanceStrip
                paid={leaveData.allocation.paid}
                sick={leaveData.allocation.sick}
                unpaid={leaveData.allocation.unpaid}
              />
            ) : (
              <CardSkeleton />
            )}
          </div>
        </div>
      )}

      {/* ADMIN / HR DASHBOARD VIEW */}
      {isAdmin && (
        <>
          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] shadow-2xs">
              <span className="text-xs text-[#6B6B6B] font-semibold">TOTAL EMPLOYEES</span>
              <p className="text-2xl font-bold text-[#252525] mt-1">{totalEmployees}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] shadow-2xs">
              <span className="text-xs text-[#3FA66B] font-semibold">PRESENT TODAY</span>
              <p className="text-2xl font-bold text-[#3FA66B] mt-1">{presentToday}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] shadow-2xs">
              <span className="text-xs text-[#F6A23A] font-semibold">HALF-DAY</span>
              <p className="text-2xl font-bold text-[#F6A23A] mt-1">{halfDaysToday}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] shadow-2xs">
              <span className="text-xs text-[#4F7CAC] font-semibold">ON LEAVE</span>
              <p className="text-2xl font-bold text-[#4F7CAC] mt-1">{onLeaveToday}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] shadow-2xs">
              <span className="text-xs text-[#E5A72A] font-semibold">ABSENT</span>
              <p className="text-2xl font-bold text-[#E5A72A] mt-1">{absentToday}</p>
            </div>
          </div>

          {/* Pending Leave Requests Section */}
          <div className="bg-white rounded-2xl border border-[#E7E4E1] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#252525] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F6A23A]" /> Pending Leave Approvals ({pendingLeaves.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/time-off')}
              >
                View All
              </Button>
            </div>

            {pendingLeaves.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] italic py-4">No pending leave requests.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F7F5] text-[#6B6B6B] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E4E1]">
                    {pendingLeaves.map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-[#F7F7F5]/60 transition-colors">
                        <td className="p-3 font-semibold text-[#252525]">
                          {leave.employeeName}
                          <span className="block text-[10px] text-[#6B6B6B]">
                            {leave.employeeLoginId}
                          </span>
                        </td>
                        <td className="p-3">{leave.leaveType}</td>
                        <td className="p-3 font-mono">
                          {leave.startDate} → {leave.endDate}
                        </td>
                        <td className="p-3 font-semibold">{leave.duration} day(s)</td>
                        <td className="p-3 text-[#6B6B6B] max-w-xs truncate">
                          {leave.reason || 'No reason provided'}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            size="sm"
                            icon={<CheckCircle className="w-3.5 h-3.5" />}
                            isLoading={approveLeaveMutation.isPending}
                            onClick={() => approveLeaveMutation.mutate({ id: leave.id })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setSelectedLeaveId(leave.id);
                              setRejectModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mandatory Rejection Comment Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectionComment('');
          setSelectedLeaveId(null);
        }}
        title="Reject Leave Request"
        subtitle="A rejection comment is required before rejecting this request."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1.5">
              Rejection Comment <span className="text-[#D85C5C]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              placeholder="State the explicit reason for rejecting this leave request..."
              className="w-full p-2.5 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionComment('');
                setSelectedLeaveId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={rejectLeaveMutation.isPending}
              onClick={() => {
                if (selectedLeaveId) {
                  rejectLeaveMutation.mutate({
                    id: selectedLeaveId,
                    comment: rejectionComment,
                  });
                }
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
