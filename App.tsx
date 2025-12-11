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
import 'reactflow/dist/style.css';
import { INITIAL_NODES, INITIAL_EDGES } from './constants';
import CustomNode from './components/CustomNode';
import DetailsPanel from './components/DetailsPanel';
import AssistantPanel from './components/AssistantPanel';
import { DataAsset, HealthStatus, ViewMode } from './types';
import { Search, GitBranch, AlertOctagon, History, Layout } from 'lucide-react';

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
  const [timeTravelDays, setTimeTravelDays] = useState<number>(0);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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

  // --- Mode Switching Effect ---
  useEffect(() => {
    resetView();
  }, [viewMode, resetView]);

  // --- Time Travel Simulation ---
  // Simple simulation: hides nodes that were "created" recently or changes status
  useEffect(() => {
    // In a real app, this would query the backend for the graph state at T-x
    // Here we just simulate filtering for demo purposes
    if (timeTravelDays > 0) {
      // Example: Hide the broken dashboard if we go back 4 days
      setNodes(nds => nds.map(n => {
         if (n.id === 'fct_attribution' && timeTravelDays > 1) {
            // Simulate that before 2 days ago, this was Healthy
            return { ...n, data: { ...n.data, status: HealthStatus.HEALTHY }};
         }
         if (n.id === 'dash_mkt' && timeTravelDays > 2) {
             return { ...n, data: { ...n.data, status: HealthStatus.HEALTHY }};
         }
         return n;
      }));
    } else {
      // Reset to initial state (the constants)
      setNodes(initialFlowNodes);
    }
  }, [timeTravelDays, setNodes]);


  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950">
      
      {/* Top Navigation Bar */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-6 justify-between z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layout className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight">Lumina</h1>
            <span className="text-xs text-slate-400 font-medium">Data Observability</span>
          </div>
        </div>

        {/* Central Controls */}
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

        {/* Right Controls */}
        <div className="flex items-center gap-4">
           {/* Time Travel Slider */}
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
           
           <div className="h-8 w-px bg-slate-700 mx-2"></div>
           
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300 text-xs font-bold">
               JS
             </div>
           </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
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

        {/* Floating Legend / Info */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur p-4 rounded-lg border border-slate-700 shadow-xl pointer-events-none">
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
        
        {/* Helper text for modes */}
        {viewMode !== ViewMode.STANDARD && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-blue-500/50 px-4 py-2 rounded-full shadow-lg text-sm text-blue-200 animate-in fade-in slide-in-from-top-4">
              {viewMode === ViewMode.IMPACT_ANALYSIS ? 'Select a node to see downstream impact' : 'Select a broken node to trace root cause'}
           </div>
        )}

      </div>

      <DetailsPanel 
        node={selectedNode} 
        onClose={() => resetView()} 
      />

      <AssistantPanel 
        nodes={INITIAL_NODES} 
        edges={INITIAL_EDGES} 
        selectedNodeId={selectedNode?.id}
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
      />
    </div>
  );
};

export default App;