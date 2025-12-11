import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection,
  MarkerType,
  NodeTypes
} from 'reactflow';
import { INITIAL_NODES, INITIAL_EDGES } from './constants';
import CustomNode from './components/CustomNode';
import DetailsPanel from './components/DetailsPanel';
import AssistantPanel from './components/AssistantPanel';
import IngestionModal from './components/IngestionModal';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import AlertsView from './components/AlertsView';
import { DataAsset, HealthStatus, ViewMode, DataSource, Page, IntegrationType } from './types';
import { Search, GitBranch, AlertOctagon, History, Layout, Database } from 'lucide-react';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Initial data conversion for React Flow
const initialFlowNodes: Node[] = INITIAL_NODES.map(node => ({
  id: node.id,
  type: 'custom',
  position: node.position,
  data: node,
}));

const initialFlowEdges: Edge[] = INITIAL_EDGES.map(edge => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  animated: true,
  style: { stroke: '#64748b' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
}));

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);
  const [selectedNode, setSelectedNode] = useState<DataAsset | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.STANDARD);
  const [activePage, setActivePage] = useState<Page>(Page.LINEAGE);
  const [timeTravelDays, setTimeTravelDays] = useState<number>(0);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  // Ingestion State
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: 'src_sf_prod',
      name: 'Snowflake Production',
      type: IntegrationType.SNOWFLAKE,
      status: 'CONNECTED',
      lastSync: '2 hours ago'
    }
  ]);

  // --- Graph Traversal Logic ---

  const findDownstream = useCallback((nodeId: string, currentEdges: Edge[]): Set<string> => {
    const downstream = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (downstream.has(current)) continue;
      downstream.add(current);
      
      const targets = currentEdges
        .filter(e => e.source === current)
        .map(e => e.target);
      queue.push(...targets);
    }
    return downstream;
  }, []);

  const findUpstreamErrorPath = useCallback((nodeId: string, currentNodes: Node[], currentEdges: Edge[]): Set<string> => {
    const errorPath = new Set<string>();
    const queue = [nodeId];
    
    // Quick map for status lookup
    const statusMap = new Map(currentNodes.map(n => [n.id, n.data.status]));

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (errorPath.has(current)) continue;
      
      // Only trace back if current node is not Healthy
      if (statusMap.get(current) !== HealthStatus.HEALTHY) {
         errorPath.add(current);
         const sources = currentEdges
          .filter(e => e.target === current)
          .map(e => e.source);
         queue.push(...sources);
      }
    }
    return errorPath;
  }, []);


  // --- Selection Handler ---
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
    
    // Interactive Visual Logic based on View Mode
    setNodes(nds => nds.map(n => {
       let isDimmed = false;
       
       if (viewMode === ViewMode.IMPACT_ANALYSIS) {
         const downstream = findDownstream(node.id, edges);
         isDimmed = !downstream.has(n.id);
       } else if (viewMode === ViewMode.ROOT_CAUSE) {
         const upstreamErrors = findUpstreamErrorPath(node.id, nodes, edges);
         isDimmed = !upstreamErrors.has(n.id);
       } else {
         // Standard mode: no dimming on click, just select
         isDimmed = false;
       }

       return {
         ...n,
         selected: n.id === node.id,
         style: { opacity: isDimmed ? 0.2 : 1 }
       };
    }));
    
    // Highlight Edges
    setEdges(eds => eds.map(e => {
      let stroke = '#64748b'; // Default slate
      let width = 1;
      let opacity = 1;

      if (viewMode === ViewMode.IMPACT_ANALYSIS) {
         const downstream = findDownstream(node.id, edges);
         const isPath = downstream.has(e.source) && downstream.has(e.target);
         if (isPath) { stroke = '#3b82f6'; width = 2; } // Blue
         else { opacity = 0.1; }
      } else if (viewMode === ViewMode.ROOT_CAUSE) {
         const upstream = findUpstreamErrorPath(node.id, nodes, edges);
         const isPath = upstream.has(e.source) && upstream.has(e.target);
         if (isPath) { stroke = '#ef4444'; width = 2; } // Red
         else { opacity = 0.1; }
      }

      return {
        ...e,
        style: { stroke, strokeWidth: width, opacity },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke }
      };
    }));

  }, [viewMode, edges, nodes, findDownstream, findUpstreamErrorPath, setNodes, setEdges]);

  // --- Reset View Helper ---
  const resetView = useCallback(() => {
    setNodes(nds => nds.map(n => ({...n, selected: false, style: { opacity: 1 }})));
    setEdges(eds => eds.map(e => ({
      ...e, 
      style: { stroke: '#64748b', strokeWidth: 1, opacity: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
    })));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // --- Deletion Handler ---
  const onDeleteNode = useCallback((nodeId: string) => {
    setSelectedNode(null); // Clear selection immediately
    setViewMode(ViewMode.STANDARD); // Reset view mode

    // Update nodes: Remove target and reset styles for others
    setNodes((currentNodes) => {
      return currentNodes
        .filter((n) => n.id !== nodeId)
        .map((n) => ({
          ...n,
          selected: false,
          style: { ...n.style, opacity: 1 }
        }));
    });

    // Update edges: Remove connected edges and reset styles
    setEdges((currentEdges) => {
      return currentEdges
        .filter((e) => e.source !== nodeId && e.target !== nodeId)
        .map((e) => ({
          ...e,
          style: { stroke: '#64748b', strokeWidth: 1, opacity: 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
        }));
    });
  }, [setNodes, setEdges]);

  // --- Ingestion Handlers ---
  const handleIngestionComplete = (newAssets: DataAsset[], newRelationships: any[]) => {
    // Merge new nodes
    setNodes((currentNodes) => {
       const existingIds = new Set(currentNodes.map(n => n.id));
       const nodesToAdd = newAssets
         .filter(asset => !existingIds.has(asset.id))
         .map(asset => ({
            id: asset.id,
            type: 'custom',
            position: asset.position,
            data: asset
         }));
       return [...currentNodes, ...nodesToAdd];
    });

    // Merge new edges
    setEdges((currentEdges) => {
       const existingIds = new Set(currentEdges.map(e => e.id));
       const edgesToAdd = newRelationships
         .filter(rel => !existingIds.has(rel.id))
         .map(rel => ({
            id: rel.id,
            source: rel.source,
            target: rel.target,
            animated: true,
            style: { stroke: '#64748b' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
         }));
       return [...currentEdges, ...edgesToAdd];
    });
  };

  const handleAddSource = (source: DataSource) => {
    setSources(prev => [...prev, source]);
  };

  const handleUpdateSource = (id: string, updates: Partial<DataSource>) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // --- Mode Switching Effect ---
  useEffect(() => {
    resetView();
  }, [viewMode, resetView]);

  // --- Time Travel Simulation ---
  useEffect(() => {
    if (timeTravelDays > 0) {
      setNodes(nds => nds.map(n => {
         if (n.id === 'fct_attribution' && timeTravelDays > 1) {
            return { ...n, data: { ...n.data, status: HealthStatus.HEALTHY }};
         }
         if (n.id === 'dash_mkt' && timeTravelDays > 2) {
             return { ...n, data: { ...n.data, status: HealthStatus.HEALTHY }};
         }
         return n;
      }));
    } else {
       // Reset logic here if needed
    }
  }, [timeTravelDays, setNodes]);


  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        onOpenIntegrations={() => setIsIngestionOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Bar - Only visible on Lineage Page for specific controls */}
        {activePage === Page.LINEAGE && (
          <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between z-10">
            {/* View Modes */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setViewMode(ViewMode.STANDARD)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.STANDARD ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Live View
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.IMPACT_ANALYSIS)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.IMPACT_ANALYSIS ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <GitBranch size={14} /> Impact Analysis
              </button>
              <button 
                onClick={() => setViewMode(ViewMode.ROOT_CAUSE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.ROOT_CAUSE ? 'bg-red-600/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <AlertOctagon size={14} /> Root Cause
              </button>
            </div>

            {/* Time Travel */}
            <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
                <History size={14} className="text-slate-400" />
                <input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="1"
                  value={timeTravelDays}
                  onChange={(e) => setTimeTravelDays(parseInt(e.target.value))}
                  className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-slate-300 w-16 text-right">
                  {timeTravelDays === 0 ? 'Now' : `${timeTravelDays}d ago`}
                </span>
            </div>
          </div>
        )}

        {/* Content Views */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* LINEAGE VIEW (React Flow) */}
          <div className={`w-full h-full ${activePage === Page.LINEAGE ? 'block' : 'hidden'}`}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={resetView}
              nodeTypes={nodeTypes}
              fitView
              className="bg-slate-950"
              minZoom={0.2}
              maxZoom={2}
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls className="!bg-slate-800 !border-slate-700 !shadow-xl [&>button]:!fill-slate-400 [&>button:hover]:!bg-slate-700" />
            </ReactFlow>

            {/* Helper text for modes */}
            {viewMode !== ViewMode.STANDARD && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-blue-500/50 px-4 py-2 rounded-full shadow-lg text-sm text-blue-200 animate-in fade-in slide-in-from-top-4 z-20">
                  {viewMode === ViewMode.IMPACT_ANALYSIS ? 'Select a node to see downstream impact' : 'Select a broken node to trace root cause'}
              </div>
            )}
             {/* Floating Legend / Info */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-700 shadow-xl pointer-events-none z-10">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-xs text-slate-300">Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                  <span className="text-xs text-slate-300">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-xs text-slate-300">Error</span>
                </div>
              </div>
            </div>
          </div>

          {/* SETTINGS VIEW */}
          {activePage === Page.SETTINGS && <SettingsView />}

          {/* ALERTS VIEW */}
          {activePage === Page.ALERTS && <AlertsView />}
          
          {/* CATALOG VIEW (Placeholder) */}
          {activePage === Page.CATALOG && (
             <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <Database size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-slate-300">Data Catalog</h3>
                  <p className="text-sm">Searchable inventory of {nodes.length} assets coming soon.</p>
                </div>
             </div>
          )}

        </div>

        {/* Global Overlays */}
        <DetailsPanel 
          node={selectedNode} 
          onClose={() => resetView()} 
          onDelete={onDeleteNode}
        />

        <AssistantPanel 
          nodes={nodes.map(n => n.data as DataAsset)} 
          edges={edges.map(e => ({ id: e.id, source: e.source, target: e.target }))} 
          selectedNodeId={selectedNode?.id}
          isOpen={isAssistantOpen}
          onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        />

        <IngestionModal 
          isOpen={isIngestionOpen}
          onClose={() => setIsIngestionOpen(false)}
          onIngestionComplete={handleIngestionComplete}
          existingSources={sources}
          onAddSource={handleAddSource}
          onUpdateSource={handleUpdateSource}
        />
      </main>
    </div>
  );
};

export default App;