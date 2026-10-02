import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';
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
    e.preventDefault();
    if (!selectedBoqId) {
      toast.error('Please select a target BOQ.');
      return;
    }
    setConverting(true);
    try {
      await drawingTakeoffApi.convertToBoq(jobId, selectedBoqId);
      toast.success(`Job #${jobId} quantities successfully converted & mapped into BOQ #${selectedBoqId}.`);
      navigate('/boq');
    } catch (err) {
      console.error('Failed to convert takeoff to BOQ:', err);
      toast.error(err.response?.data?.message || 'Failed to convert takeoff to BOQ.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Convert Takeoff Job #${jobId} to BOQ`}
        subtitle="Map reviewed drawing takeoff measurements directly into an active project BOQ"
        actions={
          <Button variant="outline" onClick={() => navigate('/boq/takeoff')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Takeoffs
          </Button>
        }
      />

      <div className="max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleConvert} className="space-y-6">
          <FormField label="Target Project BOQ" required>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading active BOQs...
              </div>
            ) : (
              <select
                value={selectedBoqId}
                onChange={e => setSelectedBoqId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                {boqs.length === 0 && <option value="">No active BOQs available</option>}
                {boqs.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.boq_code ? `[${b.boq_code}] ` : ''}{b.title || b.name || `BOQ #${b.id}`}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-xs text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">BOQ Conversion Notice:</p>
            Approved quantities from Takeoff Job #{jobId} will be automatically matched by item code or appended as new BOQ measurement lines into the selected project BOQ.
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button type="submit" variant="primary" loading={converting} disabled={!selectedBoqId} className="gap-2 bg-[#0056C9] hover:bg-blue-700">
              <CheckCircle2 className="w-4 h-4" />
              Convert & Merge to BOQ
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

export default ConvertTakeoffPage;
