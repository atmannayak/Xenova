import React from 'react';

import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  Wallet,
  Timer,
  Trophy,
  Medal,
  Settings,
  LogOut,
  Sparkles,
  ListChecks,
  Target,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/finance',
    label: 'Finance & Budget',
    icon: Wallet,
  },
  {
    to: '/focus',
    label: 'Focus & Study',
    icon: Timer,
  },
  {
    to: '/todays-plan',
    label: "Today's Plan",
    icon: ListChecks,
  },
  {
    to: '/daily-goals',
    label: 'Daily Goals',
    icon: Target,
  },
  {
    to: '/activities',
    label: 'Activities & Streaks',
    icon: Trophy,
  },
  {
    to: '/achievements',
    label: 'Achievements',
    icon: Medal,
  },
];

const NavItem = ({
  to,
  label,
  icon: Icon,
  onClick,
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-sage-600/10 text-sage-700 dark:text-sage-400'
          : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100'
      }`
    }
  >
    <Icon
      size={18}
      strokeWidth={2}
    />

    {label}
  </NavLink>
);

const SidebarContent = ({
  onNavigate,
}) => {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <div className="flex h-full flex-col">

      {/* LOGO */}

      <div className="flex items-center gap-2 px-4 py-5">

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-600 text-white">

          <Sparkles size={16} />

        </div>

        <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Xenova
        </span>

      </div>

      {/* NAVIGATION */}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">

        {NAV_ITEMS.map(
          (item) => (
            <NavItem
              key={item.to}
              {...item}
              onClick={onNavigate}
            />
          )
        )}

      </nav>

      {/* USER SECTION */}

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">

        <div className="flex items-center gap-3 rounded-lg px-2 py-2">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold text-amber-600 dark:text-amber-400">
            {user?.initials || '--'}
          </div>

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {user?.name}
            </p>

            <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
              {user?.email}
            </p>

          </div>

        </div>

        <div className="mt-1 space-y-0.5">

          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={({ isActive }) =>
              `btn-ghost w-full justify-start px-2 py-1.5 ${
                isActive
                  ? 'bg-sage-600/10 text-sage-700 dark:text-sage-400'
                  : ''
              }`
            }
          >
            <Settings size={16} />
            Settings
          </NavLink>

          <button
            onClick={logout}
            className="btn-ghost w-full justify-start px-2 py-1.5 hover:text-red-500"
          >
            <LogOut size={16} />
            Log out
          </button>

        </div>

      </div>

    </div>
  );
};

const Sidebar = () => {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:block">

      <div className="sticky top-0 h-screen">

        <SidebarContent />

      </div>

    </aside>
  );
};

export default Sidebar;

export {
  SidebarContent,
  NAV_ITEMS,
};


