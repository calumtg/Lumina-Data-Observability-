import React from 'react';
import { AlertTriangle, Clock, Activity, CheckCircle, ArrowRight } from 'lucide-react';

const AlertsView: React.FC = () => {
  const alerts = [
    {
       id: 1,
       severity: 'CRITICAL',
       title: 'Schema Mismatch in STG_USER_SESSIONS',
       description: 'Column "user_agent" was dropped from upstream source but is required by downstream model.',
       time: '2 hours ago',
       source: 'stg_events'
    },
    {
       id: 2,
       severity: 'WARNING',
       title: 'Freshness SLA Breached',
       description: 'FCT_MKT_ATTRIBUTION is 48 hours old (Threshold: 24h).',
       time: '5 hours ago',
       source: 'fct_attribution'
    },
    {
       id: 3,
       severity: 'RESOLVED',
       title: 'Volume Spike Detected',
       description: 'WEB_CLICKS_STREAM row count increased by 400% in 10 minutes.',
       time: '1 day ago',
       source: 'clickstream'
    }
  ];

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Active Incidents</h2>
            <div className="flex gap-2">
                <button className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800">History</button>
                <button className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700">Config</button>
            </div>
        </div>

        <div className="space-y-4">
           {alerts.map(alert => (
             <div key={alert.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group">
               <div className="flex items-start gap-4">
                 <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center border ${
                   alert.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                   alert.severity === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                   'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                 }`}>
                   {alert.severity === 'RESOLVED' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                             <h3 className="text-white font-semibold text-lg">{alert.title}</h3>
                             <p className="text-slate-400 text-sm mt-1">{alert.description}</p>
                        </div>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                            <Clock size={12} /> {alert.time}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            alert.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}>
                            {alert.severity}
                        </span>
                        <span className="text-xs text-slate-500 border border-slate-800 px-2 py-0.5 rounded">
                            Source: <span className="text-slate-300 font-mono">{alert.source}</span>
                        </span>
                        
                        <button className="ml-auto text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Investigate <ArrowRight size={14} />
                        </button>
                    </div>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsView;