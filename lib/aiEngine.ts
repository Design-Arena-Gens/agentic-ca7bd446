import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ResearchInsights, MarketingAsset } from './types';

export class AIEngine {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async analyzeProduct(
    productContent: string,
    productName: string,
    niche: string,
    landingUrl: string
  ): Promise<ResearchInsights> {
    const prompt = `You are an expert marketing researcher. Analyze this digital product and provide deep insights for viral organic marketing.

Product Name: ${productName}
Niche: ${niche}
Landing URL: ${landingUrl}

Product Content:
${productContent.substring(0, 8000)}

Provide a JSON response with:
1. niche_trends: Current trending topics in this niche (array of 5-10 trends)
2. competitor_analysis: Key insights about competitors (array of 3-5 points)
3. target_audience: {
   demographics: string description
   pain_points: array of 5-8 pain points
   desires: array of 5-8 desires/goals
}
4. viral_elements: What makes content go viral in this niche (array of 5-8 elements)
5. keyword_clusters: High-value keywords and phrases (array of 10-15 keywords)

Return ONLY valid JSON, no markdown formatting.`;

    try {
      if (this.anthropic) {
        const message = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = message.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent) {
          let text = textContent.text.trim();
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          return JSON.parse(text);
        }
      } else if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0].message.content;
        if (content) {
          return JSON.parse(content);
        }
      }

      return this.getFallbackInsights();
    } catch (error) {
      console.error('Analysis error:', error);
      return this.getFallbackInsights();
    }
  }

  async generateAssets(
    productName: string,
    niche: string,
    landingUrl: string,
    insights: ResearchInsights,
    platform: string,
    variantsPerPlatform: number
  ): Promise<MarketingAsset[]> {
    const platformSpecs = this.getPlatformSpecs(platform);

    const prompt = `You are a viral marketing copywriter. Create ${variantsPerPlatform} high-converting social media posts for ${platform}.

Product: ${productName}
Niche: ${niche}
Landing URL: ${landingUrl}

Target Audience:
- Demographics: ${insights.target_audience.demographics}
- Pain Points: ${insights.target_audience.pain_points.slice(0, 3).join(', ')}
- Desires: ${insights.target_audience.desires.slice(0, 3).join(', ')}

Viral Elements to Include: ${insights.viral_elements.slice(0, 3).join(', ')}
Top Keywords: ${insights.keyword_clusters.slice(0, 5).join(', ')}

Platform Specs:
- Character Limit: ${platformSpecs.charLimit}
- Hashtag Strategy: ${platformSpecs.hashtagStrategy}
- Best Practices: ${platformSpecs.bestPractices}

Generate ${variantsPerPlatform} variants, each with:
1. caption: Engaging post copy (within character limit)
2. hashtags: Array of 5-10 relevant hashtags (no # symbol)
3. image_prompt: Detailed DALL-E/Midjourney prompt for eye-catching image (50-100 words, focus on visual elements, colors, composition, style)
4. cta: Clear call-to-action phrase
5. best_posting_time: Best time to post (e.g., "Monday 9AM EST", "Weekend evenings")
6. engagement_score: Predicted virality score 1-100

Return ONLY valid JSON array, no markdown formatting.`;

    try {
      if (this.anthropic) {
        const message = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }],
        });

        const textContent = message.content.find(c => c.type === 'text');
        if (textContent && 'text' in textContent) {
          let text = textContent.text.trim();
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          const assets = JSON.parse(text);
          return assets.map((asset: any, idx: number) => ({
            platform: platform as any,
            variant_index: idx + 1,
            caption: asset.caption || '',
            hashtags: asset.hashtags || [],
            image_prompt: asset.image_prompt || '',
            cta: asset.cta || '',
            best_posting_time: asset.best_posting_time || '',
            engagement_score: asset.engagement_score || 50,
          }));
        }
      } else if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0].message.content;
        if (content) {
          const result = JSON.parse(content);
          const assets = result.variants || result.assets || result;
          return assets.map((asset: any, idx: number) => ({
            platform: platform as any,
            variant_index: idx + 1,
            caption: asset.caption || '',
            hashtags: asset.hashtags || [],
            image_prompt: asset.image_prompt || '',
            cta: asset.cta || '',
            best_posting_time: asset.best_posting_time || '',
            engagement_score: asset.engagement_score || 50,
          }));
        }
      }

      return this.getFallbackAssets(platform as any, variantsPerPlatform, productName, landingUrl);
    } catch (error) {
      console.error(`Asset generation error for ${platform}:`, error);
      return this.getFallbackAssets(platform as any, variantsPerPlatform, productName, landingUrl);
    }
  }

  async generateImage(prompt: string): Promise<string | null> {
    if (!this.openai) return null;

    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      return response.data?.[0]?.url || null;
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  }

  private getPlatformSpecs(platform: string) {
    const specs: Record<string, any> = {
      twitter: {
        charLimit: 280,
        hashtagStrategy: 'Use 1-3 hashtags max',
        bestPractices: 'Short, punchy, conversational. Use line breaks. Ask questions.',
      },
      pinterest: {
        charLimit: 500,
        hashtagStrategy: 'Use 5-10 specific hashtags',
        bestPractices: 'Descriptive, keyword-rich. Focus on benefits and results.',
      },
      instagram: {
        charLimit: 2200,
        hashtagStrategy: 'Use 10-20 hashtags (mix of popular and niche)',
        bestPractices: 'Story-driven, authentic, use emojis. First line is critical.',
      },
      linkedin: {
        charLimit: 3000,
        hashtagStrategy: 'Use 3-5 professional hashtags',
        bestPractices: 'Professional tone, value-driven, data/insights. Use paragraphs.',
      },
      reddit: {
        charLimit: 40000,
        hashtagStrategy: 'No hashtags, focus on value',
        bestPractices: 'Genuine, helpful, avoid sales pitch. Provide value first.',
      },
    };

    return specs[platform] || specs.twitter;
  }

  private getFallbackInsights(): ResearchInsights {
    return {
      niche_trends: [
        'Authenticity and transparency',
        'Short-form video content',
        'User-generated content',
        'Educational value',
        'Community building',
      ],
      competitor_analysis: [
        'Focus on storytelling over features',
        'Heavy use of visual content',
        'Consistent posting schedule',
      ],
      target_audience: {
        demographics: 'Digital-savvy professionals aged 25-45',
        pain_points: [
          'Lack of time',
          'Information overload',
          'Need for practical solutions',
          'Difficulty standing out',
        ],
        desires: [
          'Efficiency and productivity',
          'Professional growth',
          'Work-life balance',
          'Recognition and success',
        ],
      },
      viral_elements: [
        'Strong hook in first 3 seconds',
        'Emotional resonance',
        'Actionable takeaways',
        'Visual appeal',
        'Relatable scenarios',
      ],
      keyword_clusters: [
        'productivity',
        'growth',
        'success',
        'tips',
        'strategy',
        'results',
        'transform',
        'breakthrough',
      ],
    };
  }

  private getFallbackAssets(
    platform: any,
    count: number,
    productName: string,
    landingUrl: string
  ): MarketingAsset[] {
    const assets: MarketingAsset[] = [];

    for (let i = 0; i < count; i++) {
      assets.push({
        platform,
        variant_index: i + 1,
        caption: `Discover ${productName} - your solution to [key benefit]. ${landingUrl}`,
        hashtags: ['productivity', 'growth', 'success', 'tips', 'strategy'],
        image_prompt: `Professional, modern marketing image featuring ${productName}, vibrant colors, clean design, tech-focused aesthetic, high quality, eye-catching composition`,
        cta: 'Learn more',
        best_posting_time: 'Weekday mornings 9-11AM',
        engagement_score: 65,
      });
    }

    return assets;
  }
}
