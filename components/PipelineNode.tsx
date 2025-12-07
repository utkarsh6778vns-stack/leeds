import React from 'react';
import { WorkflowNode, NodeStatus } from '../types';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

interface PipelineNodeProps {
  node: WorkflowNode;
  isLast: boolean;
  isActive: boolean;
}

const PipelineNode: React.FC<PipelineNodeProps> = ({ node, isLast, isActive }) => {
  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case NodeStatus.COMPLETED: return 'text-emerald-400 border-emerald-500/50';
      case NodeStatus.RUNNING: return 'text-n8n-primary border-n8n-primary';
      case NodeStatus.ERROR: return 'text-red-400 border-red-500/50';
      default: return 'text-slate-400 border-slate-600';
    }
  };

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case NodeStatus.COMPLETED: return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case NodeStatus.RUNNING: return <Loader2 className="w-5 h-5 animate-spin text-n8n-primary" />;
      case NodeStatus.ERROR: return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Circle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="flex items-center group relative">
      {/* Connector Line */}
      {!isLast && (
        <div className={`absolute left-8 top-12 w-0.5 h-12 bg-slate-700 -z-10 ${node.status === NodeStatus.COMPLETED ? 'bg-emerald-500/30' : ''}`}></div>
      )}

      <div className={`
        relative z-10 flex items-center p-4 rounded-xl border-2 bg-n8n-node w-full transition-all duration-300
        ${isActive ? 'shadow-[0_0_20px_rgba(255,109,90,0.15)] scale-[1.02]' : ''}
        ${getStatusColor(node.status)}
      `}>
        <div className="mr-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-n8n-dark flex items-center justify-center text-xl">
            {node.icon}
          </div>
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-slate-200 text-sm">{node.label}</h3>
            {getStatusIcon(node.status)}
          </div>
          <p className="text-xs text-slate-400">{node.description}</p>
        </div>

        {/* Pulse effect if running */}
        {node.status === NodeStatus.RUNNING && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-n8n-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-n8n-primary"></span>
          </span>
        )}
      </div>
    </div>
  );
};

export default PipelineNode;