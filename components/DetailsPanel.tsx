import React from 'react';
import { DataAsset, HealthStatus } from '../types';
import { X, Clock, User, Shield, Activity, List } from 'lucide-react';

interface DetailsPanelProps {
  node: DataAsset | null;
  onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ node, onClose }) => {
  if (!node) return null;

  const statusColor = 
    node.status === HealthStatus.HEALTHY ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
    node.status === HealthStatus.WARNING ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
    'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <div className="absolute right-4 top-20 bottom-8 w-96 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl flex flex-col z-20 overflow-hidden transition-all animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex justify-between items-start">
        <div>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mb-3 ${statusColor}`}>
            {node.status}
          </div>
          <h2 className="text-xl font-bold text-white break-words">{node.label}</h2>
          <p className="text-slate-400 text-sm mt-1">{node.type}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Description */}
        <div className="text-slate-300 text-sm leading-relaxed">
          {node.description}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Clock size={12} /> Freshness
            </div>
            <div className="text-white font-mono font-medium">{node.freshness}</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Activity size={12} /> Quality Score
            </div>
            <div className={`font-mono font-medium ${node.qualityScore < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {node.qualityScore}%
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Metadata</h3>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="flex items-center gap-2 text-slate-400 text-sm"><User size={14}/> Owner</span>
            <span className="text-slate-200 text-sm">{node.owner}</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-slate-800">
            <span className="flex items-center gap-2 text-slate-400 text-sm"><List size={14}/> Rows</span>
            <span className="text-slate-200 text-sm font-mono">{node.rowCount?.toLocaleString()}</span>
          </div>

          <div className="py-2">
             <span className="flex items-center gap-2 text-slate-400 text-sm mb-2"><Shield size={14}/> Tags</span>
             <div className="flex flex-wrap gap-2">
               {node.tags.map(tag => (
                 <span key={tag} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">
                   {tag}
                 </span>
               ))}
             </div>
          </div>
        </div>

        {/* Schema */}
        {node.schema && node.schema.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Schema</h3>
             <div className="bg-slate-800/30 rounded-lg overflow-hidden border border-slate-700/50">
               {node.schema.map((col, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-800/50">
                   <div>
                     <div className="text-slate-200 text-sm font-medium">{col.name}</div>
                     <div className="text-slate-500 text-xs">{col.description}</div>
                   </div>
                   <div className="flex items-center gap-2">
                      {col.isPii && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">PII</span>}
                      <span className="text-xs font-mono text-slate-400">{col.type}</span>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DetailsPanel;