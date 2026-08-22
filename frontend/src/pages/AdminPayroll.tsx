import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { payrollApi } from '../api/payrollApi';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { WalletCards, ShieldAlert, Filter, Building2, Download } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const AdminPayroll: React.FC = () => {
  const { isAdmin } = useAuth();
  const [selectedDept, setSelectedDept] = useState('all');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: payroll, isLoading, isError } = useQuery({
    queryKey: ['payrollDashboard', selectedDept],
    queryFn: () => payrollApi.getPayrollDashboard({ department: selectedDept }),
  });

  const metrics = payroll?.metrics || {
    totalPayrollCost: 0,
    totalNetPayout: 0,
    totalEmployerPf: 0,
    totalProfessionalTax: 0,
    totalConfiguredCount: 0,
  };

  const rows = payroll?.breakdown || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#714B67]/15 text-[#714B67] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              ADMIN / HR CONFIDENTIAL
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#252525] mt-1">Enterprise Payroll Dashboard</h1>
          <p className="text-xs text-[#6B6B6B]">
            Company-wide gross payroll cost, statutory PF contributions, tax liabilities, and individual payouts.
          </p>
        </div>
      </div>

      {/* Enterprise Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs">
          <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
            TOTAL GROSS PAYROLL COST
          </span>
          <p className="text-2xl font-bold text-[#714B67] mt-1.5">
            ${metrics.totalPayrollCost?.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Monthly total gross salary</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs">
          <span className="text-xs font-bold text-[#3FA66B] uppercase tracking-wider">
            NET EMPLOYEE PAYOUT
          </span>
          <p className="text-2xl font-bold text-[#3FA66B] mt-1.5">
            ${metrics.totalNetPayout?.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Total bank disbursement</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs">
          <span className="text-xs font-bold text-[#4F7CAC] uppercase tracking-wider">
            EMPLOYER PF LIABILITY
          </span>
          <p className="text-2xl font-bold text-[#4F7CAC] mt-1.5">
            ${metrics.totalEmployerPf?.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">12% statutory PF match</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E7E4E1] shadow-2xs">
          <span className="text-xs font-bold text-[#E5A72A] uppercase tracking-wider">
            PROFESSIONAL TAX
          </span>
          <p className="text-2xl font-bold text-[#E5A72A] mt-1.5">
            ${metrics.totalProfessionalTax?.toLocaleString()}
          </p>
          <p className="text-[10px] text-[#6B6B6B] mt-1 font-medium">Total tax withheld</p>
        </div>
      </div>

      {/* Filter & Table Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E7E4E1]">
        <div className="flex items-center gap-2 text-sm font-bold text-[#252525]">
          <WalletCards className="w-4 h-4 text-[#714B67]" /> Employee Payroll Breakdown
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] font-medium">
            <Filter className="w-3.5 h-3.5" /> Department:
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
        </div>
      </div>

      {/* Payroll Table */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <EmptyState title="Unable to load payroll dashboard." description="Please verify backend connection." />
      ) : rows.length === 0 ? (
        <EmptyState title="No payroll data available." description="No employee salary configurations found." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E4E1] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] text-[#6B6B6B] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Monthly Wage</th>
                  <th className="p-3.5">Basic</th>
                  <th className="p-3.5">HRA</th>
                  <th className="p-3.5">Gross Total</th>
                  <th className="p-3.5">PF Match</th>
                  <th className="p-3.5">Prof Tax</th>
                  <th className="p-3.5">Net Take Home</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4E1]">
                {rows.map((row: any) => (
                  <tr key={row.employeeId} className="hover:bg-[#F7F7F5]/50 transition-colors">
                    <td className="p-3.5 font-bold text-[#252525]">
                      {row.employeeName}
                      <span className="block text-[10px] text-[#6B6B6B] font-mono">
                        {row.loginId}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-[#6B6B6B]">{row.department}</td>
                    <td className="p-3.5 font-mono font-bold text-[#714B67]">
                      ${row.monthlyWage?.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-[#252525]">${row.basicSalary?.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-[#252525]">${row.hra?.toLocaleString()}</td>
                    <td className="p-3.5 font-mono font-bold text-[#252525]">
                      ${row.grossSalary?.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-[#4F7CAC]">${row.employerPf?.toLocaleString()}</td>
                    <td className="p-3.5 font-mono text-[#E5A72A]">${row.professionalTax?.toLocaleString()}</td>
                    <td className="p-3.5 font-mono font-bold text-[#3FA66B]">
                      ${row.netSalary?.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3FA66B]/15 text-[#2E7D4E]">
                        Configured
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
