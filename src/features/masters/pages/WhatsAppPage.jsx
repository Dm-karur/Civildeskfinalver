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
    e.preventDefault();
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
    <PageContainer>
      <PageHeader
        title="WhatsApp Gateway Settings"
        subtitle="Configure WhatsApp Business API parameters for automatic client updates & site alerts"
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
            <FormField label="API Gateway Provider">
              <Input
                value={form.provider}
                onChange={e => setForm(prev => ({ ...prev, provider: e.target.value }))}
                placeholder="Twilio / Meta Business"
              />
            </FormField>
            <FormField label="Account SID / Key">
              <Input
                value={form.account_sid}
                onChange={e => setForm(prev => ({ ...prev, account_sid: e.target.value }))}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </FormField>
            <FormField label="Auth Token">
              <Input
                type="password"
                value={form.auth_token}
                onChange={e => setForm(prev => ({ ...prev, auth_token: e.target.value }))}
                placeholder="••••••••••••••••"
              />
            </FormField>
            <FormField label="Sender WhatsApp Number">
              <Input
                value={form.from_number}
                onChange={e => setForm(prev => ({ ...prev, from_number: e.target.value }))}
                placeholder="whatsapp:+14155238886"
              />
            </FormField>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button type="submit" variant="primary" loading={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4" />
              Save WhatsApp Configuration
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default WhatsAppPage;
