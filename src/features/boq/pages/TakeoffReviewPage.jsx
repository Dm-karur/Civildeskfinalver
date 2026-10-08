import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileCheck, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock,
  ArrowRight, Search, FileText
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { toast } from '../../../components/composite/Toast';
import { drawingTakeoffApi } from '../../../api/apiservice';

export function TakeoffReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('job_id') || '1';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase();
      const code = String(item.item_code || `ITEM-${item.id}`).toLowerCase();
      const desc = String(item.description || item.name || '').toLowerCase();
      const matchesSearch = code.includes(q) || desc.includes(q);

      const matchesStatus = selectedStatus === 'all' || String(item.status || 'Pending').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [items, search, selectedStatus]);

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const pagedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  // KPI Calculations
  const approvedCount = useMemo(() => items.filter(i => String(i.status).toLowerCase() === 'approved').length, [items]);
  const pendingCount = useMemo(() => items.filter(i => !i.status || String(i.status).toLowerCase() === 'pending').length, [items]);
  const rejectedCount = useMemo(() => items.filter(i => String(i.status).toLowerCase() === 'rejected').length, [items]);

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title={`Takeoff Item Review (Job #${jobId})`}
        subtitle="Inspect extracted drawing items, dimensions, calculated quantities, and BOQ mapping approvals"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'BOQ & Budget', href: '#' },
          { label: 'Drawing Takeoff', href: '/takeoff' },
          { label: `Review Job #${jobId}` }
        ]}
      />

      {/* KPI Stats Bar - Standard Site Team Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Extracted Items"
          value={items.length}
          status="info"
          icon={<FileCheck className="w-4 h-4 text-sky-500" />}
        />
        <KpiCard
          label="Approved Items"
          value={approvedCount}
          status="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <KpiCard
          label="Pending Review"
          value={pendingCount}
          status="warning"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <KpiCard
          label="Rejected / Excluded"
          value={rejectedCount}
          status="neutral"
          icon={<XCircle className="w-4 h-4 text-rose-500" />}
        />
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchField
              placeholder="Search item code, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/takeoff')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            className="text-xs h-8"
          >
            Back to Takeoffs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/takeoff/convert?job_id=${jobId}`)}
            leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs h-8 shadow-xs"
          >
            Convert to BOQ
          </Button>
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block">
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          }
        >
          <table className="w-full text-left text-[12px] table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 w-32">Item Code</th>
                <th className="px-3 py-2">Description & Specifications</th>
                <th className="px-3 py-2 text-right w-32">Extracted Qty</th>
                <th className="px-3 py-2 text-center w-24">Unit</th>
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                    Loading takeoff items...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                    No takeoff items found for Job #{jobId}.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-3 py-2 text-center text-text-muted text-[11px]">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary">
                      {item.item_code || `ITEM-${item.id}`}
                    </td>
                    <td className="px-3 py-2 font-semibold text-text-primary text-[12px]">
                      {item.description || item.name}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[12px]">
                      {Number(item.quantity || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center text-text-secondary">
                      {item.unit || 'SqM'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={
                          String(item.status).toLowerCase() === 'approved'
                            ? 'success'
                            : String(item.status).toLowerCase() === 'rejected'
                            ? 'neutral'
                            : 'warning'
                        }
                        className="text-[8px] px-1.5 py-0.5"
                      >
                        {item.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => handleApprove(item.id)}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleReject(item.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading takeoff items...
          </div>
        ) : pagedItems.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No takeoff items found.
          </div>
        ) : (
          pagedItems.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-3 space-y-2.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] text-primary font-bold">{item.item_code || `ITEM-${item.id}`}</span>
                  <h4 className="font-bold text-text-primary text-xs">{item.description || item.name}</h4>
                </div>
                <Badge
                  variant={
                    String(item.status).toLowerCase() === 'approved'
                      ? 'success'
                      : String(item.status).toLowerCase() === 'rejected'
                      ? 'neutral'
                      : 'warning'
                  }
                  className="text-[8px] px-1.5 py-0.5"
                >
                  {item.status || 'Pending'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Extracted Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{Number(item.quantity || 0).toLocaleString()} {item.unit || 'SqM'}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2 text-emerald-600"
                  onClick={() => handleApprove(item.id)}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2 text-rose-600"
                  onClick={() => handleReject(item.id)}
                >
                  <XCircle className="w-3 h-3 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}

export default TakeoffReviewPage;
