import OpenAI from 'openai'
import { HfInference } from '@huggingface/inference'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export interface ContentGenerationRequest {
  prompt: string
  platform: 'TWITTER' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK'
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational'
  audience: string
  includeHashtags: boolean
  maxLength?: number
}

export interface GeneratedContent {
  content: string
  hashtags: string[]
  suggestions: string[]
}

export class AIContentService {
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    const { prompt, platform, tone, audience, includeHashtags, maxLength } = request

    // Platform-specific constraints
    const platformLimits = {
      TWITTER: 280,
      INSTAGRAM: 2200,
      FACEBOOK: 63206,
      LINKEDIN: 3000,
      TIKTOK: 150,
    }

    const characterLimit = maxLength || platformLimits[platform]

    // Create system prompt for content generation
    const systemPrompt = `You are an expert social media content creator. Generate engaging ${platform.toLowerCase()} content that:
    - Has a ${tone} tone
    - Is targeted at ${audience}
    - Stays within ${characterLimit} characters
    - Is optimized for ${platform.toLowerCase()} best practices
    ${includeHashtags ? '- Includes relevant hashtags' : '- Does not include hashtags'}
    
    Respond with a JSON object containing:
    - content: the main post content
    - hashtags: array of relevant hashtags (if requested)
    - suggestions: array of 3 alternative content variations`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No content generated')

      // Parse the JSON response
      const parsedResponse = JSON.parse(response) as GeneratedContent
      
      // Validate content length
      if (parsedResponse.content.length > characterLimit) {
        parsedResponse.content = parsedResponse.content.substring(0, characterLimit - 3) + '...'
      }

      return parsedResponse
    } catch (error) {
      console.error('Error generating content:', error)
      throw new Error('Failed to generate content')
    }
  }

  async analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
    try {
      const result = await hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: text,
      })

      return {
        label: result[0].label,
        score: result[0].score,
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
      throw new Error('Failed to analyze sentiment')
    }
  }

  async generateHashtags(content: string, platform: string, count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} relevant hashtags for this ${platform.toLowerCase()} post: "${content}". Return only the hashtags as a JSON array, without the # symbol.`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 200,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No hashtags generated')

      return JSON.parse(response) as string[]
    } catch (error) {
      console.error('Error generating hashtags:', error)
      return []
    }
  }

  async optimizePostTime(platform: string, timezone: string, audienceData?: any): Promise<string[]> {
    // This would typically use ML models and audience data
    // For now, return general best practices
    const generalOptimalTimes = {
      TWITTER: ['9:00 AM', '1:00 PM', '3:00 PM'],
      INSTAGRAM: ['11:00 AM', '2:00 PM', '5:00 PM'],
      FACEBOOK: ['1:00 PM', '3:00 PM', '7:00 PM'],
      LINKEDIN: ['8:00 AM', '12:00 PM', '5:00 PM'],
      TIKTOK: ['6:00 AM', '10:00 AM', '7:00 PM'],
    }

    return generalOptimalTimes[platform as keyof typeof generalOptimalTimes] || ['12:00 PM']
  }

  async detectTrends(industry: string, location?: string): Promise<string[]> {
    const prompt = `List 10 current trending topics and hashtags in the ${industry} industry${location ? ` in ${location}` : ''}. Return as a JSON array of strings.`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) throw new Error('No trends detected')

      return JSON.parse(response) as string[]
    } catch (error) {
      console.error('Error detecting trends:', error)
      return []
    }
  }
}

export const aiContentService = new AIContentService()
