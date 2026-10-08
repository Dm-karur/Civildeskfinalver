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
    if (e) e.preventDefault();
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
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title="Email & SMTP Settings"
        subtitle="Configure outbound SMTP server settings for system notifications & bill dispatches"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administration', href: '#' },
          { label: 'Email & SMTP Settings' }
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
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Outbound SMTP Gateway</h3>
            <span className="text-[11px] text-text-muted">Configure email credentials for automated PO dispatches and system alerts.</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="SMTP Host / Server" required>
              <Input
                value={form.smtp_host}
                onChange={e => setForm(prev => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.hostinger.com"
              />
            </FormField>

            <FormField label="SMTP Port" required>
              <Input
                value={form.smtp_port}
                onChange={e => setForm(prev => ({ ...prev, smtp_port: e.target.value }))}
                placeholder="587"
              />
            </FormField>

            <FormField label="SMTP Username" required>
              <Input
                value={form.smtp_user}
                onChange={e => setForm(prev => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="notifications@civildesk.co"
              />
            </FormField>

            <FormField label="SMTP Password" required>
              <Input
                type="password"
                value={form.smtp_pass}
                onChange={e => setForm(prev => ({ ...prev, smtp_pass: e.target.value }))}
                placeholder="••••••••••••"
              />
            </FormField>

            <FormField label="Sender Email (From)" required>
              <Input
                type="email"
                value={form.from_email}
                onChange={e => setForm(prev => ({ ...prev, from_email: e.target.value }))}
                placeholder="no-reply@civildesk.co"
              />
            </FormField>

            <FormField label="Sender Display Name" required>
              <Input
                value={form.from_name}
                onChange={e => setForm(prev => ({ ...prev, from_name: e.target.value }))}
                placeholder="CivilDesk ERP Notifications"
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
              Save SMTP Configuration
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default EmailPage;
