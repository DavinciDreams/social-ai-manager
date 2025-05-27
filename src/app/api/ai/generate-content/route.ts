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

    const result = await aiContentService.generateContent({
      prompt,
      platform,
      tone,
      audience: audience || 'general audience',
      includeHashtags,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
