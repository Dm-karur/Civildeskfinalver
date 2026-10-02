import { useState, useEffect } from 'react';
import { Mail, Save, RefreshCw, Send } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { systemSettingsApi } from '../../../api/apiservice';

export function EmailPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'CivilDesk ERP'
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await systemSettingsApi.email.get();
      const data = res?.data?.settings || res?.data || res || {};
      setForm(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load email settings:', err);
      toast.error('Loaded default SMTP configuration.');
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
      await systemSettingsApi.email.update(form);
      toast.success('SMTP Email settings updated successfully.');
    } catch (err) {
      console.error('Failed to save email settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update email settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Email & SMTP Settings"
        subtitle="Configure outbound SMTP server settings for system notifications & bill dispatches"
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
            <FormField label="SMTP Host / Server">
              <Input
                value={form.smtp_host}
                onChange={e => setForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.hostinger.com"
              />
            </FormField>
            <FormField label="SMTP Port">
              <Input
                value={form.smtp_port}
                onChange={e => setForm(prev => ({ ...prev, smtp_port: e.target.value }))}
                placeholder="587"
              />
            </FormField>
            <FormField label="SMTP Username">
              <Input
                value={form.smtp_user}
                onChange={e => setForm(prev => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="notifications@civildesk.co"
              />
            </FormField>
            <FormField label="SMTP Password">
              <Input
                type="password"
                value={form.smtp_pass}
                onChange={e => setForm(prev => ({ ...prev, smtp_pass: e.target.value }))}
                placeholder="••••••••••••"
              />
            </FormField>
            <FormField label="Sender Email (From)">
              <Input
                type="email"
                value={form.from_email}
                onChange={e => setForm(prev => ({ ...prev, from_email: e.target.value }))}
                placeholder="no-reply@civildesk.co"
              />
            </FormField>
            <FormField label="Sender Display Name">
              <Input
                value={form.from_name}
                onChange={e => setForm(prev => ({ ...prev, from_name: e.target.value }))}
                placeholder="CivilDesk ERP Notifications"
              />
            </FormField>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button type="submit" variant="primary" loading={saving} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4" />
              Save SMTP Configuration
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default EmailPage;
