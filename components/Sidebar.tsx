import React, { useState } from 'react';
import { 
  Layout, 
  GitGraph, 
  Bell, 
  Settings, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  User,
  Layers
} from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onOpenIntegrations: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onOpenIntegrations }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: Page.LINEAGE, label: 'Lineage Graph', icon: <GitGraph size={20} /> },
    { id: Page.ALERTS, label: 'Alerts & Incidents', icon: <Bell size={20} /> },
    { id: Page.CATALOG, label: 'Data Catalog', icon: <Layers size={20} /> },
  ];

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 relative z-20 shadow-xl`}
    >
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-slate-800 border border-slate-700 text-slate-400 p-1 rounded-full hover:text-white hover:bg-slate-700 transition-colors z-30"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'px-6 gap-3'} border-b border-slate-800`}>
        <div className="w-8 h-8 min-w-[32px] bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Layout className="text-white" size={18} />
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="text-white font-bold tracking-tight text-lg">Lumina</h1>
            <span className="text-[10px] text-slate-400 font-medium block -mt-1 uppercase tracking-wider">Observability</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative
              ${activePage === item.id 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <span className={activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}>
              {item.icon}
            </span>
            {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </div>
            )}
          </button>
        ))}

        <div className="my-4 border-t border-slate-800 mx-2"></div>

        {/* Integration Button */}
        <button
          onClick={onOpenIntegrations}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative text-slate-400 hover:bg-slate-800 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Database size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Integrations</span>}
          {isCollapsed && (
              <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Integrations
              </div>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => onNavigate(Page.SETTINGS)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative
            ${activePage === Page.SETTINGS 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
          {isCollapsed && (
              <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Settings
              </div>
          )}
        </button>
      </nav>

      {/* Account / Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 overflow-hidden">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">Admin User</div>
              <div className="text-xs text-slate-500 truncate">admin@lumina.data</div>
            </div>
          )}
          {!isCollapsed && (
            <button className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
