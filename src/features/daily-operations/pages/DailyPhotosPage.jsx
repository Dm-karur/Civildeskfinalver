import { useState, useEffect, useMemo } from 'react';
import {
  Image, Camera, CheckCircle2, MapPin, Calendar,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Download
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
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
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const DEFAULT_PHOTOS = [
  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    title: 'Level 2 Column Reinforcement Cage & Cover Blocks Inspection',
    tag: 'Pre-Pour QC Inspection',
    location: 'Tower Core 1 Grid C1-C6',
    date: '2026-08-21',
    time: '10:45 AM',
    gps_coordinates: '10.9602° N, 78.0766° E',
    photographer: 'Er. Senthil Nathan (QA/QC)',
    file_name: 'IMG_20260821_CORE1_REBAR.jpg',
    description: 'Verified 40mm clear cover blocks and stirrup spacing at 100mm c/c.',
    aspect_color: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    title: 'Transit Mixer Concrete Discharge into Stationary Pump',
    tag: 'Concrete Pour Log',
    location: 'Ground Floor Pour Bay 1',
    date: '2026-08-21',
    time: '11:30 AM',
    gps_coordinates: '10.9604° N, 78.0768° E',
    photographer: 'Er. Rajesh Kumar (Site Incharge)',
    file_name: 'IMG_20260821_POUR_BAY1.jpg',
    description: 'Slump test checked at 120mm on site before pumping.',
    aspect_color: 'bg-sky-950/20 border-sky-500/30 text-sky-400'
  },
  {
    id: 3,
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    title: 'Vibratory Soil Compactor Passing Sub-base Granular Layer',
    tag: 'Highway Earthworks',
    location: 'Ch. 16+300 RHS Box Culvert',
    date: '2026-08-21',
    time: '09:15 AM',
    gps_coordinates: '10.8245° N, 78.1420° E',
    photographer: 'K. Balaji (Highway PM)',
    file_name: 'IMG_20260821_HW_COMPACTION.jpg',
    description: 'Roller pass 6 of 8 completed with optimum moisture content.',
    aspect_color: 'bg-amber-950/20 border-amber-500/30 text-amber-400'
  },
];

const EMPTY_FORM = {
  project_id: '',
  title: '',
  tag: 'Pre-Pour QC Inspection',
  location: 'Level 2 Floor Deck',
  date: '',
  time: '10:00 AM',
  gps_coordinates: '10.9602° N, 78.0766° E',
  photographer: 'Site QA Engineer',
  description: '',
};

export function DailyPhotosPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [photos, setPhotos] = useState(DEFAULT_PHOTOS);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Photo title is required';
    if (!form.location.trim()) errs.location = 'Location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));

      const newPhoto = {
        id: Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        title: form.title,
        tag: form.tag,
        location: form.location,
        date: form.date,
        time: form.time,
        gps_coordinates: form.gps_coordinates,
        photographer: form.photographer,
        file_name: `IMG_${form.date.replace(/-/g, '')}_${Date.now().toString().slice(-4)}.jpg`,
        description: form.description,
        aspect_color: 'bg-primary/20 border-primary/30 text-primary',
      };

      setPhotos(prev => [newPhoto, ...prev]);
      toast.success('Site progress photo uploaded with geo-tag.');
      setIsAddOpen(false);
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setPhotos(prev => prev.filter(p => p.id !== deleteItem.id));
    toast.success('Photo removed.');
    setDeleteItem(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return photos.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (tagFilter !== 'all' && !p.tag.includes(tagFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const tit = String(p.title || '').toLowerCase();
        const tag = String(p.tag || '').toLowerCase();
        const loc = String(p.location || '').toLowerCase();
        if (!tit.includes(s) && !tag.includes(s) && !loc.includes(s)) return false;
      }
      return true;
    });
  }, [photos, selectedProjectId, tagFilter, search]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Site Photo Gallery' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Geo-Tagged Site Progress Photos & Visual Records"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Captured Site Photos"
            value={photos.length}
            status="primary"
            icon={<Camera className="w-4 h-4" />}
          />
          <KpiCard
            label="Geo-Tag GPS Accuracy"
            value="100% Tagged"
            status="success"
            icon={<MapPin className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="QC Pre-Pour Evidence"
            value="Verified"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Client Visual Reports"
            value="Available"
            status="neutral"
            icon={<Image className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Photo Tags' },
                  { value: 'Pre-Pour', label: 'Pre-Pour QC' },
                  { value: 'Concrete', label: 'Concrete Pours' },
                  { value: 'Highway', label: 'Earthworks' },
                ]}
                value={tagFilter}
                onChange={setTagFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search photo title, tag, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Upload Site Photo
            </Button>
          </div>
        </div>

        {/* Visual Photo Cards Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group">
              <div>
                {/* Photo Simulation Canvas / Banner */}
                <div className={`h-40 ${p.aspect_color} border-b flex flex-col items-center justify-center relative p-4 text-center group-hover:scale-[1.01] transition-transform`}>
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center mb-2 text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    {p.file_name}
                  </span>
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="primary" className="text-[8px] uppercase tracking-wider font-bold">
                      {p.tag}
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
                    <span>{p.date} • {p.time}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{p.location} ({p.gps_coordinates})</span>
                  </div>
                  {p.description && (
                    <p className="text-[11px] text-text-secondary line-clamp-2 bg-surface-muted/30 p-2 rounded border border-border/50">
                      {p.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-3.5 py-2.5 border-t border-border bg-surface-muted/20 flex justify-between items-center text-xs">
                <span className="text-[10px] text-text-muted font-medium">{p.photographer}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                    <Eye className="w-3 h-3 mr-1" /> View Full
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-text-muted hover:text-error" onClick={() => setDeleteItem(p)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Photo 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.title}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.date} • {viewingItem.time}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className={`h-52 ${viewingItem.aspect_color} border rounded-lg flex flex-col items-center justify-center p-4 text-center`}>
                <Camera className="w-10 h-10 mb-2 opacity-80" />
                <span className="font-mono text-xs font-bold text-white bg-black/60 px-3 py-1 rounded backdrop-blur-md">
                  {viewingItem.file_name}
                </span>
                <span className="text-[10px] text-white/80 font-mono mt-1">Geo-Location: {viewingItem.gps_coordinates}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Work Category Tag</span> <span className="font-semibold text-primary">{viewingItem.tag}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Captured By</span> <span className="text-text-primary font-medium">{viewingItem.photographer}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Site Location</span> <span className="text-emerald-700 font-medium">📍 {viewingItem.location}</span></div>
              </div>

              {viewingItem.description && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Inspection Observations:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={() => toast.success(`Downloading ${viewingItem.file_name}...`)}>
                <Download className="w-3.5 h-3.5 mr-1" /> Download High-Res
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      <EntityEditModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      >
        <EntityEditModal.Header
          icon={Camera}
          title="Upload Site Progress Photo"
          subtitle="Record visual evidence with timestamp and GPS coordinates for client DPR dossier."
          onClose={() => setIsAddOpen(false)}
        />
        <form id="photo-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Photo Details & Location">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Category Tag">
                  <Select
                    options={[
                      { value: 'Pre-Pour QC Inspection', label: 'Pre-Pour QC Inspection' },
                      { value: 'Concrete Pour Log', label: 'Concrete Pour Log' },
                      { value: 'Highway Earthworks', label: 'Highway Earthworks' },
                      { value: 'Safety Clearance', label: 'Safety Clearance' },
                      { value: 'Finishing Works', label: 'Finishing Works' },
                    ]}
                    value={form.tag}
                    onChange={(v) => handleFormChange('tag', v)}
                  />
                </FormField>

                <FormField label="Photo Title / Subject" required error={errors.title} className="md:col-span-2">
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Level 2 Column Reinforcement Inspection"
                  />
                </FormField>

                <FormField label="Site Location / Grid" required error={errors.location} className="md:col-span-2">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Tower Core 1 Grid C1-C6"
                  />
                </FormField>

                <FormField label="GPS Coordinates">
                  <Input
                    value={form.gps_coordinates}
                    onChange={(e) => handleFormChange('gps_coordinates', e.target.value)}
                    placeholder="10.9602° N, 78.0766° E"
                  />
                </FormField>

                <FormField label="Photographer / QA Engineer">
                  <Input
                    value={form.photographer}
                    onChange={(e) => handleFormChange('photographer', e.target.value)}
                    placeholder="e.g. Er. Senthil Nathan"
                  />
                </FormField>

                <FormField label="Inspection Observations" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Clear cover verified, stirrups spacing checked..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="photo-form"
            submitLabel="Upload Photo"
            onCancel={() => setIsAddOpen(false)}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Photo"
        message={`Are you sure you want to delete "${deleteItem?.title}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
