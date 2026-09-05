import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  FolderCog,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  HardHat,
} from 'lucide-react';
import { clsx } from 'clsx';
import { navigationApi } from '../../api/apiservice';
import { useAuth } from '../../features/auth/context/AuthContext';

const ICONS = Object.freeze({
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  'folder-cog': FolderCog,
  settings: Settings,
  menu: Menu,
  'hard-hat': HardHat,
});

function NavigationItem({ item, openByDepth, onToggle, onNavigate, depth = 0 }) {
  const Icon = ICONS[item.icon_key] ?? Menu;
  const children = item.children ?? [];
  const expanded = openByDepth[depth] === item.item_code;

  if (item.item_type === 'DIVIDER') return <div className="my-2 h-px bg-white/10" />;
  if (item.item_type === 'SECTION') {
    return <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[#C8D1DC]/50">{item.item_name}</div>;
  }

  if (children.length === 0 && item.route_path) {
    return (
      <NavLink
        to={item.route_path}
        onClick={onNavigate}
        style={{ paddingLeft: `${8 + (depth * 16)}px` }}
        className={({ isActive }) => clsx(
          'flex h-10 items-center gap-3 rounded-sm px-2 text-[13px] font-medium transition-colors',
          isActive ? 'bg-primary text-white' : 'text-[#C8D1DC] hover:bg-white/5 hover:text-white',
        )}
      >
        {depth === 0 ? <Icon className="h-5 w-5 shrink-0" /> : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />}
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
          {depth === 0 ? <Icon className="h-5 w-5 shrink-0" /> : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />}
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
          const processedItems = [...items];
          // Find the "Procurement" section/menu
          const procNode = processedItems.find(i => i.item_name === 'Procurement' || i.item_code === 'PROCUREMENT');
          if (procNode && procNode.children) {
            const hasAppr = procNode.children.some(c => c.route_path === '/procurement/material-request-approval');
            if (!hasAppr) {
              const reqIdx = procNode.children.findIndex(c => c.route_path === '/procurement/requisitions' || c.item_code === 'PURCHASE_REQUISITIONS');
              const newItem = {
                item_code: 'MATERIAL_REQUEST_APPROVAL',
                item_name: 'Material Request Approval',
                route_path: '/procurement/material-request-approval'
              };
              if (reqIdx !== -1) {
                procNode.children.splice(reqIdx + 1, 0, newItem);
              } else {
                procNode.children.unshift(newItem);
              }
            }
          }

          // Find the "Masters" section/menu
          const mastersNode = processedItems.find(i => i.item_name === 'Masters' || i.item_code === 'MASTERS');
          if (mastersNode) {
            mastersNode.children = mastersNode.children || [];
            mastersNode.children.push({
              item_code: 'SUBCONTRACTOR_MASTER',
              item_name: 'Subcontractor Master',
              item_type: null,
              icon_key: 'briefcase',
              children: [
                { item_code: 'SUB_TYPE', item_name: 'Subcontractor Type', route_path: '/masters/subcontractor-types' },
                { item_code: 'SUB_LIST', item_name: 'Subcontractors', route_path: '/masters/subcontractors' }
              ]
            });
          }

          // Find the "Subcontract Management" section/menu
          const subNode = processedItems.find(i =>
            i.item_name === 'Subcontract Management' ||
            i.item_code === 'SUBCONTRACT_MANAGEMENT' ||
            i.item_code === 'SUBCONTRACTS' ||
            i.item_name === 'Subcontracts'
          );

          if (subNode && subNode.children) {
            const hasWeekly = subNode.children.some(c => c.route_path === '/subcontracts/weekly-payments');
            if (!hasWeekly) {
              const payIdx = subNode.children.findIndex(c =>
                c.route_path === '/subcontracts/payments' ||
                c.item_code === 'SUBCONTRACTOR_PAYMENTS'
              );
              const weeklyItem = {
                item_code: 'SUBCONTRACTOR_WEEKLY_PAYMENTS',
                item_name: 'Weekly Payments',
                route_path: '/subcontracts/weekly-payments'
              };
              if (payIdx !== -1) {
                subNode.children.splice(payIdx + 1, 0, weeklyItem);
              } else {
                subNode.children.push(weeklyItem);
              }
            }
          }
          setNavigation(processedItems);
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
        'fixed inset-y-0 left-0 z-50 flex h-full w-[230px] shrink-0 flex-col border-r border-white/10 bg-secondary transition-transform lg:static lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center border-b border-white/10 px-5 text-[18px] font-bold tracking-tight text-white">CIVIL DESK</div>
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-2 py-3" aria-label="Primary navigation">
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
