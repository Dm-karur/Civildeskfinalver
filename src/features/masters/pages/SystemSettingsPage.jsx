import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
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
    e.preventDefault();
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
    <PageContainer>
      <PageHeader
        title="General System Settings"
        subtitle="Configure ERP organization parameters, currency, and date formats"
        actions={
          <Button variant="outline" onClick={loadSettings} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Company Name">
              <Input
                value={form.company_name}
                onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="CivilDesk ERP"
              />
            </FormField>
            <FormField label="Official Email">
              <Input
                type="email"
                value={form.company_email}
                onChange={e => setForm(prev => ({ ...prev, company_email: e.target.value }))}
                placeholder="admin@civildesk.co"
              />
            </FormField>
            <FormField label="Support Phone">
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
              <Input
                value={form.time_zone}
                onChange={e => setForm(prev => ({ ...prev, time_zone: e.target.value }))}
                placeholder="Asia/Kolkata"
              />
            </FormField>
            <FormField label="System Date Format">
              <Input
                value={form.date_format}
                onChange={e => setForm(prev => ({ ...prev, date_format: e.target.value }))}
                placeholder="DD/MM/YYYY"
              />
            </FormField>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button type="submit" variant="primary" loading={saving} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default SystemSettingsPage;
