import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileCheck, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../components/composite/Toast';
import { drawingTakeoffApi } from '../../../api/apiservice';

export function TakeoffReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('job_id') || '1';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await drawingTakeoffApi.items.list(jobId);
      const list = res?.data?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load takeoff items:', err);
      toast.error('Failed to load takeoff items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleApprove = async (itemId) => {
    try {
      await drawingTakeoffApi.items.approve(jobId, itemId);
      toast.success('Takeoff item approved.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to approve item.');
    }
  };

  const handleReject = async (itemId) => {
    try {
      await drawingTakeoffApi.items.reject(jobId, itemId);
      toast.success('Takeoff item rejected.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to reject item.');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Review Drawing Takeoff Items (Job #${jobId})`}
        subtitle="Inspect extracted drawing items, dimensions, calculated quantities, and BOQ mapping approvals"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/boq/takeoff')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Jobs
            </Button>
            <Button variant="outline" onClick={fetchItems} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        }
      />

      <DataTableContainer>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Extracted Quantity</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading extracted takeoff items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No takeoff items found for Job #{jobId}.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {item.item_code || `ITEM-${item.id}`}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {item.description || item.name}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {Number(item.quantity || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.unit || 'SqM'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'neutral' : 'info'}>
                        {item.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(item.id)} className="text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleReject(item.id)} className="text-red-500">
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataTableContainer>
    </PageContainer>
  );
}

export default TakeoffReviewPage;
