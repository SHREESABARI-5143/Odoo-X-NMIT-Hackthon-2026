import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { LeaveRequest, LeaveAllocation, LeaveType } from '../types';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  CalendarDays, Plus, Check, X, Clipboard, FileText, Send, 
  ChevronLeft, ChevronRight, MessageSquare, AlertCircle 
} from 'lucide-react';

export const TimeOff: React.FC = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const isAdmin = role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'my' | 'calendar' | 'all' | 'allocations'>('my');
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);

  // Create Request Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('PAID_TIME_OFF');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState<string>('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Review Modal State (Admin only)
  const [reviewRequest, setReviewRequest] = useState<LeaveRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const loadTimeOffData = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        // Load all data for Admin
        const [allReqs, allAllocations] = await Promise.all([
          api.timeOff.getAllRequests(),
          // Load allocations for the first employee as dummy default list or simulated allocations
          api.timeOff.getAllocations(user?.employeeId || 'EMP001')
        ]);
        setRequests(allReqs);
        setAllocations(allAllocations);
        setActiveTab('all'); // Admin defaults to Review Requests
      } else if (user?.employeeId) {
        const [ownReqs, ownAllocations] = await Promise.all([
          api.timeOff.getByEmployeeId(user.employeeId),
          api.timeOff.getAllocations(user.employeeId)
        ]);
        setRequests(ownReqs);
        setAllocations(ownAllocations);
        setActiveTab('my');
      }
    } catch (err: any) {
      toast('Failed to load Time Off details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadTimeOffData();
  }, [user, role]);

  // Handle leave request creation
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.employeeId || !startDate || !endDate) return;
    
    // Validate date orders
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      toast('Start date cannot be after end date.', 'warning');
      return;
    }

    // Calculate duration in days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    setIsSubmitLoading(true);
    try {
      await api.timeOff.createRequest({
        employeeId: user.employeeId,
        leaveType,
        startDate,
        endDate,
        duration,
        remarks,
        attachmentUrl: attachment || undefined
      });

      toast('Leave request submitted successfully.', 'success');
      setIsRequestOpen(false);
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setRemarks('');
      setAttachment('');

      // Reload
      loadTimeOffData();
    } catch (err: any) {
      toast(err.message || 'Unable to submit leave request.', 'error');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Handle leave decision (Approval / Rejection)
  const handleReviewAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewRequest) return;
    if (status === 'REJECTED' && !reviewComment.trim()) {
      toast('Comment is required for rejection.', 'warning');
      return;
    }

    setIsReviewLoading(true);
    try {
      if (status === 'APPROVED') {
        await api.timeOff.approve(reviewRequest.id, reviewComment);
        toast('Leave request approved successfully.', 'success');
      } else {
        await api.timeOff.reject(reviewRequest.id, reviewComment);
        toast('Leave request rejected successfully.', 'success');
      }
      setReviewRequest(null);
      setReviewComment('');
      loadTimeOffData();
    } catch (err: any) {
      toast(err.message || 'Error processing request.', 'error');
    } finally {
      setIsReviewLoading(false);
    }
  };

  // Calendar Day cell rendering helper
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const blanks = Array.from({ length: firstDay });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden select-none">
        
        {/* Calendar Nav Header */}
        <div className="flex justify-between items-center bg-card p-4 border-b border-border">
          <button 
            onClick={() => setCalendarDate(new Date(year, month - 1))}
            className="p-1 border border-border bg-white rounded hover:bg-card text-text-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-text-primary text-sm">
            {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => setCalendarDate(new Date(year, month + 1))}
            className="p-1 border border-border bg-white rounded hover:bg-card text-text-secondary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-border bg-card">
          {weekdays.map(d => (
            <div key={d} className="px-2 py-3 text-center text-xs font-bold text-text-secondary uppercase">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-sm divide-x divide-y divide-border">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="min-h-[90px] bg-card/20" />
          ))}
          {days.map(day => {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Find active leave requests on this date
            const dayRequests = requests.filter(r => 
              dateString >= r.startDate && 
              dateString <= r.endDate &&
              (isAdmin || r.employeeId === user?.employeeId)
            );

            return (
              <div key={day} className="min-h-[90px] p-2 flex flex-col justify-between hover:bg-card/10 transition-colors">
                <span className="font-semibold text-text-secondary text-xs">{day}</span>
                
                {/* Leave labels */}
                <div className="flex flex-col gap-1 mt-1">
                  {dayRequests.slice(0, 3).map(req => (
                    <div 
                      key={req.id}
                      onClick={() => {
                        if (isAdmin && req.status === 'PENDING') {
                          setReviewRequest(req);
                        } else {
                          toast(`${req.employeeName}: ${req.leaveType.replace(/_/g, ' ')} (${req.status})`, 'info');
                        }
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border cursor-pointer ${
                        req.status === 'APPROVED' ? 'bg-status-approved/15 text-status-approved border-status-approved/30' :
                        req.status === 'PENDING' ? 'bg-status-pending/15 text-status-pending border-status-pending/30' :
                        'bg-status-rejected/15 text-status-rejected border-status-rejected/30'
                      }`}
                      title={`${req.employeeName}: ${req.remarks}`}
                    >
                      {isAdmin ? `${req.employeeName.split(' ')[0]}: ${req.leaveType.replace(/_LEAVE|_TIME_OFF/g, '')}` : req.leaveType.replace(/_LEAVE|_TIME_OFF/g, '')}
                    </div>
                  ))}
                  {dayRequests.length > 3 && (
                    <span className="text-[8px] text-text-secondary text-right font-medium">+{dayRequests.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  const renderStatus = (status: string) => {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border ${
        status === 'APPROVED' ? 'bg-status-approved/10 text-status-approved border-status-approved/20' :
        status === 'PENDING' ? 'bg-status-pending/10 text-status-pending border-status-pending/20' :
        'bg-status-rejected/10 text-status-rejected border-status-rejected/20'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === 'APPROVED' ? 'bg-status-approved' :
          status === 'PENDING' ? 'bg-status-pending' :
          'bg-status-rejected'
        }`} />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-border rounded-md shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Time Off & Leaves</h1>
          <p className="text-text-secondary text-sm">
            {isAdmin ? 'Manage leave request workflows and approvals.' : 'Check balances and file new leave requests.'}
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setIsRequestOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-4 py-2 rounded shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Leave Request</span>
          </button>
        )}
      </div>

      {/* Balance Summary Cards for Employees */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allocations.map(al => (
            <div key={al.id} className="bg-white p-5 border border-border rounded-md shadow-sm">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                {al.leaveType.replace(/_/g, ' ')}
              </span>
              <div className="flex justify-between items-end mt-2">
                <div>
                  <h4 className="text-2xl font-black text-primary">{al.remaining} Days</h4>
                  <span className="text-xs text-text-secondary">Remaining of {al.allocated} allocated</span>
                </div>
                <span className="text-xs font-semibold text-text-secondary italic">{al.used} used</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Tabs */}
      <div className="border-b border-border bg-white rounded-t-md flex overflow-x-auto shadow-sm select-none">
        {!isAdmin && (
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
              activeTab === 'my' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>My Requests</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
            activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Leave Calendar</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
                activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Review Requests</span>
            </button>

            <button
              onClick={() => setActiveTab('allocations')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm shrink-0 transition-colors ${
                activeTab === 'allocations' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Balances</span>
            </button>
          </>
        )}
      </div>

      {/* TABS CONTENT CONTAINER */}
      <div className="bg-white border border-t-0 border-border rounded-b-md shadow-sm p-6 min-h-[300px]">
        
        {/* TAB: My Requests */}
        {activeTab === 'my' && !isAdmin && (
          <Table<LeaveRequest>
            headers={[
              { key: 'leaveType', label: 'Leave Type' },
              { key: 'startDate', label: 'Start Date' },
              { key: 'endDate', label: 'End Date' },
              { key: 'duration', label: 'Duration', align: 'center' },
              { key: 'remarks', label: 'Remarks' },
              { key: 'status', label: 'Status' }
            ]}
            data={requests}
            renderRow={(req) => (
              <tr key={req.id} className="hover:bg-card/25 transition-colors">
                <td className="px-6 py-4 font-bold text-primary">{req.leaveType.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4 text-text-primary">{req.startDate}</td>
                <td className="px-6 py-4 text-text-primary">{req.endDate}</td>
                <td className="px-6 py-4 text-center font-semibold">{req.duration} days</td>
                <td className="px-6 py-4 text-text-secondary italic">
                  {req.remarks ? `"${req.remarks}"` : '—'}
                  {req.decisionComment && (
                    <div className="text-[10px] text-text-secondary font-medium font-sans mt-1 bg-card p-1.5 rounded flex items-center gap-1 border border-border">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Comment: "{req.decisionComment}"</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{renderStatus(req.status)}</td>
              </tr>
            )}
            emptyMessage="You haven't submitted any leave requests yet."
          />
        )}

        {/* TAB: Calendar */}
        {activeTab === 'calendar' && renderCalendar()}

        {/* TAB: Review Requests (Admin only) */}
        {activeTab === 'all' && isAdmin && (
          <Table<LeaveRequest>
            headers={[
              { key: 'employeeName', label: 'Employee' },
              { key: 'leaveType', label: 'Leave Type' },
              { key: 'startDate', label: 'Start Date' },
              { key: 'endDate', label: 'End Date' },
              { key: 'duration', label: 'Duration', align: 'center' },
              { key: 'remarks', label: 'Remarks' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '' }
            ]}
            data={requests}
            renderRow={(req) => (
              <tr key={req.id} className="hover:bg-card/25 transition-colors">
                <td className="px-6 py-4 font-bold text-text-primary">{req.employeeName}</td>
                <td className="px-6 py-4 font-medium text-primary">{req.leaveType.replace(/_/g, ' ')}</td>
                <td className="px-6 py-4 text-text-primary">{req.startDate}</td>
                <td className="px-6 py-4 text-text-primary">{req.endDate}</td>
                <td className="px-6 py-4 text-center font-bold text-text-primary">{req.duration} days</td>
                <td className="px-6 py-4 text-text-secondary italic">
                  {req.remarks ? `"${req.remarks}"` : '—'}
                  {req.decisionComment && (
                    <div className="text-[10px] text-text-secondary font-medium font-sans mt-1 bg-card p-1.5 rounded flex items-center gap-1 border border-border">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Decision: "{req.decisionComment}"</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{renderStatus(req.status)}</td>
                <td className="px-6 py-4 text-right">
                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => setReviewRequest(req)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded shadow transition-all flex items-center gap-1 ml-auto"
                    >
                      <span>Review</span>
                    </button>
                  )}
                </td>
              </tr>
            )}
            emptyMessage="No pending or submitted requests found."
          />
        )}

        {/* TAB: Balances (Admin only) */}
        {activeTab === 'allocations' && isAdmin && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-card rounded border border-border text-xs text-text-secondary">
              Review allocations and balances for employee <b>EMP001 (John Doe)</b> as example context:
            </div>
            <Table<LeaveAllocation>
              headers={[
                { key: 'leaveType', label: 'Leave Type' },
                { key: 'allocated', label: 'Allocated' },
                { key: 'used', label: 'Used' },
                { key: 'remaining', label: 'Remaining' }
              ]}
              data={allocations}
              renderRow={(al) => (
                <tr key={al.id} className="hover:bg-card/25 transition-colors">
                  <td className="px-6 py-4 font-bold text-text-primary">{al.leaveType.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 text-text-primary">{al.allocated} days</td>
                  <td className="px-6 py-4 text-text-secondary">{al.used} days</td>
                  <td className="px-6 py-4 font-bold text-primary">{al.remaining} days</td>
                </tr>
              )}
            />
          </div>
        )}

      </div>

      {/* CREATE LEAVE REQUEST MODAL */}
      <Modal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        title="File New Leave Request"
        size="md"
      >
        <form onSubmit={handleRequestSubmit} className="flex flex-col gap-4">
          {/* Leave Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Leave Type <span className="text-status-error">*</span></label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="border border-border rounded text-sm px-3 py-2 bg-white text-text-primary focus:outline-none"
              required
            >
              <option value="PAID_TIME_OFF">Paid Time Off</option>
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="UNPAID_LEAVE">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Start Date <span className="text-status-error">*</span></label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 bg-white focus:outline-none"
                required
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">End Date <span className="text-status-error">*</span></label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-border rounded text-sm px-3 py-2 bg-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Remarks / Explanation</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide reason for leave"
              rows={3}
              className="border border-border rounded text-sm px-3 py-2 bg-white focus:outline-none resize-none"
            />
          </div>

          {/* Attachment */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Supporting Attachment (Optional)</label>
            <input
              type="text"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
              placeholder="https://example.com/certificate.pdf"
              className="border border-border rounded text-sm px-3 py-2 bg-white focus:outline-none"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setIsRequestOpen(false)}
              className="px-4 py-2 border border-border rounded text-sm hover:bg-card text-text-primary"
              disabled={isSubmitLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded shadow transition-colors flex items-center gap-1.5"
              disabled={isSubmitLoading}
            >
              <Send className="w-4 h-4" />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* REVIEW REQUEST MODAL (Admin only) */}
      <Modal
        isOpen={reviewRequest !== null}
        onClose={() => setReviewRequest(null)}
        title="Review Time Off Request"
        size="md"
      >
        {reviewRequest && (
          <div className="flex flex-col gap-4">
            
            <div className="bg-card p-4 rounded border border-border flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-bold text-text-primary">{reviewRequest.employeeName}</span>
                <span className="text-xs text-text-secondary font-mono">{reviewRequest.id}</span>
              </div>
              <div className="text-xs text-text-secondary flex flex-col gap-1 border-t border-border/60 pt-2 mt-1">
                <span><b>Leave Type:</b> {reviewRequest.leaveType.replace(/_/g, ' ')}</span>
                <span><b>Requested Dates:</b> {reviewRequest.startDate} to {reviewRequest.endDate}</span>
                <span><b>Total Duration:</b> {reviewRequest.duration} Days</span>
                {reviewRequest.remarks && <span className="mt-1 bg-white p-2 rounded border border-border/40 italic">"{reviewRequest.remarks}"</span>}
              </div>
            </div>

            {/* Decision Comments */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Decision Comment / Reason</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Required for rejection, optional for approval"
                rows={2}
                className="border border-border rounded text-sm px-3 py-2 bg-white focus:outline-none resize-none"
              />
            </div>

            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setReviewRequest(null)}
                className="px-4 py-2 border border-border rounded text-sm hover:bg-card text-text-primary"
                disabled={isReviewLoading}
              >
                Cancel
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleReviewAction('REJECTED')}
                  className="px-4 py-2 bg-status-rejected hover:bg-status-rejected/95 text-white text-sm font-bold rounded shadow transition-colors flex items-center gap-1"
                  disabled={isReviewLoading}
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewAction('APPROVED')}
                  className="px-4 py-2 bg-status-approved hover:bg-status-approved/95 text-white text-sm font-bold rounded shadow transition-colors flex items-center gap-1"
                  disabled={isReviewLoading}
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};
export default TimeOff;
