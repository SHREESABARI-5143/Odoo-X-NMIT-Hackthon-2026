import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { leaveApi } from '../api/leaveApi';
import { LeaveBalanceStrip } from '../components/ui/LeaveBalanceStrip';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CalendarDays, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const TimeOff: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');

  // Form State for Leave Request
  const [requestForm, setRequestForm] = useState({
    leaveType: 'Paid',
    startDate: '',
    endDate: '',
    reason: '',
  });

  // Calculate Duration
  const calculateDuration = () => {
    if (!requestForm.startDate || !requestForm.endDate) return 0;
    const start = new Date(requestForm.startDate);
    const end = new Date(requestForm.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatedDays = calculateDuration();

  // Queries
  const { data: myLeavesData, isLoading: isLoadingMyLeaves } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: leaveApi.getMyLeaves,
  });

  const { data: allLeaves, isLoading: isLoadingAllLeaves } = useQuery({
    queryKey: ['allLeaves'],
    queryFn: leaveApi.getAllLeaves,
    enabled: isAdmin,
  });

  // Mutations
  const requestLeaveMutation = useMutation({
    mutationFn: leaveApi.requestLeave,
    onSuccess: (data) => {
      showToast(data.message || 'Leave request submitted.', 'success');
      setRequestModalOpen(false);
      setRequestForm({ leaveType: 'Paid', startDate: '', endDate: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to submit leave request.';
      showToast(msg, 'error');
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      leaveApi.approveLeave(id, comment),
    onSuccess: (data) => {
      showToast(data.message || 'Leave approved.', 'success');
      queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
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
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'A rejection comment is required.', 'error');
    },
  });

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedDays <= 0) {
      showToast('End date must be on or after start date.', 'error');
      return;
    }
    requestLeaveMutation.mutate(requestForm);
  };

  const leaveList = isAdmin ? allLeaves : myLeavesData?.requests;
  const isLoading = isAdmin ? isLoadingAllLeaves : isLoadingMyLeaves;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#252525]">Time Off & Leave Workflow</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Submit leave requests, check allocation balances, and review team time-off schedule.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setRequestModalOpen(true)}
        >
          New Leave Request
        </Button>
      </div>

      {/* Leave Allocations Strip (for regular user) */}
      {myLeavesData?.allocation && (
        <div className="bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
            Your Leave Allocations (Year 2026)
          </h3>
          <LeaveBalanceStrip
            paid={myLeavesData.allocation.paid}
            sick={myLeavesData.allocation.sick}
            unpaid={myLeavesData.allocation.unpaid}
          />
        </div>
      )}

      {/* Leave Requests Table Header */}
      <div className="bg-white p-4 rounded-xl border border-[#E7E4E1] flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252525]">
          <CalendarDays className="w-4 h-4 text-[#714B67]" />
          {isAdmin ? 'All Organization Leave Requests' : 'Your Submitted Leave Requests'}
        </div>
      </div>

      {/* Leave Requests Table */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : !leaveList || leaveList.length === 0 ? (
        <EmptyState title="No leave requests found." description="Click 'New Leave Request' to submit a time-off application." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E4E1] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  {isAdmin && <th className="p-3.5">Employee</th>}
                  <th className="p-3.5">Leave Type</th>
                  <th className="p-3.5">Start Date</th>
                  <th className="p-3.5">End Date</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Manager Comment</th>
                  {isAdmin && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4E1]">
                {leaveList.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    {isAdmin && (
                      <td className="p-3.5 font-bold text-[#252525]">
                        {leave.employeeName}
                        <span className="block text-[10px] text-[#6B6B6B] font-mono">
                          {leave.employeeLoginId}
                        </span>
                      </td>
                    )}
                    <td className="p-3.5 font-semibold text-[#714B67]">{leave.leaveType}</td>
                    <td className="p-3.5 font-mono text-[#252525]">{leave.startDate}</td>
                    <td className="p-3.5 font-mono text-[#252525]">{leave.endDate}</td>
                    <td className="p-3.5 font-bold">{leave.duration} day(s)</td>
                    <td className="p-3.5 text-[#6B6B6B] max-w-xs truncate">{leave.reason || 'N/A'}</td>
                    <td className="p-3.5">
                      <StatusBadge status={leave.status} size="sm" />
                    </td>
                    <td className="p-3.5 text-xs italic text-[#6B6B6B] max-w-xs">
                      {leave.rejectionComment ? (
                        <span className="text-[#D85C5C] font-medium font-sans">
                          "{leave.rejectionComment}"
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-3.5 text-right space-x-2">
                        {leave.status === 'PENDING' && (
                          <>
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
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUEST LEAVE MODAL */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Apply for Time Off"
        subtitle="Duration will be calculated automatically."
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">
              Leave Type <span className="text-[#D85C5C]">*</span>
            </label>
            <select
              value={requestForm.leaveType}
              onChange={(e) => setRequestForm({ ...requestForm, leaveType: e.target.value })}
              className="w-full p-2.5 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
            >
              <option value="Paid">Paid Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Start Date <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="date"
                required
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                End Date <span className="text-[#D85C5C]">*</span>
              </label>
              <input
                type="date"
                required
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          {calculatedDays > 0 && (
            <div className="p-3 rounded-lg bg-[#FFF1E2] border border-[#F6A23A]/30 text-xs font-bold text-[#714B67]">
              Total Duration: {calculatedDays} day(s)
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#252525] mb-1">
              Reason for Time Off
            </label>
            <textarea
              rows={3}
              value={requestForm.reason}
              onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              placeholder="State brief context for your request..."
              className="w-full p-2.5 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E4E1]">
            <Button variant="outline" size="sm" type="button" onClick={() => setRequestModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={requestLeaveMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* MANDATORY REJECTION COMMENT MODAL */}
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
