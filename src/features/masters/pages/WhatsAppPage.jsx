import { useState, useEffect } from 'react';
import { MessageSquare, Save, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { systemSettingsApi } from '../../../api/apiservice';

export function WhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    provider: 'Twilio',
    account_sid: '',
    auth_token: '',
    from_number: '',
    webhook_url: ''
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await systemSettingsApi.whatsapp.get();
      const data = res?.data?.settings || res?.data || res || {};
      setForm(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      toast.error('Loaded default WhatsApp API parameters.');
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
      await systemSettingsApi.whatsapp.update(form);
      toast.success('WhatsApp API gateway settings updated successfully.');
    } catch (err) {
      console.error('Failed to save WhatsApp settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update WhatsApp settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title="WhatsApp Gateway Settings"
        subtitle="Configure WhatsApp Business API parameters for automatic client updates & site alerts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administration', href: '#' },
          { label: 'WhatsApp Gateway' }
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
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">WhatsApp Business API Integration</h3>
            <span className="text-[11px] text-text-muted">Configure Twilio or Meta API parameters for automated dispatch notifications.</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="API Gateway Provider" required>
              <Input
                value={form.provider}
                onChange={e => setForm(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="Twilio / Meta Business"
              />
            </FormField>

            <FormField label="Account SID / API Key" required>
              <Input
                value={form.account_sid}
                onChange={e => setForm(prev => ({ ...prev, account_sid: e.target.value }))}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </FormField>

            <FormField label="Auth Token / Secret" required>
              <Input
                type="password"
                value={form.auth_token}
                onChange={e => setForm(prev => ({ ...prev, auth_token: e.target.value }))}
                placeholder="••••••••••••••••"
              />
            </FormField>

            <FormField label="Sender WhatsApp Number" required>
              <Input
                value={form.from_number}
                onChange={e => setForm(prev => ({ ...prev, from_number: e.target.value }))}
                placeholder="whatsapp:+14155238886"
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
              Save WhatsApp Configuration
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default WhatsAppPage;
