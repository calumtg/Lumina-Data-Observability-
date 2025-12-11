import { DataAsset, LineageEdge, IntegrationType, AssetType, HealthStatus, IngestionResult } from '../types';

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulates parsing OpenLineage events into our graph format
const parseOpenLineagePayload = (rawPayload: any): IngestionResult => {
  // In a real app, this would map OpenLineage Run/Job/Dataset events to DataAsset/LineageEdge
  return rawPayload; 
};

export const connectSource = async (type: IntegrationType, credentials: any): Promise<boolean> => {
  await delay(1000); // Simulate auth check
  return true; 
};

export const triggerIngestion = async (type: IntegrationType): Promise<IngestionResult> => {
  await delay(2500); // Simulate API crawling and metadata extraction

  const timestamp = new Date().toISOString();

  // Mock data tailored to specific sources to demonstrate the system
  if (type === IntegrationType.SNOWFLAKE) {
    const nodes: DataAsset[] = [
      {
        id: 'sf_ads_raw',
        label: 'RAW_AD_CAMPAIGNS',
        type: AssetType.SOURCE,
        status: HealthStatus.HEALTHY,
        description: 'Raw advertising spend data from 3rd party API dump.',
        owner: 'Marketing Eng',
        lastUpdated: timestamp,
        rowCount: 85000,
        freshness: '2 hours',
        tags: ['Snowflake', 'External'],
        qualityScore: 100,
        schema: [
           { name: 'campaign_id', type: 'varchar', isPii: false, description: 'Campaign ID' },
           { name: 'daily_spend', type: 'float', isPii: false, description: 'Daily Spend USD' }
        ],
        position: { x: 50, y: 500 } // Positioned below existing sources
      }
    ];
    return {
      nodes,
      edges: [],
      summary: "Scanned ACCOUNT_USAGE.TABLES. Found 1 new table."
    };
  }

  if (type === IntegrationType.DBT) {
    const nodes: DataAsset[] = [
      {
        id: 'dbt_stg_ads',
        label: 'STG_AD_PERFORMANCE',
        type: AssetType.TRANSFORM,
        status: HealthStatus.HEALTHY,
        description: 'Cleaned ad performance metrics via dbt model.',
        owner: 'Analytics Eng',
        lastUpdated: timestamp,
        rowCount: 85000,
        freshness: '2 hours',
        tags: ['dbt', 'Silver'],
        qualityScore: 98,
        schema: [
           { name: 'campaign_id', type: 'varchar', isPii: false, description: 'ID' },
           { name: 'roas', type: 'float', isPii: false, description: 'Return on Ad Spend' }
        ],
        position: { x: 400, y: 500 }
      },
      {
        id: 'dbt_model_roas',
        label: 'FCT_ROAS_ANALYSIS',
        type: AssetType.MODEL,
        status: HealthStatus.HEALTHY,
        description: 'Final fact table for ROAS analysis.',
        owner: 'Marketing Data',
        lastUpdated: timestamp,
        rowCount: 1200,
        freshness: '2 hours',
        tags: ['dbt', 'Gold'],
        qualityScore: 95,
        schema: [],
        position: { x: 800, y: 500 }
      }
    ];

    // DBT connects the snowflake raw table (if it exists) to these models
    const edges: LineageEdge[] = [
      { id: 'e_new_1', source: 'sf_ads_raw', target: 'dbt_stg_ads' },
      { id: 'e_new_2', source: 'dbt_stg_ads', target: 'dbt_model_roas' },
      // It also joins with existing data!
      { id: 'e_new_3', source: 'dim_customer', target: 'dbt_model_roas' } 
    ];

    return {
      nodes,
      edges,
      summary: "Parsed manifest.json. Found 2 models and 3 lineage relationships."
    };
  }

  if (type === IntegrationType.TABLEAU) {
    const nodes: DataAsset[] = [
      {
        id: 'tab_marketing_exec',
        label: 'CMO_DASHBOARD',
        type: AssetType.DASHBOARD,
        status: HealthStatus.WARNING, // Found an issue during ingestion
        description: 'Executive marketing overview.',
        owner: 'Marketing Ops',
        lastUpdated: timestamp,
        rowCount: 0,
        freshness: '1 day',
        tags: ['Tableau', 'Critical'],
        qualityScore: 80,
        schema: [],
        position: { x: 1200, y: 500 }
      }
    ];
    const edges: LineageEdge[] = [
       { id: 'e_new_4', source: 'dbt_model_roas', target: 'tab_marketing_exec' }
    ];
    return {
       nodes,
       edges,
       summary: "Scanned Tableau Metadata API. Found 1 Dashboard linked to existing models."
    };
  }

  return { nodes: [], edges: [], summary: "No changes detected." };
};
