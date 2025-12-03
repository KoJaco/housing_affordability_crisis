/**
 * Type definitions for Sydney Property Analysis application
 * Matching API schemas from backend
 */

export type PropertyType = 'all' | 'house' | 'unit';

export interface SuburbAnalytics {
  suburb: string;
  property_type: 'house' | 'unit';
  last_updated: string | null;
  current_quarter: string | null;
  
  // Current metrics
  current_median_price: number | null;
  current_avg_ctsd: number | null;
  current_num_sales: number | null;
  
  // Growth rates
  growth_1yr_percentage: number | null;
  growth_3yr_percentage: number | null;
  growth_5yr_percentage: number | null;
  growth_10yr_percentage: number | null;
  growth_since_2005_percentage: number | null;
  cagr_5yr: number | null;
  cagr_10yr: number | null;
  
  // Risk & market health
  volatility_score: number | null;
  max_drawdown_pct: number | null;
  recovery_quarters: number | null;
  avg_quarterly_volume: number | null;
  overall_liquidity_score: number | null;
  market_health_score: number | null;
  
  // Seasonal patterns
  q1_avg_premium_percentage: number | null;
  q2_avg_premium_percentage: number | null;
  q3_avg_premium_percentage: number | null;
  q4_avg_premium_percentage: number | null;
  best_quarter_to_sell: string | null;
  
  // Forecasts
  forecast_q1_price: number | null;
  forecast_q1_lower: number | null;
  forecast_q1_upper: number | null;
  forecast_q2_price: number | null;
  forecast_q2_lower: number | null;
  forecast_q2_upper: number | null;
  
  // Rankings
  price_rank: number | null;
  growth_rank: number | null;
  speed_rank: number | null;
  
  // Data quality
  total_quarters_with_data: number | null;
  data_completeness_percentage: number | null;
  price_quarterly: string | null; // JSON string
  ctsd_quarterly: string | null; // JSON string
}

export interface QuarterlyStats {
  id: number;
  suburb: string;
  property_type: 'house' | 'unit';
  year: number;
  quarter: number;
  quarter_start: string; // ISO date string
  num_sales: number;
  median_price: number | null;
  mean_price: number | null;
  min_price: number | null;
  max_price: number | null;
  price_stddev: number | null;
  price_p25: number | null;
  price_p75: number | null;
  median_ctsd: number | null;
  mean_ctsd: number | null;
  fast_sales_percentage: number | null;
  fast_settlements_percentage: number | null; // Note: backend route doesn't select this field yet, but schema includes it
  liquidity_score: number | null;
  contract_to_settlement_score: number | null;
  qoq_price_change_percentage: number | null;
  yoy_price_change_percentage: number | null;
  created_at: string | null; // ISO datetime string
}

export interface SuburbSummary {
  suburb: string;
  current_median_price: number | null;
  growth_5yr_percentage: number | null;
  current_avg_ctsd: number | null;
}

export interface AnalyticsListResponse {
  items: SuburbAnalytics[];
  total: number;
  limit: number;
  offset: number;
}

export interface QuarterlyStatsListResponse {
  items: QuarterlyStats[];
  total: number;
  limit: number;
  offset: number;
}

export interface SuburbSearchResponse {
  suburbs: string[];
  total: number;
}

// Aggregated analytics for 'all' property type
export interface AggregatedSuburbAnalytics extends Omit<SuburbAnalytics, 'property_type'> {
  property_type: 'all';
  house_analytics?: SuburbAnalytics;
  unit_analytics?: SuburbAnalytics;
}

// Combined data structure for a single suburb
export interface SuburbData {
  analytics: SuburbAnalytics | AggregatedSuburbAnalytics;
  quarterly: QuarterlyStats[];
}

// Bulk suburbs data
export interface BulkSuburbsData {
  [suburb: string]: SuburbData;
}

