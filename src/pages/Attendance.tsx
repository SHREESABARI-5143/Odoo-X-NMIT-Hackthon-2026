import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Attendance } from '../types';
import { Table } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  Search, Clock, CalendarDays, ChevronLeft, ChevronRight, CheckCircle, 
  AlertTriangle, AlertCircle, Play, Square 
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  // Filtering states
  const [search, setSearch] = useState('');
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('month');
  
  // Date period navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Quick Check In/Out in header (for Employee)
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeCheckInTime, setActiveCheckInTime] = useState<string | null>(null);
  const [isCheckLoading, setIsCheckLoading] = useState(false);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      if (role === 'ADMIN') {
        const list = await api.attendance.getAll(search, month, year);
        setAttendances(list);
      } else if (role === 'EMPLOYEE' && user?.employeeId) {
        const list = await api.attendance.getByEmployeeId(user.employeeId);
        
        // Filter own by month/year manually
        const filtered = list.filter(a => {
          const [y, m] = a.date.split('-');
          return Number(y) === year && Number(m) === month;
        });
        setAttendances(filtered);

        // Check if currently checked in today
        const todayStr = new Date().toISOString().split('T')[0];
        const active = list.find(a => a.date === todayStr && !a.checkOut);
        if (active) {
          setIsCheckedIn(true);
          setActiveCheckInTime(active.checkIn);
        } else {
          setIsCheckedIn(false);
          setActiveCheckInTime(null);
        }
      }
    } catch (err: any) {
      toast('Failed to load attendance logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [search, currentDate, role, user]);

  const handlePreviousPeriod = () => {
    const nextDate = new Date(currentDate);
    if (currentView === 'month') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (currentView === 'week') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setDate(nextDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNextPeriod = () => {
    const nextDate = new Date(currentDate);
    if (currentView === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (currentView === 'week') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleCheckIn = async () => {
    if (!user?.employeeId) return;
    setIsCheckLoading(true);
    try {
      await api.attendance.checkIn(user.employeeId);
      toast('Checked in successfully.', 'success');
      fetchAttendance();
    } catch (err: any) {
      toast(err.message || 'Check-in failed.', 'error');
    } finally {
      setIsCheckLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.employeeId) return;
    setIsCheckLoading(true);
    try {
      await api.attendance.checkOut(user.employeeId);
      toast('Checked out successfully.', 'success');
      fetchAttendance();
    } catch (err: any) {
      toast(err.message || 'Check-out failed.', 'error');
    } finally {
      setIsCheckLoading(false);
    }
  };

  // Format active navigation date title
  const getPeriodTitle = () => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    if (currentView === 'week') {
      // Find start/end of current date's week
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const renderStatus = (status: string) => {
    const isPresent = status === 'PRESENT';
    const isHalf = status === 'HALF-DAY';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
        isPresent ? 'bg-status-present/10 text-status-present border border-status-present/25' :
        isHalf ? 'bg-status-halfday/10 text-status-halfday border border-status-halfday/25' :
        'bg-status-rejected/10 text-status-rejected border border-status-rejected/25'
      }`}>
        {status}
      </span>
    );
  };

  // Get day string from date string
  const getDayName = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-border rounded-md shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Attendance Logs</h1>
          <p className="text-text-secondary text-sm">
            {role === 'ADMIN' ? 'Monitor and review employee attendance shifts.' : 'Log and view your shift timings.'}
          </p>
        </div>

        {/* Employee Quick Actions */}
        {role === 'EMPLOYEE' && (
          <div className="flex items-center gap-2">
            {isCheckedIn ? (
              <button
                onClick={handleCheckOut}
                disabled={isCheckLoading}
                className="flex items-center gap-1.5 bg-status-rejected hover:bg-status-rejected/95 text-white font-bold text-sm px-4 py-2 rounded shadow transition-colors disabled:opacity-50"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Check Out</span>
              </button>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={isCheckLoading}
                className="flex items-center gap-1.5 bg-status-present hover:bg-status-present/95 text-white font-bold text-sm px-4 py-2 rounded shadow transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Check In</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Date Navigation & View Toggle Bar */}
      <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 select-none">
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handlePreviousPeriod}
            className="p-2 border border-border rounded hover:bg-card text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-text-primary text-sm min-w-[140px] text-center">
            {getPeriodTitle()}
          </span>
          <button 
            onClick={handleNextPeriod}
            className="p-2 border border-border rounded hover:bg-card text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search for Admin */}
        {role === 'ADMIN' && (
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-2.5 text-text-secondary">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search employee attendance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-border rounded text-sm bg-white"
            />
          </div>
        )}

        {/* View Toggle */}
        <div className="flex border border-border rounded overflow-hidden text-xs font-bold uppercase tracking-wide">
          <button
            onClick={() => setCurrentView('day')}
            className={`px-4 py-2 transition-colors ${currentView === 'day' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-card'}`}
          >
            Day
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-4 py-2 border-l border-r border-border transition-colors ${currentView === 'week' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-card'}`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView('month')}
            className={`px-4 py-2 transition-colors ${currentView === 'month' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-card'}`}
          >
            Month
          </button>
        </div>

      </div>

      {/* Main Table */}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Table<Attendance>
          headers={
            role === 'ADMIN' ? [
              { key: 'employeeName', label: 'Employee' },
              { key: 'employeeCode', label: 'Code' },
              { key: 'date', label: 'Date' },
              { key: 'day', label: 'Day' },
              { key: 'checkIn', label: 'Check In' },
              { key: 'checkOut', label: 'Check Out' },
              { key: 'workHours', label: 'Hours Worked', align: 'right' },
              { key: 'extraHours', label: 'Extra Hours', align: 'right' },
              { key: 'status', label: 'Status' }
            ] : [
              { key: 'date', label: 'Date' },
              { key: 'day', label: 'Day' },
              { key: 'checkIn', label: 'Check In' },
              { key: 'checkOut', label: 'Check Out' },
              { key: 'workHours', label: 'Hours Worked', align: 'right' },
              { key: 'extraHours', label: 'Extra Hours', align: 'right' },
              { key: 'status', label: 'Status' }
            ]
          }
          data={attendances}
          renderRow={(att) => (
            <tr key={att.id} className="hover:bg-card/25 transition-colors">
              {role === 'ADMIN' && (
                <>
                  <td className="px-6 py-4 font-bold text-text-primary">{att.employeeName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-text-secondary">{att.employeeCode}</td>
                </>
              )}
              <td className="px-6 py-4 font-medium text-text-primary">{att.date}</td>
              <td className="px-6 py-4 text-text-secondary">{getDayName(att.date)}</td>
              <td className="px-6 py-4 text-text-primary">{att.checkIn}</td>
              <td className="px-6 py-4 text-text-primary">{att.checkOut || 'Active shift / —'}</td>
              <td className="px-6 py-4 text-right font-bold text-primary">{att.workHours !== undefined ? `${att.workHours}h` : '—'}</td>
              <td className="px-6 py-4 text-right font-semibold text-text-secondary">{att.extraHours !== undefined ? `${att.extraHours}h` : '—'}</td>
              <td className="px-6 py-4">{renderStatus(att.status)}</td>
            </tr>
          )}
          emptyMessage="No attendance records found for this period."
        />
      )}

    </div>
  );
};
export default AttendancePage;
