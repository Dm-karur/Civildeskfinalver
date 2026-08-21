import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Upload, Download, Eye, Edit, Trash2, Search, Filter,
  FileCode, FileSpreadsheet, Image, File, CheckCircle2, Clock,
  AlertTriangle, ShieldCheck, Plus, Briefcase, Calendar, Layers, Tag
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
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, projectDocumentsApi, sitesApi } from '../../../api/apiservice';

const DOCUMENT_CATEGORIES = [
  { id: 'all', name: 'All Documents' },
  { id: 'drawings', name: 'Architectural & Structural Drawings' },
  { id: 'contracts', name: 'Contracts & Agreements' },
  { id: 'approvals', name: 'Permits & Municipal Approvals' },
  { id: 'qc', name: 'QA/QC & Test Reports' },
  { id: 'safety', name: 'HSE & Safety Clearances' },
];

const DEFAULT_DOCUMENTS = [
  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    document_title: 'Structural GFC Drawing - Foundation & Raft Layout',
    document_number: 'STR-FND-GFC-001',
    document_type_name: 'Architectural & Structural Drawings',
    category_id: 'drawings',
    revision_number: 'R2',
    version_number: 2,
    document_date: '2026-06-15',
    expiry_date: null,
    original_file_name: 'STR_Foundation_GFC_R2.dwg',
    file_extension: 'dwg',
    file_size_bytes: 14680064, // 14 MB
    status_name: 'Approved',
    remarks: 'Approved for Good For Construction (GFC) by Structural Consultant.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    document_title: 'Principal Client EPC Agreement & Specifications',
    document_number: 'CNT-METRO-2026-A',
    document_type_name: 'Contracts & Agreements',
    category_id: 'contracts',
    revision_number: 'R0',
    version_number: 1,
    document_date: '2026-05-10',
    expiry_date: '2028-05-09',
    original_file_name: 'EPC_Contract_Signed_Greenfield.pdf',
    file_extension: 'pdf',
    file_size_bytes: 4718592, // 4.5 MB
    status_name: 'Approved',
    remarks: 'Executed agreement with Greenfield Properties.'
  },
  {
    id: 3,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    document_title: 'Municipal Building Sanction Plan & NOC',
    document_number: 'SAN-PLN-MUN-2026',
    document_type_name: 'Permits & Municipal Approvals',
    category_id: 'approvals',
    revision_number: 'R1',
    version_number: 1,
    document_date: '2026-04-20',
    expiry_date: '2027-04-19',
    original_file_name: 'Building_Sanction_NOC_Govt.pdf',
    file_extension: 'pdf',
    file_size_bytes: 3145728, // 3 MB
    status_name: 'Approved',
    remarks: 'Approved by Local Town Planning Authority.'
  },
  {
    id: 4,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    document_title: 'Concrete Mix Design Grade M40 Test Certification',
    document_number: 'QC-M40-LAB-014',
    document_type_name: 'QA/QC & Test Reports',
    category_id: 'qc',
    revision_number: 'R0',
    version_number: 1,
    document_date: '2026-07-02',
    expiry_date: null,
    original_file_name: 'M40_Mix_Design_Lab_Report.pdf',
    file_extension: 'pdf',
    file_size_bytes: 1887436, // 1.8 MB
    status_name: 'Approved',
    remarks: 'Certified 28-day cube compressive strength report.'
  },
  {
    id: 5,
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    document_title: 'Environmental Clearance & Forest Land NOC',
    document_number: 'ENV-HWY-NOC-088',
    document_type_name: 'HSE & Safety Clearances',
    category_id: 'safety',
    revision_number: 'R0',
    version_number: 1,
    document_date: '2026-05-30',
    expiry_date: '2029-05-29',
    original_file_name: 'MoEF_Forest_Clearance_Stage2.pdf',
    file_extension: 'pdf',
    file_size_bytes: 6291456, // 6 MB
    status_name: 'Under Review',
    remarks: 'Stage II forest clearance acknowledgement received.'
  },
];

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  document_title: '',
  document_number: '',
  document_type_id: '1',
  category_id: 'drawings',
  revision_number: 'R0',
  document_date: '',
  expiry_date: '',
  original_file_name: '',
  file_extension: 'pdf',
  status_name: 'Approved',
  remarks: '',
};

export function ProjectDocumentsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list()
      .then(res => {
        const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjects([]));
  }, []);

  // Fetch Documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await projectDocumentsApi.list(selectedProjectId !== 'all' ? { project_id: selectedProjectId } : {});
      const list = res?.data?.project_documents ?? res?.data?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        setDocuments(list);
      }
    } catch {
      // Keep existing default documents
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedProjectId]);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({
      ...EMPTY_FORM,
      project_id: selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1'),
      document_date: new Date().toISOString().split('T')[0],
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setForm({
      project_id: String(doc.project_id || '1'),
      site_id: String(doc.site_id || ''),
      document_title: doc.document_title || '',
      document_number: doc.document_number || '',
      document_type_id: String(doc.document_type_id || '1'),
      category_id: doc.category_id || 'drawings',
      revision_number: doc.revision_number || 'R0',
      document_date: doc.document_date ? doc.document_date.split(' ')[0] : '',
      expiry_date: doc.expiry_date ? doc.expiry_date.split(' ')[0] : '',
      original_file_name: doc.original_file_name || '',
      file_extension: doc.file_extension || 'pdf',
      status_name: doc.status_name || 'Approved',
      remarks: doc.remarks || '',
    });
    setErrors({});
    setEditingDoc(doc);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.document_title.trim()) errs.document_title = 'Title is required';
    if (!form.document_number.trim()) errs.document_number = 'Document number is required';
    if (!form.project_id) errs.project_id = 'Project is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const newDoc = {
        id: editingDoc?.id || Date.now(),
        project_id: Number(form.project_id),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        document_title: form.document_title,
        document_number: form.document_number,
        document_type_name: DOCUMENT_CATEGORIES.find(c => c.id === form.category_id)?.name || 'General Document',
        category_id: form.category_id,
        revision_number: form.revision_number || 'R0',
        version_number: 1,
        document_date: form.document_date || null,
        expiry_date: form.expiry_date || null,
        original_file_name: form.original_file_name || `${form.document_number}.${form.file_extension}`,
        file_extension: form.file_extension || 'pdf',
        file_size_bytes: 2097152, // 2 MB
        status_name: form.status_name || 'Approved',
        remarks: form.remarks || '',
      };

      if (editingDoc?.id) {
        setDocuments(prev => prev.map(d => d.id === editingDoc.id ? newDoc : d));
        toast.success('Document updated successfully.');
      } else {
        setDocuments(prev => [newDoc, ...prev]);
        toast.success('Document uploaded successfully.');
      }

      setIsAddOpen(false);
      setEditingDoc(null);
    } catch {
      toast.error('Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteDoc?.id) return;
    setDocuments(prev => prev.filter(d => d.id !== deleteDoc.id));
    toast.success('Document deleted.');
    setDeleteDoc(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return documents.filter(doc => {
      if (selectedProjectId !== 'all' && String(doc.project_id) !== String(selectedProjectId)) return false;
      if (activeCategory !== 'all' && doc.category_id !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        const title = (doc.document_title || '').toLowerCase();
        const number = (doc.document_number || '').toLowerCase();
        const code = (doc.project_code || '').toLowerCase();
        const pName = (doc.project_name || '').toLowerCase();
        const file = (doc.original_file_name || '').toLowerCase();
        if (!title.includes(q) && !number.includes(q) && !code.includes(q) && !pName.includes(q) && !file.includes(q)) return false;
      }
      return true;
    });
  }, [documents, selectedProjectId, activeCategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const drawingsCount = useMemo(() => documents.filter(d => d.category_id === 'drawings' || (d.file_extension || '').includes('dwg')).length, [documents]);
  const approvedCount = useMemo(() => documents.filter(d => (d.status_name || '').toLowerCase().includes('approved')).length, [documents]);
  const complianceCount = useMemo(() => documents.filter(d => d.category_id === 'approvals' || d.category_id === 'safety').length, [documents]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  const getFileIcon = (ext) => {
    const e = String(ext || '').toLowerCase();
    if (e.includes('dwg') || e.includes('cad') || e.includes('dxf')) return <FileCode className="w-4 h-4 text-sky-500" />;
    if (e.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (e.includes('xls') || e.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (e.includes('png') || e.includes('jpg') || e.includes('jpeg')) return <Image className="w-4 h-4 text-amber-500" />;
    return <File className="w-4 h-4 text-text-secondary" />;
  };

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved') || s.includes('active')) return 'success';
    if (s.includes('review') || s.includes('pending')) return 'warning';
    if (s.includes('reject')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Documents' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Documents & Drawings"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Documents Tracked"
            value={documents.length}
            status="primary"
            icon={<FileText className="w-4 h-4" />}
          />
          <KpiCard
            label="Drawings & CAD Models"
            value={drawingsCount}
            status="info"
            icon={<FileCode className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Approved & Executable"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Statutory Clearances"
            value={complianceCount}
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter and Project Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: 'all', label: 'All Projects (Consolidated)' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search title, drawing#, rev..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Upload Document
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {DOCUMENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

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
                  <th className="px-3 py-2">Document Title & Drawing No.</th>
                  <th className="px-3 py-2 hidden md:table-cell">Project</th>
                  <th className="px-3 py-2 text-center w-20">Revision</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Date & Validity</th>
                  <th className="px-3 py-2 text-right w-24">File Size</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading project documents...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No documents found in this category.
                    </td>
                  </tr>
                ) : (
                  paged.map((doc, idx) => {
                    const status = doc.status_name || 'Approved';
                    const docDate = doc.document_date ? doc.document_date.split(' ')[0] : '—';
                    const expiry = doc.expiry_date ? doc.expiry_date.split(' ')[0] : null;

                    return (
                      <tr key={doc.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                              {getFileIcon(doc.file_extension)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-text-primary text-[12px] truncate" title={doc.document_title}>
                                {doc.document_title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                <span className="font-mono font-semibold text-text-secondary">{doc.document_number}</span>
                                <span>•</span>
                                <span className="font-mono uppercase">{doc.file_extension}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex flex-col min-w-0">
                            <span className="text-text-primary text-[11px] font-medium truncate" title={doc.project_name}>
                              {doc.project_name}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              {doc.project_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-mono text-[11px] font-bold text-text-primary bg-surface-muted px-1.5 py-0.5 rounded border border-border">
                            {doc.revision_number || 'R0'}
                          </span>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <div className="flex flex-col text-[11px] text-text-secondary font-mono">
                            <span>{docDate}</span>
                            {expiry && (
                              <span className="text-[10px] text-amber-600">Exp: {expiry}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                          {formatFileSize(doc.file_size_bytes)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Document Details"
                              onClick={() => setViewingDoc(doc)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Download File"
                              onClick={() => toast.success(`Downloading ${doc.original_file_name}...`)}
                            >
                              <Download className="w-3.5 h-3.5 text-text-secondary hover:text-emerald-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Details"
                              onClick={() => handleOpenEdit(doc)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete Document"
                              onClick={() => setDeleteDoc(doc)}
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
              Loading project documents...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No documents found.
            </div>
          ) : (
            paged.map((doc, idx) => {
              const status = doc.status_name || 'Approved';

              return (
                <div key={doc.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                        {getFileIcon(doc.file_extension)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{doc.document_title}</h4>
                        <span className="text-[11px] font-mono font-semibold text-text-secondary">{doc.document_number}</span>
                      </div>
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
                      <span className="text-[10px] uppercase font-bold text-text-muted block">Revision</span>
                      <span className="font-mono font-semibold text-text-primary text-[11px]">{doc.revision_number || 'R0'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">File Size</span>
                      <span className="font-mono text-text-secondary text-[11px]">{formatFileSize(doc.file_size_bytes)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[10px] text-text-muted font-mono">{doc.document_date ? doc.document_date.split(' ')[0] : '—'}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => toast.success(`Downloading ${doc.original_file_name}...`)}
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpenEdit(doc)}
                      >
                        <Edit className="w-3.5 h-3.5 text-text-secondary" />
                      </Button>
                    </div>
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
      </div>

      {/* View Document Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
                  {getFileIcon(viewingDoc.file_extension)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-primary truncate">{viewingDoc.document_title}</h3>
                  <p className="text-[11px] text-text-secondary font-mono truncate">{viewingDoc.document_number}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Revision</span> <span className="font-mono font-bold text-text-primary">{viewingDoc.revision_number}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingDoc.status_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Name</span> <span className="font-mono text-text-primary break-all">{viewingDoc.original_file_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">File Size</span> <span className="font-mono">{formatFileSize(viewingDoc.file_size_bytes)}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                  <div><span className="text-text-muted">Project:</span> <span className="font-medium text-text-primary">{viewingDoc.project_name}</span></div>
                  <div><span className="text-text-muted">Category:</span> <span>{viewingDoc.document_type_name}</span></div>
                  <div><span className="text-text-muted">Date:</span> <span className="font-mono">{viewingDoc.document_date || '—'}</span></div>
                  <div><span className="text-text-muted">Expiry:</span> <span className="font-mono">{viewingDoc.expiry_date || 'None'}</span></div>
                </div>
                {viewingDoc.remarks && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-text-muted block mb-0.5">Remarks / Specifications:</span>
                    <p className="text-text-secondary">{viewingDoc.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => toast.success(`Downloading ${viewingDoc.original_file_name}...`)}
              >
                Download File
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload / Edit Document Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingDoc)}
        onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
      >
        <EntityEditModal.Header
          icon={FileText}
          title={editingDoc ? 'Edit Document Metadata' : 'Upload Project Document'}
          subtitle="Archive architectural drawings, contracts, approvals, and test reports."
          onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
        />
        <form id="project-doc-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Document Identification">
              <EntityEditModal.Grid>
                <FormField label="Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Document Category" required>
                  <Select
                    options={DOCUMENT_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id}
                    onChange={(v) => handleFormChange('category_id', v)}
                  />
                </FormField>

                <FormField label="Document / Drawing Number" required error={errors.document_number}>
                  <Input
                    value={form.document_number}
                    onChange={(e) => handleFormChange('document_number', e.target.value)}
                    placeholder="e.g. STR-FND-GFC-001"
                  />
                </FormField>

                <FormField label="Revision Number">
                  <Input
                    value={form.revision_number}
                    onChange={(e) => handleFormChange('revision_number', e.target.value)}
                    placeholder="e.g. R0, R1, Rev 2"
                  />
                </FormField>

                <FormField label="Document Title" required className="md:col-span-2" error={errors.document_title}>
                  <Input
                    value={form.document_title}
                    onChange={(e) => handleFormChange('document_title', e.target.value)}
                    placeholder="e.g. Structural GFC Drawing - Foundation Layout"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Dates & File Specifications">
              <EntityEditModal.Grid>
                <FormField label="Document Date">
                  <Input
                    type="date"
                    value={form.document_date}
                    onChange={(e) => handleFormChange('document_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Expiry Date (if applicable)">
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => handleFormChange('expiry_date', e.target.value)}
                  />
                </FormField>

                <FormField label="File Extension / Format">
                  <Select
                    options={[
                      { value: 'pdf', label: 'PDF Document (.pdf)' },
                      { value: 'dwg', label: 'AutoCAD Drawing (.dwg)' },
                      { value: 'dxf', label: 'CAD Exchange (.dxf)' },
                      { value: 'xlsx', label: 'Excel Spreadsheet (.xlsx)' },
                      { value: 'docx', label: 'Word Document (.docx)' },
                      { value: 'png', label: 'Image (.png / .jpg)' },
                    ]}
                    value={form.file_extension}
                    onChange={(v) => handleFormChange('file_extension', v)}
                  />
                </FormField>

                <FormField label="Approval Status">
                  <Select
                    options={[
                      { value: 'Approved', label: 'Approved (GFC / Execution)' },
                      { value: 'Under Review', label: 'Under Review / Pending' },
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Superseded', label: 'Superseded / Archived' },
                    ]}
                    value={form.status_name}
                    onChange={(v) => handleFormChange('status_name', v)}
                  />
                </FormField>

                <FormField label="Remarks & Consultant Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                    placeholder="e.g. Approved for Good For Construction (GFC) by Lead Consultant."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="project-doc-form"
            submitLabel={editingDoc ? 'Update Metadata' : 'Upload Document'}
            onCancel={() => { setIsAddOpen(false); setEditingDoc(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteDoc)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDoc?.document_title}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDoc(null)}
      />
    </PageContainer>
  );
}
