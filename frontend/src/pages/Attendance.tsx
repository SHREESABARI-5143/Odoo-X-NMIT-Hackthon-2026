import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { attendanceApi } from '../api/attendanceApi';
import { employeeApi } from '../api/employeeApi';
import { StatusBadge } from '../components/ui/StatusBadge';
import { WorkdayRing } from '../components/ui/WorkdayRing';
import { WorkdayPulse } from '../components/ui/WorkdayPulse';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Clock, Calendar, LogIn, LogOut, Filter, User } from 'lucide-react';

export const Attendance: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('08');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Fetch today's check-in status
  const { data: todayData } = useQuery({
    queryKey: ['todayAttendance'],
    queryFn: attendanceApi.getToday,
  });

  // Fetch attendance history
  const { data: history, isLoading } = useQuery({
    queryKey: ['attendanceHistory', selectedEmployeeId, selectedMonth, selectedYear],
    queryFn: () =>
      attendanceApi.getHistory({
        employeeId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined,
        month: selectedMonth,
        year: selectedYear,
      }),
  });

  // Fetch employees list for admin filter dropdown
  const { data: employees } = useQuery({
    queryKey: ['employeesFilter'],
    queryFn: () => employeeApi.getEmployees(),
    enabled: isAdmin,
  });

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

  const attendanceRecord = todayData?.attendance;
  const isCheckedIn = !!(attendanceRecord?.checkIn && !attendanceRecord?.checkOut);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold text-[#252525]">Attendance Management</h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Track check-ins, check-outs, work duration, overtime, and monthly attendance logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Live Workday Pulse & Ring */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-[#E7E4E1]">
          <div className="flex items-center justify-center bg-[#F7F7F5] p-4 rounded-xl border border-[#E7E4E1]">
            <WorkdayRing
              workHoursMins={attendanceRecord?.workHoursMins || 0}
              isCheckedIn={isCheckedIn}
            />
          </div>
          <div className="md:col-span-2">
            <WorkdayPulse
              checkInTime={attendanceRecord?.checkIn}
              checkOutTime={attendanceRecord?.checkOut}
              status={attendanceRecord?.status}
            />
          </div>
        </div>
      </div>

      {/* Filter & History Table Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E7E4E1]">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252525]">
          <Clock className="w-4 h-4 text-[#714B67]" /> Attendance History Logs
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="text-xs bg-[#F7F7F5] border border-[#E7E4E1] rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Employees</option>
              {employees?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.loginId})
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-[#F7F7F5] border border-[#E7E4E1] rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs bg-[#F7F7F5] border border-[#E7E4E1] rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Attendance Log Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : !history || history.length === 0 ? (
        <EmptyState title="No attendance records found." description="Select a different month or employee filter." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E4E1] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  {isAdmin && <th className="p-3.5">Employee</th>}
                  <th className="p-3.5">Check In</th>
                  <th className="p-3.5">Check Out</th>
                  <th className="p-3.5">Work Duration</th>
                  <th className="p-3.5">Extra Hours</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4E1]">
                {Array.isArray(history) &&
                  history.map((record: any) => {
                    const workMins = record.workHoursMins || 0;
                    const extraMins = record.extraHoursMins || 0;
                    const hours = Math.floor(workMins / 60);
                    const mins = workMins % 60;
                    const extraH = Math.floor(extraMins / 60);
                    const extraM = extraMins % 60;

                    return (
                      <tr key={record.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                        <td className="p-3.5 font-mono font-semibold text-[#252525]">
                          {record.date}
                        </td>
                        {isAdmin && (
                          <td className="p-3.5 font-medium text-[#252525]">
                            {record.user ? `${record.user.firstName} ${record.user.lastName}` : 'N/A'}
                            <span className="block text-[10px] text-[#6B6B6B]">
                              {record.user?.loginId}
                            </span>
                          </td>
                        )}
                        <td className="p-3.5 font-mono text-[#3FA66B] font-semibold">
                          {record.checkIn || '--:--'}
                        </td>
                        <td className="p-3.5 font-mono text-[#714B67] font-semibold">
                          {record.checkOut || '--:--'}
                        </td>
                        <td className="p-3.5 font-semibold text-[#252525]">
                          {workMins > 0 ? `${hours}h ${mins}m` : '0h 0m'}
                        </td>
                        <td className="p-3.5 font-medium text-[#4F7CAC]">
                          {extraMins > 0 ? `+${extraH}h ${extraM}m` : '-'}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={record.status || 'PRESENT'} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
