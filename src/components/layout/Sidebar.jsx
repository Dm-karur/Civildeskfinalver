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
                const desiredMenu = [
                  { original: 'Labour Register', newName: 'Labour master' },
                  { original: 'Labour Deployment', newName: 'Labour allocation' },
                  { original: 'Daily Attendance', newName: 'Daily attendance' },
                  { original: 'Manpower Cost', newName: 'Labour cost' }
                ];
                
                const filteredChildren = [];
                
                // Map the existing backend items to the new names
                desiredMenu.forEach(mapping => {
                  const found = (newItem.children || []).find(c => c.item_name && c.item_name.trim().toLowerCase() === mapping.original.toLowerCase());
                  if (found) {
                    filteredChildren.push({ ...found, item_name: mapping.newName, children: [] });
                  } else {
                    // Fallback in case backend already renamed them
                    const alreadyRenamed = (newItem.children || []).find(c => c.item_name && c.item_name.trim().toLowerCase() === mapping.newName.toLowerCase());
                    if (alreadyRenamed) filteredChildren.push({ ...alreadyRenamed, children: [] });
                  }
                });
                
                newItem.children = filteredChildren;
              }
              return newItem;
            });
          };
          setNavigation(filterNavigation(items));
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
