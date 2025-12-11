import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Database, FileText, BarChart2, Layers, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { AssetType, HealthStatus } from '../types';

// Memoize to prevent unnecessary re-renders
const CustomNode = memo(({ data, selected }: NodeProps) => {
  const { label, type, status } = data;

  const getIcon = () => {
    switch (type) {
      case AssetType.SOURCE: return <Database size={16} />;
      case AssetType.TRANSFORM: return <Layers size={16} />;
      case AssetType.MODEL: return <FileText size={16} />;
      case AssetType.DASHBOARD: return <BarChart2 size={16} />;
      default: return <Database size={16} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case HealthStatus.HEALTHY: return 'text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      case HealthStatus.WARNING: return 'text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case HealthStatus.ERROR: return 'text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      default: return 'text-slate-400 border-slate-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case HealthStatus.HEALTHY: return <CheckCircle size={14} className="text-emerald-400" />;
      case HealthStatus.WARNING: return <AlertTriangle size={14} className="text-amber-400" />;
      case HealthStatus.ERROR: return <AlertCircle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const nodeBaseStyle = `
    relative min-w-[180px] bg-slate-900/90 backdrop-blur-sm 
    border-2 rounded-lg p-3 transition-all duration-300
    ${getStatusColor()}
    ${selected ? 'ring-2 ring-blue-500 scale-105 z-10' : 'hover:border-opacity-100'}
  `;

  return (
    <div className={nodeBaseStyle}>
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-2" />
      
      <div className="flex items-center gap-2 mb-2">
        <span className="opacity-80">{getIcon()}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{type}</span>
        <div className="ml-auto">
          {getStatusIcon()}
        </div>
      </div>
      
      <div className="font-semibold text-slate-100 text-sm truncate" title={label}>
        {label}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  );
});

export default CustomNode;