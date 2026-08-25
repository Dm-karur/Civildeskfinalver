import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Coins,
  FileSpreadsheet,
  FileText,
  FolderCog,
  FolderKanban,
  HardHat,
  IndianRupee,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
import { navigationApi } from '../../api/apiservice';
import { useAuth } from '../../features/auth/context/AuthContext';

const ICONS = Object.freeze({
  'layout-dashboard': LayoutDashboard,
  'briefcase': Briefcase,
  'map-pin': MapPin,
  'calculator': Calculator,
  'calendar-range': CalendarRange,
  'calendar': Calendar,
  'users': Users,
  'package': Package,
  'shopping-cart': ShoppingCart,
  'clipboard-list': ClipboardList,
  'hard-hat': HardHat,
  'receipt-indian-rupee': IndianRupee,
  'indian-rupee': IndianRupee,
  'receipt': Receipt,
  'landmark': Landmark,
  'bar-chart-3': BarChart3,
  'bar-chart': BarChart3,
  'message-square': MessageSquare,
  'monitor-smartphone': MonitorSmartphone,
  'folder-cog': FolderCog,
  'folder-kanban': FolderKanban,
  'project-masters': FolderKanban,
  'labour-masters': UserCheck,
  'material-masters': Boxes,
  'procurement-masters': Truck,
  'finance-masters': Coins,
  'settings': Settings,
  'layers': Layers,
  'wallet': Wallet,
  'file-spreadsheet': FileSpreadsheet,
  'file-text': FileText,
  'building': Building2,
  'shield-check': ShieldCheck,
  'menu': Menu,
});

const CODE_ICONS = Object.freeze({
  DASHBOARD: LayoutDashboard,
  PROJECTS: Briefcase,
  SITES_LOCATIONS: MapPin,
  SITES: MapPin,
  BOQ_BUDGET: Calculator,
  BOQ: FileSpreadsheet,
  BUDGETS: Wallet,
  PROJECT_PLANNING: CalendarRange,
  LABOUR_ATTENDANCE: Users,
  LABOUR: Users,
  MATERIALS_INVENTORY: Package,
  MATERIALS: Package,
  PROCUREMENT: ShoppingCart,
  DAILY_SITE_OPERATIONS: ClipboardList,
  DAILY_OPERATIONS: ClipboardList,
  SUBCONTRACT_MANAGEMENT: HardHat,
  SUBCONTRACTS: HardHat,
  CLIENT_BILLING: IndianRupee,
  RECEIVABLES: IndianRupee,
  FINANCE_COST_CONTROL: Landmark,
  FINANCE: Landmark,
  EXPENSES: Landmark,
  REPORTS_ANALYTICS: BarChart3,
  REPORTS: BarChart3,
  COMMUNICATION: MessageSquare,
  CLIENT_PORTAL: MonitorSmartphone,
  MASTERS: FolderCog,
  PROJECT_MASTERS: FolderKanban,
  LABOUR_MASTERS: UserCheck,
  MATERIAL_MASTERS: Boxes,
  PROCUREMENT_MASTERS: Truck,
  FINANCE_MASTERS: Coins,
  ADMINISTRATION: Settings,
  SETTINGS: Settings,
});

function getIcon(item) {
  if (item.icon_key && ICONS[item.icon_key]) {
    return ICONS[item.icon_key];
  }
  if (item.item_code && CODE_ICONS[item.item_code]) {
    return CODE_ICONS[item.item_code];
  }
  if (item.route_path) {
    const path = item.route_path.toLowerCase();
    if (path.includes('dashboard')) return LayoutDashboard;
    if (path.includes('project')) return Briefcase;
    if (path.includes('site')) return MapPin;
    if (path.includes('boq')) return FileSpreadsheet;
    if (path.includes('budget')) return Wallet;
    if (path.includes('planning')) return CalendarRange;
    if (path.includes('labour') || path.includes('attendance') || path.includes('wages')) return Users;
    if (path.includes('material') || path.includes('stock')) return Package;
    if (path.includes('procurement') || path.includes('purchase')) return ShoppingCart;
    if (path.includes('daily') || path.includes('operation')) return ClipboardList;
    if (path.includes('subcontract')) return HardHat;
    if (path.includes('receivable') || path.includes('billing') || path.includes('invoice')) return IndianRupee;
    if (path.includes('finance') || path.includes('expense') || path.includes('cost')) return Landmark;
    if (path.includes('report')) return BarChart3;
    if (path.includes('communication') || path.includes('message')) return MessageSquare;
    if (path.includes('portal')) return MonitorSmartphone;
    if (path.includes('master')) return FolderCog;
    if (path.includes('admin') || path.includes('setting') || path.includes('user') || path.includes('role')) return Settings;
  }
  return Menu;
}

function NavigationItem({ item, openByDepth, onToggle, onNavigate, depth = 0 }) {
  const Icon = getIcon(item);
  const children = item.children ?? [];
  const expanded = openByDepth[depth] === item.item_code;
  const hasCustomIcon = Boolean(item.icon_key && ICONS[item.icon_key]);

  if (item.item_type === 'DIVIDER') return <div className="my-2 h-px bg-white/10" />;
  if (item.item_type === 'SECTION') {
    return <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[#C8D1DC]/50">{item.item_name}</div>;
  }

  if (children.length === 0 && item.route_path) {
    return (
      <NavLink
        to={item.route_path}
        end
        onClick={onNavigate}
        style={{ paddingLeft: `${8 + (depth * 16)}px` }}
        className={({ isActive }) => clsx(
          'flex h-10 items-center gap-3 rounded-sm px-2 text-[13px] font-medium transition-colors',
          isActive ? 'bg-primary text-white' : 'text-[#C8D1DC] hover:bg-white/5 hover:text-white',
        )}
      >
        {depth === 0 || hasCustomIcon ? (
          <Icon className={clsx(depth === 0 ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0 opacity-80")} />
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
        )}
        <span className="truncate">{item.item_name}</span>
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(item.item_code, depth)}
        style={{ paddingLeft: `${8 + (depth * 16)}px` }}
        className="flex h-10 w-full items-center justify-between rounded-sm px-2 text-[13px] font-medium text-[#C8D1DC] hover:bg-white/5 hover:text-white"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-3">
          {depth === 0 || hasCustomIcon ? (
            <Icon className={clsx(depth === 0 ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0 opacity-80")} />
          ) : (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
          )}
          <span className="truncate">{item.item_name}</span>
        </span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="flex flex-col gap-0.5">
          {children.map((child) => (
            <NavigationItem
              key={child.item_code}
              item={child}
              openByDepth={openByDepth}
              onToggle={onToggle}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [navigation, setNavigation] = useState([]);
  const [error, setError] = useState('');
  const [openByDepth, setOpenByDepth] = useState({});

  useEffect(() => {
    let active = true;

    // Hide submenus that are not fully supported by the backend yet
    const HIDDEN_PATHS = [
      '/dashboards/projects',
      '/dashboards/sites',
      '/dashboards/finance',
      '/alerts',
      '/notifications',
      '/planning',
      '/procurement',
      '/materials/delivery-challans',
      '/materials/consumption',
      '/materials/ledger',
      '/subcontracts/work-order-approval',
      '/subcontracts/certificates',
      '/subcontracts/bill-approval',
      '/subcontracts/completion',
      '/subcontracts/retention',
      // Finance — localStorage mock pages (no real backend)
      '/finance/budget-vs-actual',
      '/finance/material-costs',
      '/finance/labour-costs',
      '/finance/subcontract-costs',
      '/finance/equipment-costs',
      '/finance/other-expenses',
      '/finance/income',
      '/finance/vendor-payables',
      '/finance/profitability',
      '/finance/cash-flow',
      // Reports — no backend data source
      '/reports/boq-progress',
      '/reports/material-shortage',
      '/reports/client-receivables',
      '/reports/vendor-payables',
      '/reports/project-profitability',
      '/reports/daily-site',
      '/reports/management-summary',
      // Communication — entire module (no backend)
      '/communication/',
      // Client Portal — entire module (no backend)
      '/client-portal/',
      // Masters — UnderConstruction placeholder pages
      '/masters/labour-types',
      '/masters/trades',
      '/masters/wage-rates',
      '/masters/crews',
      '/masters/brands',
      '/masters/warehouses',
      '/masters/payment-terms',
      '/masters/tax-rates',
      '/masters/income-categories',
      '/masters/banks',
      '/masters/accounts',
      '/masters/cost-heads',
      '/receivables'
    ];

    const filterHidden = (items) => {
      return items
        .map(item => ({
          ...item,
          children: item.children ? filterHidden(item.children) : []
        }))
        .filter(item => {
          // Hide specific submenus by checking route_path
          if (item.route_path && HIDDEN_PATHS.some(path => item.route_path.includes(path))) {
            return false;
          }
          // Hide specific parent menus by name
          if (item.item_name && ['Project Planning', 'Procurement', 'Client Billing & Receivables', 'Communication', 'Client Portal'].includes(item.item_name.trim())) {
            return false;
          }
          // Hide parent menus that have no visible children after filtering
          if (item.children && item.children.length === 0 && !item.route_path) {
            return false;
          }
          return true;
        });
    };

    navigationApi.list()
      .then((items) => {
        if (active) {
          const filterNavigation = (navItems) => {
            return navItems.map((item) => {
              let newItem = { ...item };
              if (newItem.children) {
                newItem.children = filterNavigation(newItem.children);
              }
              
              if (
                newItem.item_code === 'LABOUR' ||
                newItem.item_code === 'LABOUR_ATTENDANCE' ||
                (newItem.item_name && ['labour', 'labour & attendance'].includes(newItem.item_name.toLowerCase().trim()))
              ) {
                newItem.item_name = 'Labour & Attendance';
                newItem.children = [
                  { item_code: 'LABOUR_REGISTER', item_name: 'Labour Register', route_path: '/labour', icon_key: 'users' },
                  { item_code: 'LABOUR_DEPLOYMENT', item_name: 'Labour Deployment', route_path: '/labour/deployment', icon_key: 'map-pin' },
                  { item_code: 'DAILY_ATTENDANCE', item_name: 'Daily Attendance', route_path: '/labour/attendance', icon_key: 'calendar-check' },
                  { item_code: 'ATTENDANCE_EXCEPTIONS', item_name: 'Attendance Exceptions', route_path: '/labour/attendance-exceptions', icon_key: 'alert-triangle' },
                  { item_code: 'TIMESHEETS', item_name: 'Timesheets', route_path: '/labour/timesheets', icon_key: 'clock' },
                  { item_code: 'OVERTIME', item_name: 'Overtime', route_path: '/labour/overtime', icon_key: 'hourglass' },
                  { item_code: 'LEAVE_MANAGEMENT', item_name: 'Leave Management', route_path: '/labour/leave', icon_key: 'calendar-minus' },
                  { item_code: 'DAILY_WAGES', item_name: 'Daily Wages', route_path: '/labour/wages', icon_key: 'indian-rupee' },
                  { item_code: 'MANPOWER_COST', item_name: 'Manpower Cost', route_path: '/labour/manpower-cost', icon_key: 'calculator' },
                  { item_code: 'WAGE_APPROVAL', item_name: 'Wage Approval', route_path: '/labour/wage-approval', icon_key: 'check-square' },
                  { item_code: 'LABOUR_REPORTS', item_name: 'Labour Reports', route_path: '/reports/labour', icon_key: 'pie-chart' },
                ];
              }

              if (newItem.item_code === 'BOQ_BUDGET' || (newItem.item_name && newItem.item_name.includes('BOQ & Project Budget'))) {
                 newItem.item_name = 'BOQ & Project Budget';
                 newItem.children = [
                   { item_code: 'BOQ_REGISTER', item_name: 'BOQ Register', route_path: '/boq', icon_key: 'file-spreadsheet' },
                   { item_code: 'BOQ_SECTIONS', item_name: 'BOQ Sections', route_path: '/boq/sections', icon_key: 'layers' },
                   { item_code: 'BOQ_ITEMS', item_name: 'BOQ Items', route_path: '/boq/items', icon_key: 'clipboard-list' },
                   { item_code: 'BUDGET_SUMMARY', item_name: 'Budget Summary', route_path: '/budgets', icon_key: 'wallet' },
                   { item_code: 'BUDGET_REVISIONS', item_name: 'Budget Revisions', route_path: '/budgets/revisions', icon_key: 'history' },
                   { item_code: 'VARIATION_ORDERS', item_name: 'Variation Orders', route_path: '/budgets/variations', icon_key: 'trending-up' },
                   { item_code: 'CHANGE_APPROVAL', item_name: 'Change Approval', route_path: '/budgets/approvals', icon_key: 'check-square' },
                   { item_code: 'DRAWING_TAKEOFF', item_name: 'Drawing Quantity Takeoff', route_path: '/takeoff', icon_key: 'pen-tool' },
                   { item_code: 'TAKEOFF_REVIEW', item_name: 'Takeoff Review', route_path: '/takeoff/review', icon_key: 'eye' },
                   { item_code: 'CONVERT_TAKEOFF', item_name: 'Convert Takeoff to BOQ', route_path: '/takeoff/convert', icon_key: 'refresh-cw' }
                 ];
              }

              // Rework Project Menu
              if (newItem.item_code === 'PROJECTS' || (newItem.item_name && newItem.item_name.toLowerCase().trim() === 'projects')) {
                newItem.item_name = 'Project Master'; // Rename menu as requested
                // Completely overwrite the children with exactly the 7 requested items
                newItem.children = [
                  { item_code: 'PROJECT_REGISTER', item_name: 'Project Register', route_path: '/projects', icon_key: 'folder-kanban' },
                  { item_code: 'PROJECT_CLIENTS', item_name: 'Project Clients', route_path: '/projects/clients', icon_key: 'users' },
                  { item_code: 'PROJECT_TEAM', item_name: 'Project Team', route_path: '/projects/team', icon_key: 'users-cog' },
                  { item_code: 'PROJECT_OVERVIEW', item_name: 'Project Overview', route_path: '/projects/overview', icon_key: 'layout-dashboard' },
                  { item_code: 'PROJECT_DOCUMENTS', item_name: 'Project Documents', route_path: '/projects/documents', icon_key: 'file-text' },
                  { item_code: 'PROJECT_MILESTONES', item_name: 'Project Milestones', route_path: '/projects/milestones', icon_key: 'flag' },
                  { item_code: 'PROJECT_STATUS_HISTORY', item_name: 'Project Status History', route_path: '/projects/status-history', icon_key: 'history' }
                ];
              }

              // Rework Sites Menu
              if (newItem.item_code === 'SITES_LOCATIONS' || newItem.item_code === 'SITES' || (newItem.item_name && newItem.item_name.toLowerCase().includes('sites'))) {
                // Completely overwrite the children with exactly the 6 requested items
                newItem.children = [
                  { item_code: 'SITE_REGISTER', item_name: 'Site Register', route_path: '/sites', icon_key: 'map-pin' },
                  { item_code: 'LOCATIONS_ZONES', item_name: 'Locations / Zones', route_path: '/sites/zones', icon_key: 'layers' },
                  { item_code: 'WORK_LOCATIONS', item_name: 'Work Locations', route_path: '/sites/work-locations', icon_key: 'building' },
                  { item_code: 'SITE_TEAM', item_name: 'Site Team Assignment', route_path: '/sites/team', icon_key: 'users' },
                  { item_code: 'SITE_INSTRUCTIONS', item_name: 'Site Instructions', route_path: '/sites/instructions', icon_key: 'clipboard-list' },
                  { item_code: 'SITE_DOCUMENTS', item_name: 'Site Documents', route_path: '/sites/documents', icon_key: 'file-text' }
                ];
              }

              return newItem;
            });
          };
          
          const renamedItems = filterNavigation(items);
          setNavigation(filterHidden(renamedItems));
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Navigation could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  const activeGroup = useMemo(() => navigation.find((item) =>
    item.children?.some((child) => location.pathname.startsWith(child.route_path))),
    [location.pathname, navigation]);

  useEffect(() => {
    if (activeGroup) {
      setOpenByDepth((current) => ({ ...current, 0: activeGroup.item_code }));
    }
  }, [activeGroup]);

  return (
    <>
      {isMobileOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} />}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 flex h-full w-[250px] shrink-0 flex-col border-r border-white/10 bg-secondary transition-transform lg:static lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center border-b border-white/10 px-5 text-[18px] font-bold tracking-tight text-white">CIVIL DESK</div>
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3" aria-label="Primary navigation">
          {error && <div className="m-2 rounded-sm bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
          {navigation.map((item) => (
            <NavigationItem
              key={item.item_code}
              item={item}
              openByDepth={openByDepth}
              onToggle={(code, depth) => setOpenByDepth((current) => {
                const next = { ...current };
                const isClosing = next[depth] === code;

                Object.keys(next).forEach((key) => {
                  if (Number(key) >= depth) delete next[key];
                });

                if (!isClosing) next[depth] = code;
                return next;
              })}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 truncate text-xs text-[#C8D1DC]">{user?.first_name} {user?.last_name}</div>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-[#C8D1DC] hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
