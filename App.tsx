import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Settings2, 
  Zap, 
  Search, 
  TableProperties, 
  MapPin,
  PauseOctagon,
  RefreshCw,
  Plus,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import PipelineNode from './components/PipelineNode';
import ResultsTable from './components/ResultsTable';
import { BusinessLead, NodeStatus, WorkflowNode } from './types';
import { searchBusinesses } from './services/geminiService';

const INITIAL_NODES: WorkflowNode[] = [
  {
    id: '1',
    type: 'trigger',
    label: 'Manual Trigger',
    status: NodeStatus.IDLE,
    icon: '⚡',
    description: 'Workflow starts on click'
  },
  {
    id: '2',
    type: 'search',
    label: 'Google Maps Search',
    status: NodeStatus.IDLE,
    icon: '🔍',
    description: 'Finds businesses via Maps'
  },
  {
    id: '3',
    type: 'parser',
    label: 'Data Extractor',
    status: NodeStatus.IDLE,
    icon: '⚙️',
    description: 'Enrich: Email, Insta, Quality'
  },
  {
    id: '4',
    type: 'sheet',
    label: 'Spreadsheet',
    status: NodeStatus.IDLE,
    icon: '📊',
    description: 'Appends data to table'
  }
];

export default function App() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [searchQuery, setSearchQuery] = useState('Coffee shops');
  const [searchLocation, setSearchLocation] = useState('New York');
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [userCoords, setUserCoords] = useState<{latitude: number, longitude: number} | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastAddedCount, setLastAddedCount] = useState<number>(0);

  // Initialize Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation denied or failed', error)
      );
    }
  }, []);

  const updateNodeStatus = (id: string, status: NodeStatus) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const runWorkflow = async (isAppend: boolean = false) => {
    if (isRunning) return;
    setIsRunning(true);
    setLastAddedCount(0);
    
    if (!isAppend) {
      setLeads([]); // Clear previous results only if not appending
    }
    setErrorMsg(null);

    // Reset nodes visual state
    setNodes(INITIAL_NODES.map(n => ({...n, status: NodeStatus.IDLE})));

    try {
      // Step 1: Trigger
      updateNodeStatus('1', NodeStatus.RUNNING);
      await new Promise(r => setTimeout(r, 400)); 
      updateNodeStatus('1', NodeStatus.COMPLETED);

      // Step 2: Search (The real work)
      updateNodeStatus('2', NodeStatus.RUNNING);
      
      const combinedQuery = `${searchQuery} in ${searchLocation}`;
      // Collect names to exclude if appending
      const excludeNames = isAppend ? leads.map(l => l.name) : [];
      
      const results = await searchBusinesses(combinedQuery, userCoords, excludeNames);
      
      updateNodeStatus('2', NodeStatus.COMPLETED);

      if (results.length === 0 && isAppend) {
          setErrorMsg("No new leads found. Try a different query.");
      } else if (results.length === 0 && !isAppend) {
          setErrorMsg("No leads found. Please try a different query.");
          updateNodeStatus('2', NodeStatus.ERROR);
          throw new Error("No results");
      }

      // Step 3: Parser (Simulated processing of results)
      updateNodeStatus('3', NodeStatus.RUNNING);
      // Simulate "Enrichment" processing delay
      await new Promise(r => setTimeout(r, 500)); 
      
      if (results.length > 0) {
        setLeads(prev => {
            // Filter duplicates just in case
            const existingIds = new Set(prev.map(l => l.name));
            const uniqueNew = results.filter(r => !existingIds.has(r.name));
            return [...prev, ...uniqueNew];
        });
        setLastAddedCount(results.length);
      }
      
      updateNodeStatus('3', NodeStatus.COMPLETED);

      // Step 4: Sheet (Simulated save)
      updateNodeStatus('4', NodeStatus.RUNNING);
      await new Promise(r => setTimeout(r, 300)); 
      updateNodeStatus('4', NodeStatus.COMPLETED);

    } catch (error: any) {
      if (error.message !== "No results") {
          console.error(error);
          setErrorMsg(error.message || "An unknown error occurred");
          setNodes(prev => {
            const runningNode = prev.find(n => n.status === NodeStatus.RUNNING);
            if (runningNode) {
              return prev.map(n => n.id === runningNode.id ? { ...n, status: NodeStatus.ERROR } : n);
            }
            return prev;
          });
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen font-sans flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-700 bg-n8n-panel flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-n8n-primary to-n8n-secondary rounded flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-n8n-primary/20">
            LF
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">LeadFlow AI</h1>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">Automation</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 hidden sm:block">
             API Status: <span className="text-emerald-400">● Connected</span>
          </div>
          <button className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content - Grid Layout */}
      <main className="flex-grow p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full">
        
        {/* Left Column: Workflow Config & Visualizer */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Config Card */}
          <div className="bg-n8n-panel rounded-xl border border-slate-700 p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-n8n-primary" /> Configuration
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Target Business</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    list="business-suggestions"
                    className="w-full bg-n8n-dark border border-slate-600 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-n8n-primary transition-colors"
                    placeholder="e.g. Plumbers, Marketing Agencies"
                    disabled={isRunning}
                  />
                  <datalist id="business-suggestions">
                    <option value="Real Estate Agents" />
                    <option value="Dentists" />
                    <option value="Marketing Agencies" />
                    <option value="Plumbers" />
                    <option value="Coffee Shops" />
                    <option value="Gyms & Fitness" />
                    <option value="Law Firms" />
                    <option value="Interior Designers" />
                    <option value="Tech Startups" />
                    <option value="Restaurants" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    list="location-suggestions"
                    className="w-full bg-n8n-dark border border-slate-600 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-n8n-primary transition-colors"
                    placeholder="e.g. San Francisco, CA"
                    disabled={isRunning}
                  />
                  <datalist id="location-suggestions">
                    <option value="New York, NY" />
                    <option value="Los Angeles, CA" />
                    <option value="London, UK" />
                    <option value="Toronto, Canada" />
                    <option value="Sydney, Australia" />
                    <option value="Dubai, UAE" />
                    <option value="San Francisco, CA" />
                    <option value="Miami, FL" />
                    <option value="Chicago, IL" />
                  </datalist>
                </div>
              </div>
              
              <div className="pt-2 space-y-3">
                <button 
                  onClick={() => runWorkflow(false)}
                  disabled={isRunning || !searchQuery}
                  className={`
                    w-full py-3 px-4 rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all
                    ${isRunning 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-n8n-primary to-n8n-secondary hover:shadow-n8n-primary/25 hover:-translate-y-0.5 text-white'
                    }
                  `}
                >
                  {isRunning ? (
                    <>
                      <PauseOctagon className="w-4 h-4 animate-pulse" /> Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Execute Workflow
                    </>
                  )}
                </button>

                {leads.length > 0 && !isRunning && (
                    <button 
                        onClick={() => runWorkflow(true)}
                        className="w-full py-2.5 px-4 rounded-lg font-medium text-sm border border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-emerald-400 flex items-center justify-center gap-2 transition-all group"
                    >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> 
                        Fetch Next Batch (+20)
                    </button>
                )}
              </div>

              {lastAddedCount > 0 && !isRunning && (
                 <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Successfully added {lastAddedCount} new leads!
                 </div>
              )}

              {errorMsg && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs flex items-center gap-2">
                   <PauseOctagon className="w-3 h-3" />
                   {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Workflow Visualizer */}
          <div className="bg-n8n-panel rounded-xl border border-slate-700 p-5 shadow-lg flex-grow flex flex-col min-h-[300px]">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-n8n-primary animate-pulse' : 'bg-slate-600'}`}></span>
              Live Pipeline
            </h2>
            <div className="flex flex-col gap-4 relative pl-2">
              {nodes.map((node, idx) => (
                <PipelineNode 
                  key={node.id} 
                  node={node} 
                  isLast={idx === nodes.length - 1}
                  isActive={node.status === NodeStatus.RUNNING}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-auto shadow-2xl rounded-xl">
          <div className="bg-n8n-panel rounded-t-xl border-x border-t border-slate-700 p-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Extracted Leads</h2>
             </div>
             <div className="flex gap-2">
               <div className="bg-n8n-dark px-3 py-1 rounded text-xs text-slate-400 border border-slate-600 font-mono">
                 {leads.length > 0 ? `${leads.length} Records` : 'No Data'}
               </div>
             </div>
          </div>
          <div className="flex-grow relative bg-n8n-node">
             <ResultsTable leads={leads} isLoading={nodes.some(n => n.id === '3' && n.status === NodeStatus.RUNNING)} />
          </div>
          <div className="bg-n8n-panel rounded-b-xl border-x border-b border-slate-700 p-2 text-center text-xs text-slate-500">
            Powered by Gemini 2.5 Flash & Google Maps
          </div>
        </div>

      </main>
    </div>
  );
}