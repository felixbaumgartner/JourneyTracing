import { NavLink } from 'react-router-dom';
import {
  SearchIcon,
  CompassIcon,
} from 'lucide-react';

const navItems = [
  { to: '/explore', icon: CompassIcon, label: 'Explore' },
];

export function Sidebar() {
  return (
    <nav className="w-56 bg-[#1e1e2e] text-slate-300 flex flex-col shrink-0" aria-label="Main navigation">
      {/* Logo / Brand */}
      <div className="px-4 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white text-sm tracking-wide">
            Journey Tracing
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Messaging Platform</p>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-600">
          v1.0 &middot; WCAG 2.2 AA
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Ctrl+K &middot; Command Palette
        </p>
      </div>
    </nav>
  );
}
