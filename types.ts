export interface BusinessLead {
  id: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  website?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  status: 'pending' | 'enriched' | 'failed';
  googleMapsUri?: string;
  websiteQuality?: 'Good' | 'Bad' | 'Decent';
}

export enum NodeStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'search' | 'parser' | 'sheet';
  label: string;
  status: NodeStatus;
  icon: string;
  description: string;
}

export interface SearchParams {
  query: string;
  location: string;
}