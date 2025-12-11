import React from 'react';
import { Shield, Key, Bell, Palette, Globe } from 'lucide-react';

const SettingsView: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>
        
        <div className="space-y-6">
          {/* Section: General */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Palette size={18} className="text-blue-400" /> Appearance
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 text-sm font-medium">Theme</div>
                  <div className="text-slate-500 text-xs">Select your interface theme preference</div>
                </div>
                <select className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Dark (Default)</option>
                  <option>Light</option>
                  <option>System</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Notifications */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Bell size={18} className="text-amber-400" /> Notifications
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 text-sm font-medium">Schema Drift Alerts</div>
                  <div className="text-slate-500 text-xs">Notify when upstream schema changes</div>
                </div>
                <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                   <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 text-sm font-medium">Freshness SLAs</div>
                  <div className="text-slate-500 text-xs">Notify when data is late</div>
                </div>
                <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                   <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
            </div>
          </section>

           {/* Section: API */}
           <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50">
              <h3 className="font-medium text-white flex items-center gap-2">
                <Key size={18} className="text-emerald-400" /> API Access
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                  <div className="text-slate-200 text-sm font-medium mb-2">Gemini API Key</div>
                  <div className="flex gap-2">
                    <input type="password" value="sk-xxxxxxxxxxxxxxxxxxxxxxxx" disabled className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-sm" />
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700">Rotate</button>
                  </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;