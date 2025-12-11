import { DataAsset, AssetType, HealthStatus, LineageEdge } from './types';

// Helper to generate dates relative to now
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const INITIAL_NODES: DataAsset[] = [
  // Layer 1: Sources
  {
    id: 'sap_raw',
    label: 'SAP_ORDERS_RAW',
    type: AssetType.SOURCE,
    status: HealthStatus.HEALTHY,
    description: 'Raw replication of SAP VBAK/VBAP tables.',
    owner: 'Ingestion Team',
    lastUpdated: daysAgo(0),
    rowCount: 1542000,
    freshness: '15 mins',
    tags: ['PII', 'Finance'],
    qualityScore: 98,
    schema: [
      { name: 'order_id', type: 'varchar', isPii: false, description: 'PK' },
      { name: 'customer_email', type: 'varchar', isPii: true, description: 'Customer Email' }
    ],
    position: { x: 50, y: 100 }
  },
  {
    id: 'clickstream',
    label: 'WEB_CLICKS_STREAM',
    type: AssetType.SOURCE,
    status: HealthStatus.WARNING,
    description: 'Kafka stream of website events.',
    owner: 'Web Team',
    lastUpdated: daysAgo(0),
    rowCount: 50000000,
    freshness: 'Real-time',
    tags: ['High Volume'],
    qualityScore: 85,
    schema: [
      { name: 'session_id', type: 'uuid', isPii: false, description: 'Session ID' },
      { name: 'url', type: 'varchar', isPii: false, description: 'Page URL' }
    ],
    position: { x: 50, y: 300 }
  },

  // Layer 2: Transformation / Staging
  {
    id: 'stg_orders',
    label: 'STG_CLEAN_ORDERS',
    type: AssetType.TRANSFORM,
    status: HealthStatus.HEALTHY,
    description: 'Cleaned orders with standardized currency.',
    owner: 'Core Data Team',
    lastUpdated: daysAgo(0),
    rowCount: 1541800,
    freshness: '1 hour',
    tags: ['Silver'],
    qualityScore: 99,
    schema: [
      { name: 'order_id', type: 'varchar', isPii: false, description: 'PK' },
      { name: 'amount_usd', type: 'decimal', isPii: false, description: 'Normalized Amount' }
    ],
    position: { x: 400, y: 100 }
  },
  {
    id: 'stg_events',
    label: 'STG_USER_SESSIONS',
    type: AssetType.TRANSFORM,
    status: HealthStatus.ERROR, // Simulate a break here
    description: 'Sessionized web events. FAILED due to schema mismatch.',
    owner: 'Core Data Team',
    lastUpdated: daysAgo(1),
    rowCount: 4500000,
    freshness: '25 hours',
    tags: ['Silver', 'Broken'],
    qualityScore: 40,
    schema: [],
    position: { x: 400, y: 300 }
  },

  // Layer 3: Semantic Models
  {
    id: 'dim_customer',
    label: 'DIM_CUSTOMER_360',
    type: AssetType.MODEL,
    status: HealthStatus.HEALTHY,
    description: 'Golden record of customer attributes.',
    owner: 'Analytics Eng',
    lastUpdated: daysAgo(0),
    rowCount: 50000,
    freshness: '4 hours',
    tags: ['Gold', 'PII'],
    qualityScore: 95,
    schema: [],
    position: { x: 800, y: 50 }
  },
  {
    id: 'fct_sales',
    label: 'FCT_DAILY_SALES',
    type: AssetType.MODEL,
    status: HealthStatus.WARNING, // Warning because upstream source 'clickstream' is warning, or direct dep is ok
    description: 'Aggregated daily sales facts.',
    owner: 'Analytics Eng',
    lastUpdated: daysAgo(0),
    rowCount: 1200,
    freshness: '4 hours',
    tags: ['Gold'],
    qualityScore: 92,
    schema: [],
    position: { x: 800, y: 200 }
  },
  {
    id: 'fct_attribution',
    label: 'FCT_MKT_ATTRIBUTION',
    type: AssetType.MODEL,
    status: HealthStatus.ERROR, // Cascading error from stg_events
    description: 'Marketing attribution model linking sales to clicks.',
    owner: 'Marketing Data',
    lastUpdated: daysAgo(2),
    rowCount: 0,
    freshness: '48 hours',
    tags: ['Gold'],
    qualityScore: 0,
    schema: [],
    position: { x: 800, y: 350 }
  },

  // Layer 4: Consumption
  {
    id: 'dash_exec',
    label: 'EXEC_OVERVIEW_DASH',
    type: AssetType.DASHBOARD,
    status: HealthStatus.HEALTHY,
    description: 'Tableau dashboard for C-Suite.',
    owner: 'BI Team',
    lastUpdated: daysAgo(0),
    rowCount: 0,
    freshness: '4 hours',
    tags: ['Critical'],
    qualityScore: 100,
    schema: [],
    position: { x: 1200, y: 100 }
  },
  {
    id: 'dash_mkt',
    label: 'MARKETING_ROI_DASH',
    type: AssetType.DASHBOARD,
    status: HealthStatus.ERROR, // Broken
    description: 'PowerBI dashboard for Marketing Ops.',
    owner: 'Marketing Ops',
    lastUpdated: daysAgo(3),
    rowCount: 0,
    freshness: 'STALE',
    tags: ['Critical'],
    qualityScore: 0,
    schema: [],
    position: { x: 1200, y: 350 }
  }
];

export const INITIAL_EDGES: LineageEdge[] = [
  { id: 'e1', source: 'sap_raw', target: 'stg_orders' },
  { id: 'e2', source: 'clickstream', target: 'stg_events' },
  { id: 'e3', source: 'stg_orders', target: 'dim_customer' },
  { id: 'e4', source: 'stg_orders', target: 'fct_sales' },
  { id: 'e5', source: 'stg_orders', target: 'fct_attribution' }, // Join key
  { id: 'e6', source: 'stg_events', target: 'fct_attribution' }, // Broken link
  { id: 'e7', source: 'dim_customer', target: 'dash_exec' },
  { id: 'e8', source: 'fct_sales', target: 'dash_exec' },
  { id: 'e9', source: 'fct_attribution', target: 'dash_mkt' }
];
