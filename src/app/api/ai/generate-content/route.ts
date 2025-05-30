import { NextRequest, NextResponse } from 'next/server'
import { aiContentService } from '@/lib/ai-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, platform, tone, audience, includeHashtags } = body

    if (!prompt || !platform || !tone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Demo content generation (for development)
    const demoContent = {
      TWITTER: {
        professional: `🚀 ${prompt.slice(0, 100)}... Leveraging cutting-edge technology to drive innovation and growth. Connect with us to learn more! #Innovation #Business #Growth`,
        casual: `Hey everyone! 👋 Just wanted to share something cool about ${prompt.slice(0, 80)}... What do you think? Drop your thoughts below! ✨`,
        humorous: `Plot twist: ${prompt.slice(0, 90)}... 😄 Who else can relate? Sometimes the best solutions come from the most unexpected places! 🤔💡`,
        inspirational: `✨ Remember: ${prompt.slice(0, 100)}... Every great journey starts with a single step. Keep pushing forward! 💪 #Motivation #Success`
      },
      INSTAGRAM: {
        professional: `${prompt.slice(0, 150)}...\n\nOur commitment to excellence drives everything we do. From ideation to execution, we believe in delivering value that matters.\n\n#Business #Excellence #Innovation #Quality #Growth`,
        casual: `${prompt.slice(0, 120)}... ✨\n\nHonestly, this has been such an amazing journey! Can't wait to share more updates with you all. What's been inspiring you lately? 💭\n\n#Journey #Inspiration #Community`,
        humorous: `When someone asked about ${prompt.slice(0, 100)}... 😂\n\nMe: *nervous laughter* "Well, that's a story for another day!"\n\nBut seriously, life's too short not to laugh at the chaos sometimes! 🤪\n\n#Life #Humor #Real`,
        inspirational: `${prompt.slice(0, 130)}... 🌟\n\nEvery challenge is an opportunity in disguise. Every setback is a setup for a comeback. Keep believing in your dreams! 💫\n\n#Dreams #Motivation #BelieveInYourself #Success`
      },
      LINKEDIN: {
        professional: `${prompt}\n\nIn today's rapidly evolving business landscape, organizations that embrace innovation and adapt to change are the ones that thrive. Our approach focuses on sustainable growth, strategic partnerships, and delivering exceptional value to our stakeholders.\n\nWhat strategies have you found most effective in your industry? I'd love to hear your insights.\n\n#BusinessStrategy #Innovation #Leadership #Growth #Sustainability`,
        casual: `${prompt}\n\nReflecting on this topic got me thinking about how much the professional world has changed. It's fascinating to see how collaboration and authentic connections continue to drive success.\n\nWhat's your take on this? How do you approach similar challenges in your field?\n\n#ProfessionalGrowth #Collaboration #Networking #Innovation`,
        humorous: `${prompt}\n\nYou know what they say in business: "Plan for the best, prepare for the unexpected, and always have a good coffee nearby!" ☕\n\nIn all seriousness though, adaptability and a sense of humor can be your greatest assets in any professional setting.\n\nAnyone else find that laughter really is the best medicine for workplace stress?\n\n#WorkplaceCulture #Business #Adaptability #Leadership`,
        inspirational: `${prompt}\n\nSuccess isn't just about reaching the destination—it's about the growth we experience along the journey. Every challenge we face, every problem we solve, shapes us into better professionals and leaders.\n\nTo everyone reading this: Your unique perspective and experiences matter. Keep pushing boundaries and inspiring others.\n\n#Leadership #Success #ProfessionalDevelopment #Inspiration #Growth`
      }
    }

    // Generate hashtags based on platform and content
    const generateHashtags = (platform: string, content: string) => {
      const commonHashtags = {
        TWITTER: ['Tech', 'Innovation', 'Business', 'Growth', 'AI', 'Digital'],
        INSTAGRAM: ['Daily', 'Inspiration', 'Life', 'Business', 'Creative', 'Community'],
        LINKEDIN: ['Professional', 'Business', 'Leadership', 'Innovation', 'Growth', 'Industry'],
        FACEBOOK: ['Community', 'Business', 'Updates', 'Growth', 'Local', 'Engagement'],
        TIKTOK: ['Viral', 'Trending', 'Fun', 'Creative', 'Business', 'Tips']
      }
      
      return (commonHashtags[platform as keyof typeof commonHashtags] || commonHashtags.TWITTER).slice(0, includeHashtags ? 5 : 0)
    }

    const demoResult = {
      content: demoContent[platform as keyof typeof demoContent]?.[tone as keyof typeof demoContent.TWITTER] || 
               `Generated content for ${platform} with ${tone} tone: ${prompt}`,
      hashtags: includeHashtags ? generateHashtags(platform, prompt) : [],
      suggestions: [
        'Try adding emojis to increase engagement',
        'Consider posting during peak hours (9-11 AM or 7-9 PM)',
        'Add a call-to-action to encourage interaction',
        'Include relevant industry hashtags for better reach'
      ]
    }

    // Try real AI generation first, fallback to demo
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
        const result = await aiContentService.generateContent({
          prompt,
          platform,
          tone,
          audience: audience || 'general audience',
          includeHashtags,
        })
        return NextResponse.json(result)
      }
    } catch (aiError) {
      console.log('Using demo content generation')
    }

    return NextResponse.json(demoResult)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
