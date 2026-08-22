import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Payroll } from '../types';
import { Table } from '../components/ui/Table';
import { Skeleton } from '../components/ui/Skeleton';
import { DollarSign, Search, Filter, Plus, Calendar, RefreshCw } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // defaults to current month
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchPayroll = async () => {
    setIsLoading(true);
    try {
      const list = await api.payroll.getAll(month, year);
      setPayrolls(list);
    } catch (err: any) {
      toast('Failed to load payroll records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      await api.payroll.generateMonthly(month, year);
      toast('Monthly payroll generated successfully.', 'success');
      fetchPayroll();
    } catch (err: any) {
      toast(err.message || 'Failed to generate payroll. Check if already exists.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Search filter manually
  const filteredPayrolls = payrolls.filter(p => 
    p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    p.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
    p.department.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalPayrollGross = filteredPayrolls.reduce((sum, p) => sum + p.gross, 0);
  const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + p.pf + p.tax + p.leaveDeduction, 0);
  const totalPF = filteredPayrolls.reduce((sum, p) => sum + p.pf, 0);
  const totalPayableSalary = filteredPayrolls.reduce((sum, p) => sum + p.payableSalary, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-border rounded-md shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Payroll Ledger</h1>
          <p className="text-text-secondary text-sm">Calculate and monitor employee payroll payments.</p>
        </div>

        <button
          onClick={handleGeneratePayroll}
          disabled={isGenerating}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-4 py-2 rounded shadow transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>Generate {monthNames[month - 1]} Payroll</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Total Gross Salary</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-primary">${totalPayrollGross.toLocaleString()}</span>
            <DollarSign className="w-5 h-5 text-primary/40 shrink-0" />
          </div>
        </div>

        <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Total Deductions</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-status-rejected">${totalDeductions.toLocaleString()}</span>
            <DollarSign className="w-5 h-5 text-status-rejected/40 shrink-0" />
          </div>
        </div>

        <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Total PF Contribution</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-status-pending">${totalPF.toLocaleString()}</span>
            <DollarSign className="w-5 h-5 text-status-pending/40 shrink-0" />
          </div>
        </div>

        <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Net Payable Salary</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black text-status-present">${totalPayableSalary.toLocaleString()}</span>
            <DollarSign className="w-5 h-5 text-status-present/40 shrink-0" />
          </div>
        </div>

      </div>

      {/* Filtering Options */}
      <div className="bg-white p-5 border border-border rounded-md shadow-sm flex flex-col md:flex-row gap-3 select-none">
        
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search payroll by employee name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-border rounded text-sm bg-white"
          />
        </div>

        {/* Month Selector */}
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-border rounded text-sm px-3 py-1.5 bg-white text-text-primary focus:outline-none"
        >
          {monthNames.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>

        {/* Year Selector */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-border rounded text-sm px-3 py-1.5 bg-white text-text-primary focus:outline-none"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>

      </div>

      {/* Ledger Table */}
      <Table<Payroll>
        headers={[
          { key: 'employeeName', label: 'Employee' },
          { key: 'employeeCode', label: 'Code' },
          { key: 'department', label: 'Department' },
          { key: 'gross', label: 'Gross Wage', align: 'right' },
          { key: 'pf', label: 'PF', align: 'right' },
          { key: 'tax', label: 'Tax', align: 'right' },
          { key: 'leaveDeduction', label: 'Unpaid Leave Deduct', align: 'right' },
          { key: 'netSalary', label: 'Net Take-Home', align: 'right' },
          { key: 'payableSalary', label: 'Final Payable', align: 'right' },
          { key: 'status', label: 'Status' }
        ]}
        data={filteredPayrolls}
        renderRow={(pay) => (
          <tr key={pay.id} className="hover:bg-card/25 transition-colors">
            <td className="px-6 py-4 font-bold text-text-primary">{pay.employeeName}</td>
            <td className="px-6 py-4 font-mono text-xs text-text-secondary">{pay.employeeCode}</td>
            <td className="px-6 py-4 font-semibold text-primary">{pay.department}</td>
            <td className="px-6 py-4 text-right font-medium">${pay.gross}</td>
            <td className="px-6 py-4 text-right text-status-rejected font-medium">-${pay.pf}</td>
            <td className="px-6 py-4 text-right text-status-rejected font-medium">-${pay.tax}</td>
            <td className="px-6 py-4 text-right text-status-rejected font-semibold">
              {pay.leaveDeduction > 0 ? `-$${pay.leaveDeduction}` : '—'}
            </td>
            <td className="px-6 py-4 text-right font-bold text-text-primary">${pay.netSalary}</td>
            <td className="px-6 py-4 text-right font-black text-status-present">${pay.payableSalary}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                pay.status === 'PAID' ? 'bg-status-approved/15 text-status-approved border border-status-approved/20' :
                'bg-status-pending/15 text-status-pending border border-status-pending/20'
              }`}>
                {pay.status}
              </span>
            </td>
          </tr>
        )}
        emptyMessage="No payroll records generated for this month. Click Generate Payroll to calculate."
      />

    </div>
  );
};
export default PayrollPage;
