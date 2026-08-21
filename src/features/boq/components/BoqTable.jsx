import { useState, useEffect } from 'react';
import { Eye, Edit, MoreVertical, Send, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { boqApi } from '../../../api/apiservice';
import { toast } from '../../../components/composite/Toast';

function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data?.project_boqs)) return response.data.project_boqs;
  if (Array.isArray(response.project_boqs)) return response.project_boqs;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

const getStatusVariant = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('approved')) return 'success';
  if (s.includes('submitted') || s.includes('pending')) return 'warning';
  if (s.includes('rejected')) return 'error';
  return 'neutral';
};

export function BoqTable({ searchQuery = '', refreshKey = 0, onEdit, onView, filters, onAction }) {
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    boqApi.list()
      .then((res) => setBoqs(extractList(res)))
      .catch(() => setBoqs([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = boqs.filter((boq) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (boq.boq_name || boq.name || '').toLowerCase();
      const code = (boq.boq_code || boq.code || '').toLowerCase();
      const project = (boq.project_name || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !project.includes(q)) return false;
    }
    if (filters?.status !== 'all') {
      const s = String(boq.status_name || boq.status || '').toLowerCase();
      if (!s.includes(filters.status)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAction = async (id, actionName) => {
    try {
      await boqApi[actionName](id, {});
      toast.success(`BOQ ${actionName}ed successfully.`);
      onAction?.();
    } catch (error) {
      toast.error(error?.message || `Failed to ${actionName} BOQ.`);
    }
  };

  return (
    <DataTableContainer
      pagination={<Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />}
    >
      <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
        <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
          <tr>
            <th className="px-2 py-1.5 w-10 text-center">#</th>
            <th className="px-2 py-1.5 w-24">BOQ Code</th>
            <th className="px-2 py-1.5 w-48">BOQ Name</th>
            <th className="px-2 py-1.5 w-40">Project</th>
            <th className="px-2 py-1.5 w-28 text-center">Status</th>
            <th className="px-2 py-1.5 w-20 text-right">Sections</th>
            <th className="px-2 py-1.5 w-20 text-right">Items</th>
            <th className="px-2 py-1.5 text-right w-28">Total (₹)</th>
            <th className="px-2 py-1.5 text-center w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr><td colSpan="9" className="text-center py-6 text-text-muted text-[12px]">Loading BOQs...</td></tr>
          ) : paged.length === 0 ? (
            <tr><td colSpan="9" className="text-center py-6 text-text-muted text-[12px]">No BOQs found.</td></tr>
          ) : (
            paged.map((boq, index) => {
              const status = boq.status_name || boq.status || 'Draft';
              const total = boq.total_amount || boq.grand_total || 0;
              const isDraft = String(status).toLowerCase().includes('draft');

              return (
                <tr key={boq.id || index} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-2 py-1 font-mono font-semibold text-text-primary text-[11px]">{boq.boq_code || boq.code || '—'}</td>
                  <td className="px-2 py-1 font-medium text-text-primary truncate">{boq.boq_name || boq.name || '—'}</td>
                  <td className="px-2 py-1 text-text-secondary truncate">{boq.project_name || '—'}</td>
                  <td className="px-2 py-1 text-center">
                    <Badge variant={getStatusVariant(status)} className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none">{status}</Badge>
                  </td>
                  <td className="px-2 py-1 text-right text-text-secondary text-[11px]">{boq.section_count ?? '—'}</td>
                  <td className="px-2 py-1 text-right text-text-secondary text-[11px]">{boq.item_count ?? '—'}</td>
                  <td className="px-2 py-1 text-right font-mono font-semibold text-text-primary text-[11px]">₹{Number(total).toLocaleString('en-IN')}</td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="View" onClick={() => onView?.(boq)}>
                        <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>
                      {isDraft && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit" onClick={() => onEdit?.(boq)}>
                          <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>
                      )}
                      {isDraft && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Submit" onClick={() => handleAction(boq.id, 'submit')}>
                          <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </DataTableContainer>
  );
}
