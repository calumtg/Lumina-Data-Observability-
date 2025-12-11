import React, { useState, useEffect } from 'react';
import { DataSource, IntegrationType } from '../types';
import { connectSource, triggerIngestion } from '../services/mockIngestionService';
import { X, Plus, Database, Server, Layers, BarChart, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestionComplete: (nodes: any[], edges: any[]) => void;
  existingSources: DataSource[];
  onAddSource: (source: DataSource) => void;
  onUpdateSource: (id: string, updates: Partial<DataSource>) => void;
}

const IngestionModal: React.FC<IngestionModalProps> = ({ 
  isOpen, onClose, onIngestionComplete, existingSources, onAddSource, onUpdateSource 
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'NEW'>('LIST');
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('LIST');
      setSelectedType(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    setIsConnecting(true);
    const success = await connectSource(selectedType, {}); // Mock credentials
    setIsConnecting(false);

    if (success) {
      const newSource: DataSource = {
        id: Math.random().toString(36).substr(2, 9),
        name: `${selectedType} Production`,
        type: selectedType,
        status: 'CONNECTED',
      };
      onAddSource(newSource);
      setActiveTab('LIST');
      setSelectedType(null);
    }
  };

  const handleSync = async (source: DataSource) => {
    setSyncingId(source.id);
    onUpdateSource(source.id, { status: 'SYNCING' });
    
    try {
      const result = await triggerIngestion(source.type);
      onIngestionComplete(result.nodes, result.edges);
      onUpdateSource(source.id, { 
        status: 'CONNECTED', 
        lastSync: new Date().toLocaleTimeString() 
      });
    } catch (err) {
      onUpdateSource(source.id, { status: 'ERROR' });
    } finally {
      setSyncingId(null);
    }
  };

  const getTypeIcon = (type: IntegrationType) => {
    switch (type) {
      case IntegrationType.SNOWFLAKE: 
      case IntegrationType.POSTGRES:
      case IntegrationType.BIGQUERY: return <Database size={20} className="text-blue-400" />;
      case IntegrationType.DBT: return <Layers size={20} className="text-orange-400" />;
      case IntegrationType.TABLEAU: return <BarChart size={20} className="text-purple-400" />;
      default: return <Server size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white">Metadata Ingestion Hub</h2>
            <p className="text-slate-400 text-sm mt-1">Manage connections to your data stack</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'LIST' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Active Integrations</h3>
                <button 
                  onClick={() => setActiveTab('NEW')}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} /> Add Source
                </button>
              </div>

              {existingSources.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                   <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                     <Database className="text-slate-500" />
                   </div>
                   <h4 className="text-slate-300 font-medium">No sources connected</h4>
                   <p className="text-slate-500 text-sm mt-1">Connect a database or tool to start mapping lineage.</p>
                   <button 
                      onClick={() => setActiveTab('NEW')}
                      className="mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium"
                   >
                      Connect your first source →
                   </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingSources.map(source => (
                    <div key={source.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between group hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {getTypeIcon(source.type)}
                        </div>
                        <div>
                          <div className="font-medium text-white">{source.name}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                             <span className={`w-2 h-2 rounded-full ${source.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                             {source.status}
                             {source.lastSync && <span>• Last synced {source.lastSync}</span>}
                          </div>
                        </div>
                      </div>
                      <button 
                         onClick={() => handleSync(source)}
                         disabled={syncingId === source.id}
                         className={`p-2 rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-all ${syncingId === source.id ? 'bg-slate-700 text-blue-400' : 'text-slate-400'}`}
                         title="Sync Metadata"
                      >
                        {syncingId === source.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'NEW' && (
            <div className="animate-in slide-in-from-right duration-200">
               <button onClick={() => setActiveTab('LIST')} className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1">
                 ← Back to list
               </button>
               
               <h3 className="text-lg font-medium text-white mb-4">Select Provider</h3>
               <div className="grid grid-cols-2 gap-3 mb-6">
                 {Object.values(IntegrationType).map(type => (
                   <button
                     key={type}
                     onClick={() => setSelectedType(type)}
                     className={`p-4 rounded-xl border text-left transition-all ${
                       selectedType === type 
                         ? 'bg-primary-600/10 border-primary-500 ring-1 ring-primary-500' 
                         : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                     }`}
                   >
                     <div className="flex items-center gap-2 mb-2">
                       {getTypeIcon(type)}
                       <span className="font-medium text-slate-200">{type}</span>
                     </div>
                     <p className="text-xs text-slate-500">Auto-extract metadata, schemas, and usage logs.</p>
                   </button>
                 ))}
               </div>

               {selectedType && (
                 <form onSubmit={handleConnect} className="space-y-4 border-t border-slate-700 pt-6">
                    <h3 className="font-medium text-white">Configure {selectedType}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Host / Account URL</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500" placeholder="e.g. https://account.snowflakecomputing.com" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Service Account Token</label>
                        <input type="password" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500" placeholder="••••••••••••••••" required />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        disabled={isConnecting}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        {isConnecting && <Loader2 size={16} className="animate-spin" />}
                        {isConnecting ? 'Verifying...' : 'Connect Source'}
                      </button>
                    </div>
                 </form>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default IngestionModal;