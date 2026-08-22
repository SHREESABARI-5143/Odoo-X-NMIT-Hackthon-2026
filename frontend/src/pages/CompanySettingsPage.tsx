import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { companyApi } from '../api/companyApi';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { Settings, Building2, Upload, Check, Save } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const CompanySettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    companyName: 'Emplora Technologies',
    workingDays: 5,
    breakHours: 1,
    defaultPaidLeave: 15,
    defaultSickLeave: 10,
    defaultUnpaidLeave: 5,
    pfPercentage: 12,
    professionalTaxAmount: 200,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: companyApi.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        companyName: settings.companyName || 'Dayflow Technologies',
        workingDays: settings.workingDays || 5,
        breakHours: settings.breakHours || 1,
        defaultPaidLeave: settings.defaultPaidLeave || 15,
        defaultSickLeave: settings.defaultSickLeave || 10,
        defaultUnpaidLeave: settings.defaultUnpaidLeave || 5,
        pfPercentage: settings.pfPercentage || 12,
        professionalTaxAmount: settings.professionalTaxAmount || 200,
      });
      if (settings.companyLogo) {
        setLogoPreview(settings.companyLogo);
      }
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (formData: FormData) => companyApi.updateSettings(formData),
    onSuccess: (data) => {
      showToast('Company settings updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
      window.location.reload(); // Reload to refresh Header logo cleanly
    },
    onError: () => showToast('Failed to update company settings.', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('companyName', form.companyName);
    formData.append('workingDays', String(form.workingDays));
    formData.append('breakHours', String(form.breakHours));
    formData.append('defaultPaidLeave', String(form.defaultPaidLeave));
    formData.append('defaultSickLeave', String(form.defaultSickLeave));
    formData.append('defaultUnpaidLeave', String(form.defaultUnpaidLeave));
    formData.append('pfPercentage', String(form.pfPercentage));
    formData.append('professionalTaxAmount', String(form.professionalTaxAmount));

    if (logoFile) {
      formData.append('logo', logoFile);
    }

    updateSettingsMutation.mutate(formData);
  };

  if (isLoading) return <TableSkeleton rows={4} />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#714B67] text-white flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#252525]">Company & HR System Settings</h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Configure default organizational parameters, leave allocations, and branding.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E4E1] shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Branding */}
          <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E7E4E1] space-y-3">
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider">
              Company Logo & Branding
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white border border-[#E7E4E1] flex items-center justify-center overflow-hidden p-1">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs text-[#6B6B6B]">No logo</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    setLogoFile(file);
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
                className="text-xs text-[#6B6B6B]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider border-b border-[#E7E4E1] pb-2">
              General Identity
            </h3>
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Company Name</label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full p-2.5 text-xs bg-white border border-[#E7E4E1] rounded-lg focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider border-b border-[#E7E4E1] pb-2">
              Workday & Attendance Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Working Days / Week
                </label>
                <input
                  type="number"
                  value={form.workingDays}
                  onChange={(e) => setForm({ ...form, workingDays: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Standard Break Hours / Day
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.breakHours}
                  onChange={(e) => setForm({ ...form, breakHours: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider border-b border-[#E7E4E1] pb-2">
              Default Annual Leave Allocations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Paid Leave Days</label>
                <input
                  type="number"
                  value={form.defaultPaidLeave}
                  onChange={(e) => setForm({ ...form, defaultPaidLeave: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Sick Leave Days</label>
                <input
                  type="number"
                  value={form.defaultSickLeave}
                  onChange={(e) => setForm({ ...form, defaultSickLeave: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Unpaid Leave Days</label>
                <input
                  type="number"
                  value={form.defaultUnpaidLeave}
                  onChange={(e) => setForm({ ...form, defaultUnpaidLeave: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#714B67] uppercase tracking-wider border-b border-[#E7E4E1] pb-2">
              Statutory Payroll Defaults
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">PF Contribution %</label>
                <input
                  type="number"
                  value={form.pfPercentage}
                  onChange={(e) => setForm({ ...form, pfPercentage: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Professional Tax Amount ($)
                </label>
                <input
                  type="number"
                  value={form.professionalTaxAmount}
                  onChange={(e) => setForm({ ...form, professionalTaxAmount: Number(e.target.value) })}
                  className="w-full p-2 text-xs bg-white border border-[#E7E4E1] rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E7E4E1]">
            <Button
              type="submit"
              icon={<Save className="w-4 h-4" />}
              isLoading={updateSettingsMutation.isPending}
            >
              Save Company Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
