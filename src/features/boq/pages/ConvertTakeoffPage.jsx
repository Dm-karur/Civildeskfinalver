import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, FileSpreadsheet, Layers } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { drawingTakeoffApi, boqApi } from '../../../api/apiservice';

export function ConvertTakeoffPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('job_id') || '1';

  const [boqs, setBoqs] = useState([]);
  const [selectedBoqId, setSelectedBoqId] = useState('');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    setLoading(true);
    boqApi.list().then(res => {
      const list = res?.data?.boqs ?? res?.boqs ?? (Array.isArray(res?.data) ? res.data : []);
      setBoqs(Array.isArray(list) ? list : []);
      if (list.length > 0) setSelectedBoqId(String(list[0].id));
    }).catch(err => {
      console.error('Failed to load BOQs:', err);
      toast.error('Failed to load target BOQ list.');
    }).finally(() => setLoading(false));
  }, []);

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBoqId) {
      toast.error('Please select a target BOQ.');
      return;
    }
    setConverting(true);
    try {
      await drawingTakeoffApi.convertToBoq(jobId, selectedBoqId);
      toast.success(`Job #${jobId} quantities successfully converted & mapped into BOQ #${selectedBoqId}.`);
      navigate('/takeoff');
    } catch (err) {
      console.error('Failed to convert takeoff to BOQ:', err);
      toast.error(err.response?.data?.message || 'Failed to convert takeoff to BOQ.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title={`Convert Takeoff Job #${jobId} to BOQ`}
        subtitle="Map reviewed drawing takeoff measurements directly into an active project BOQ"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'BOQ & Budget', href: '#' },
          { label: 'Drawing Takeoff', href: '/takeoff' },
          { label: `Convert Job #${jobId}` }
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/takeoff')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            className="text-xs h-8"
          >
            Back to Takeoffs
          </Button>
        }
      />

      <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-xs max-w-2xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Target BOQ Selection</h3>
            <span className="text-[11px] text-text-muted">Choose the active project BOQ where approved quantities will be merged.</span>
          </div>
        </div>

        <form onSubmit={handleConvert} className="space-y-5">
          <FormField label="Target Project BOQ" required>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> Loading active BOQs...
              </div>
            ) : (
              <Select
                options={[
                  ...(boqs.length === 0 ? [{ value: '', label: 'No active BOQs available' }] : []),
                  ...boqs.map(b => ({
                    value: String(b.id),
                    label: `${b.boq_code ? `[${b.boq_code}] ` : ''}${b.title || b.name || `BOQ #${b.id}`}`
                  }))
                ]}
                value={selectedBoqId}
                onChange={setSelectedBoqId}
                className="text-xs h-9"
              />
            )}
          </FormField>

          <div className="p-3.5 bg-surface-muted/60 border border-border rounded-lg text-xs space-y-1">
            <span className="font-bold text-text-primary block text-[11px]">BOQ Conversion Notice:</span>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              Approved quantities from Takeoff Job #{jobId} will be automatically matched by item code or appended as new BOQ measurement lines into the selected project BOQ.
            </p>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/takeoff')}
              className="text-xs h-8 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={converting}
              disabled={!selectedBoqId || loading}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              className="text-xs h-8 px-4 shadow-xs"
            >
              Convert & Merge to BOQ
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default ConvertTakeoffPage;
