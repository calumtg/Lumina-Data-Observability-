export enum AssetType {
  SOURCE = 'SOURCE',
  TRANSFORM = 'TRANSFORM',
  MODEL = 'MODEL',
  DASHBOARD = 'DASHBOARD'
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface ColumnSchema {
  name: string;
  type: string;
  isPii: boolean;
  description: string;
}

export interface DataAsset {
  id: string;
  label: string;
  type: AssetType;
  status: HealthStatus;
  description: string;
  owner: string;
  lastUpdated: string; // ISO Date
  rowCount?: number;
  freshness: string;
  schema: ColumnSchema[];
  tags: string[];
  qualityScore: number; // 0-100
  // For visual layout
  position: { x: number; y: number };
}

export interface LineageEdge {
  id: string;
  source: string;
  target: string;
}

export enum ViewMode {
  STANDARD = 'STANDARD',
  IMPACT_ANALYSIS = 'IMPACT_ANALYSIS', // Highlight downstream
  ROOT_CAUSE = 'ROOT_CAUSE', // Highlight upstream errors
}

// Ingestion System Types

export enum IntegrationType {
  SNOWFLAKE = 'Snowflake',
  POSTGRES = 'PostgreSQL',
  BIGQUERY = 'BigQuery',
  DBT = 'dbt',
  TABLEAU = 'Tableau'
}

export interface DataSource {
  id: string;
  name: string;
  type: IntegrationType;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  lastSync?: string;
  config?: Record<string, any>;
}

export interface IngestionResult {
  nodes: DataAsset[];
  edges: LineageEdge[];
  summary: string;
}
