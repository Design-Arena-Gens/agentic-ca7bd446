import { v4 as uuidv4 } from 'uuid';
import { FileProcessor } from './fileProcessor';
import { AIEngine } from './aiEngine';
import { MarketingRequest, MarketingResponse, MarketingAsset } from './types';

export class MarketingAgent {
  private aiEngine: AIEngine;

  constructor() {
    this.aiEngine = new AIEngine();
  }

  async generateMarketing(request: MarketingRequest): Promise<MarketingResponse> {
    try {
      let productContent = '';

      if (request.product_file_s3_url) {
        const fileBuffer = await FileProcessor.fetchFromS3(request.product_file_s3_url);
        const fileType = this.detectFileType(request.product_file_s3_url);
        productContent = await FileProcessor.processFile(fileBuffer, fileType);
      } else if (request.product_file_base64 && request.product_file_type) {
        const fileBuffer = Buffer.from(request.product_file_base64, 'base64');
        productContent = await FileProcessor.processFile(fileBuffer, request.product_file_type);
      } else {
        productContent = `Product: ${request.product_name}\nNiche: ${request.niche}`;
      }

      const insights = await this.aiEngine.analyzeProduct(
        productContent,
        request.product_name,
        request.niche,
        request.landing_url
      );

      const platforms = ['twitter', 'pinterest', 'instagram', 'linkedin', 'reddit'];
      const allAssets: MarketingAsset[] = [];

      for (const platform of platforms) {
        const assets = await this.aiEngine.generateAssets(
          request.product_name,
          request.niche,
          request.landing_url,
          insights,
          platform,
          request.variants_per_platform
        );

        for (let i = 0; i < Math.min(assets.length, request.max_images); i++) {
          const asset = assets[i];
          if (process.env.OPENAI_API_KEY && i < 2) {
            try {
              const imageUrl = await this.aiEngine.generateImage(asset.image_prompt);
              if (imageUrl) {
                asset.image_url = imageUrl;
              }
            } catch (error) {
              console.error(`Failed to generate image for ${platform}:`, error);
            }
          }
        }

        allAssets.push(...assets);
      }

      const response: MarketingResponse = {
        product_id: request.product_id,
        status: 'success',
        assets: allAssets,
        research_insights: insights,
      };

      return response;
    } catch (error) {
      console.error('Marketing generation error:', error);
      return {
        product_id: request.product_id,
        status: 'failed',
        assets: [],
        research_insights: {
          niche_trends: [],
          competitor_analysis: [],
          target_audience: {
            demographics: '',
            pain_points: [],
            desires: [],
          },
          viral_elements: [],
          keyword_clusters: [],
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private detectFileType(url: string): string {
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.pdf')) return 'pdf';
    if (urlLower.endsWith('.zip')) return 'zip';
    if (urlLower.endsWith('.txt')) return 'txt';
    return 'txt';
  }
}
