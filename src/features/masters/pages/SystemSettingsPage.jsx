import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { systemSettingsApi } from '../../../api/apiservice';

export function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    support_phone: '',
    currency: 'INR (₹)',
    time_zone: 'Asia/Kolkata',
    date_format: 'DD/MM/YYYY',
    fiscal_year_start: '04-01'
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await systemSettingsApi.general.get();
      const data = res?.data?.settings || res?.data || res || {};
      setForm(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load system settings:', err);
      toast.error('Loaded default system parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await systemSettingsApi.general.update(form);
      toast.success('System settings updated successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title="General System Settings"
        subtitle="Configure ERP organization parameters, currency, time zones, and date formats"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administration', href: '#' },
          { label: 'General System Settings' }
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-xs max-w-3xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Global ERP Configuration</h3>
            <span className="text-[11px] text-text-muted">Manage core organization identity, locale parameters, and default system settings.</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Company / Organization Name" required>
              <Input
                value={form.company_name}
                onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="CivilDesk ERP"
              />
            </FormField>

            <FormField label="Official System Email" required>
              <Input
                type="email"
                value={form.company_email}
                onChange={e => setForm(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="admin@civildesk.co"
              />
            </FormField>

            <FormField label="Support Phone Number">
              <Input
                value={form.support_phone}
                onChange={e => setForm(prev => ({ ...prev, support_phone: e.target.value }))}
                placeholder="+91 98421 00000"
              />
            </FormField>

            <FormField label="Currency Symbol / Code">
              <Input
                value={form.currency}
                onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                placeholder="INR (₹)"
              />
            </FormField>

            <FormField label="Default Time Zone">
              <Select
                options={[
                  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
                  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                ]}
                value={form.time_zone}
                onChange={(val) => setForm(prev => ({ ...prev, time_zone: val }))}
              />
            </FormField>

            <FormField label="System Date Format">
              <Select
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 03/10/2026)' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
                ]}
                value={form.date_format}
                onChange={(val) => setForm(prev => ({ ...prev, date_format: val }))}
              />
            </FormField>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadSettings}
              className="text-xs h-8 px-4"
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="text-xs h-8 px-4 shadow-xs"
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default SystemSettingsPage;
