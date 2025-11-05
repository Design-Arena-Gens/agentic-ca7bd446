export interface MarketingRequest {
  product_id: string;
  user_id: string;
  product_name: string;
  product_file_s3_url?: string;
  product_file_base64?: string;
  product_file_type?: string;
  landing_url: string;
  niche: string;
  max_images: number;
  variants_per_platform: number;
  human_review_required: boolean;
}

export interface MarketingAsset {
  platform: 'twitter' | 'pinterest' | 'instagram' | 'linkedin' | 'reddit';
  variant_index: number;
  caption: string;
  hashtags: string[];
  image_url?: string;
  image_prompt: string;
  cta: string;
  best_posting_time: string;
  engagement_score: number;
}

export interface ResearchInsights {
  niche_trends: string[];
  competitor_analysis: string[];
  target_audience: {
    demographics: string;
    pain_points: string[];
    desires: string[];
  };
  viral_elements: string[];
  keyword_clusters: string[];
}

export interface MarketingResponse {
  product_id: string;
  status: 'success' | 'partial' | 'failed';
  master_assets_s3?: string;
  research_insights_s3?: string;
  assets: MarketingAsset[];
  research_insights: ResearchInsights;
  error?: string;
}
