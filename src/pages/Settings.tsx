import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { CompanySettings } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { Save, Settings as SettingsIcon, Image, Clock, ShieldCheck, CreditCard } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings states
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [workingDays, setWorkingDays] = useState(5);
  const [breakHours, setBreakHours] = useState(1);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [paidLeave, setPaidLeave] = useState(20);
  const [sickLeave, setSickLeave] = useState(10);
  const [pfEmployee, setPfEmployee] = useState(12);
  const [pfEmployer, setPfEmployer] = useState(12);
  const [tax, setTax] = useState(200);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const s = await api.settings.get();
      setName(s.name);
      setLogo(s.logo || '');
      setWorkingDays(s.workingDaysPerWeek);
      setBreakHours(s.breakHours);
      setWorkingHoursStart(s.workingHoursStart);
      setWorkingHoursEnd(s.workingHoursEnd);
      setPaidLeave(s.paidLeaveDefault);
      setSickLeave(s.sickLeaveDefault);
      setPfEmployee(s.pfEmployeePct);
      setPfEmployer(s.pfEmployerPct);
      setTax(s.professionalTax);
    } catch (err: any) {
      toast('Failed to load settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.settings.update({
        name,
        logo: logo || undefined,
        workingDaysPerWeek: workingDays,
        breakHours,
        workingHoursStart,
        workingHoursEnd,
        paidLeaveDefault: paidLeave,
        sickLeaveDefault: sickLeave,
        pfEmployeePct: pfEmployee,
        pfEmployerPct: pfEmployer,
        professionalTax: tax
      });
      toast('Settings saved successfully.', 'success');
    } catch (err: any) {
      toast('Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetLogo = (url: string) => {
    setLogo(url);
    toast('Demo logo selected. Click save to apply.', 'info');
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-border rounded-md shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-text-primary">System Settings</h1>
          <p className="text-text-secondary text-sm">Configure default HR policies, company properties, and payroll tax rates.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card 1: Company Profile */}
          <div className="bg-white border border-border rounded-md shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide border-b border-border pb-2 flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <span>Company Information</span>
            </h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Company Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dayflow Inc."
                className="border border-border rounded text-sm px-3 py-2 bg-white"
                required
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-text-secondary uppercase">Company Logo URL</label>
              <input 
                type="text" 
                value={logo}
                onChange={e => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="border border-border rounded text-sm px-3 py-2 bg-white"
                disabled={isSaving}
              />
              
              {/* Preset Logos selection */}
              <div className="mt-2 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Select Demo Logo Preset:</span>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => handlePresetLogo('https://www.odoo.com/web/image/website/1/logo')}
                    className="px-2.5 py-1.5 border border-border rounded text-[10px] font-bold bg-card hover:bg-gray-200 transition-colors"
                  >
                    Odoo Logo
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handlePresetLogo('https://cdn-icons-png.flaticon.com/512/9187/9187604.png')}
                    className="px-2.5 py-1.5 border border-border rounded text-[10px] font-bold bg-card hover:bg-gray-200 transition-colors"
                  >
                    Abstract Purple Node
                  </button>
                </div>
              </div>
            </div>

            {/* Logo Preview */}
            <div className="flex items-center gap-4 bg-card/20 p-4 border border-border/55 rounded-md mt-1">
              <span className="text-xs text-text-secondary font-bold uppercase shrink-0">Logo Preview:</span>
              {logo ? (
                <img 
                  src={logo} 
                  alt="Preview" 
                  className="h-10 w-auto rounded border border-border object-contain bg-white p-1" 
                />
              ) : (
                <span className="text-xs text-text-secondary italic">No logo configured (Default initials placeholder active)</span>
              )}
            </div>
          </div>

          {/* Card 2: Shift / Working Defaults */}
          <div className="bg-white border border-border rounded-md shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide border-b border-border pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Shift & Shift Policy Defaults</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Working Days Per Week</label>
                <select 
                  value={workingDays} 
                  onChange={e => setWorkingDays(Number(e.target.value))}
                  className="border border-border rounded text-sm px-3 py-2 bg-white"
                  disabled={isSaving}
                >
                  <option value="5">5 Days</option>
                  <option value="6">6 Days</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Break Hours (Per Day)</label>
                <input 
                  type="number" 
                  value={breakHours} 
                  onChange={e => setBreakHours(Number(e.target.value))}
                  step="0.5"
                  className="border border-border rounded text-sm px-3 py-2 bg-white"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Working Hour Start</label>
                <input 
                  type="text" 
                  value={workingHoursStart} 
                  onChange={e => setWorkingHoursStart(e.target.value)}
                  placeholder="09:00"
                  className="border border-border rounded text-sm px-3 py-2 bg-white"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Working Hour End</label>
                <input 
                  type="text" 
                  value={workingHoursEnd} 
                  onChange={e => setWorkingHoursEnd(e.target.value)}
                  placeholder="18:00"
                  className="border border-border rounded text-sm px-3 py-2 bg-white"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Default Time Off Allowances */}
          <div className="bg-white border border-border rounded-md shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide border-b border-border pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Leave Default Policies</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Paid Leaves (Annual)</label>
                <input 
                  type="number" 
                  value={paidLeave} 
                  onChange={e => setPaidLeave(Number(e.target.value))}
                  className="border border-border rounded text-sm px-3 py-2 bg-white font-semibold"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Sick Leaves (Annual)</label>
                <input 
                  type="number" 
                  value={sickLeave} 
                  onChange={e => setSickLeave(Number(e.target.value))}
                  className="border border-border rounded text-sm px-3 py-2 bg-white font-semibold"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Default Payroll / Taxes rates */}
          <div className="bg-white border border-border rounded-md shadow-sm p-5 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide border-b border-border pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Tax & Provident Fund Rates</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">PF Employee %</label>
                <input 
                  type="number" 
                  value={pfEmployee} 
                  onChange={e => setPfEmployee(Number(e.target.value))}
                  className="border border-border rounded text-sm px-3 py-2 bg-white font-medium"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">PF Employer %</label>
                <input 
                  type="number" 
                  value={pfEmployer} 
                  onChange={e => setPfEmployer(Number(e.target.value))}
                  className="border border-border rounded text-sm px-3 py-2 bg-white font-medium"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Professional Tax ($)</label>
                <input 
                  type="number" 
                  value={tax} 
                  onChange={e => setTax(Number(e.target.value))}
                  className="border border-border rounded text-sm px-3 py-2 bg-white font-medium"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Submit bar */}
        <div className="bg-white border border-border p-4 rounded-md shadow-sm flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-6 py-2.5 rounded shadow transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
export default SettingsPage;
