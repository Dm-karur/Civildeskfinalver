import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Trash2, Send, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
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
  if (s.includes('review') || s.includes('submitted') || s.includes('pending')) return 'warning';
  if (s.includes('rejected')) return 'error';
  return 'neutral';
};

export function BoqTable({ searchQuery = '', refreshKey = 0, onEdit, onView, filters, onAction }) {
  const [boqs, setBoqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    boqApi.list()
      .then((res) => setBoqs(extractList(res)))
      .catch(() => setBoqs([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return boqs.filter((boq) => {
      if (filters?.project_id && filters.project_id !== 'all') {
        if (String(boq.project_id) !== String(filters.project_id)) return false;
      }
      if (filters?.status && filters.status !== 'all') {
        const s = String(boq.status_name || boq.status || boq.status_code || '').toLowerCase();
        if (!s.includes(filters.status.toLowerCase())) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (boq.boq_name || boq.name || '').toLowerCase();
        const code = (boq.boq_code || boq.code || '').toLowerCase();
        const project = (boq.project_name || '').toLowerCase();
        const pCode = (boq.project_code || '').toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !project.includes(q) && !pCode.includes(q)) return false;
      }
      return true;
    });
  }, [boqs, filters, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleAction = async (id, actionName) => {
    try {
      if (typeof boqApi[actionName] === 'function') {
        await boqApi[actionName](id, {});
      } else {
        await boqApi.update(id, { action: actionName });
      }
      toast.success(`BOQ status updated to ${actionName}.`);
      onAction?.();
    } catch (error) {
      toast.error(error?.message || `Failed to update BOQ.`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await boqApi.remove(deleteTarget.id);
      toast.success('BOQ removed successfully.');
      onAction?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete BOQ.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
      <div className="hidden sm:block">
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
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
                <th className="px-3 py-2 w-28">BOQ Code</th>
                <th className="px-3 py-2">BOQ Name</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-center w-20 hidden md:table-cell">Sections</th>
                <th className="px-3 py-2 text-center w-20 hidden md:table-cell">Items</th>
                <th className="px-3 py-2 text-right w-28">Total (₹)</th>
                <th className="px-3 py-2 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                    Loading BOQs...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                    No BOQs found matching criteria.
                  </td>
                </tr>
              ) : (
                paged.map((boq, index) => {
                  const status = boq.status_name || boq.status || 'Draft';
                  const total = boq.total_amount || boq.grand_total || 0;
                  const isDraft = String(status).toLowerCase().includes('draft');

                  return (
                    <tr key={boq.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-text-primary text-[11px]">
                        {boq.boq_code || boq.code || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-text-primary text-[12px] truncate block" title={boq.boq_name || boq.name}>
                          {boq.boq_name || boq.name || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-text-primary text-[11px] font-medium truncate" title={boq.project_name}>
                            {boq.project_name || '—'}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {boq.project_code || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center text-text-secondary text-[11px] hidden md:table-cell">
                        {boq.section_count ?? boq.sections_count ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-text-secondary text-[11px] hidden md:table-cell">
                        {boq.item_count ?? boq.items_count ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-text-primary text-[11px]">
                        ₹{Number(total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View BOQ Details"
                            onClick={() => onView?.(boq)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit BOQ"
                              onClick={() => onEdit?.(boq)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {isDraft && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Submit for Approval"
                              onClick={() => handleAction(boq.id, 'submit')}
                            >
                              <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteTarget(boq)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* Mobile View - Cards List for Phones (< sm) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading BOQs...
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No BOQs found matching criteria.
          </div>
        ) : (
          paged.map((boq, index) => {
            const status = boq.status_name || boq.status || 'Draft';
            const total = boq.total_amount || boq.grand_total || 0;
            const isDraft = String(status).toLowerCase().includes('draft');

            return (
              <div key={boq.id || index} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-text-muted block">{boq.boq_code || boq.code || '—'}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{boq.boq_name || boq.name}</h4>
                  </div>
                  <Badge
                    variant={getStatusVariant(status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                  >
                    {status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Project</span>
                    <span className="font-medium text-text-primary text-[11px] truncate block">{boq.project_name || '—'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Total Amount</span>
                    <span className="font-mono font-bold text-text-primary text-[11px]">₹{Number(total).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => onView?.(boq)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {isDraft && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => onEdit?.(boq)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteTarget(boq)}>
                    <Trash2 className="w-3.5 h-3.5 text-error" />
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={() => {}}
          />
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete BOQ"
        message={`Are you sure you want to delete "${deleteTarget?.boq_name || deleteTarget?.boq_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
