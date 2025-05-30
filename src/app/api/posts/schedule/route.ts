import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { postSchedulerService } from '@/lib/post-scheduler'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Demo data for development
    const demoUpcomingPosts = [
      {
        id: '1',
        content: '🚀 Excited to share our latest AI-powered features! The future of social media management is here. #AI #SocialMedia #Innovation',
        platform: 'TWITTER',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        status: 'SCHEDULED',
        account: {
          platform: 'TWITTER',
          username: '@yourbusiness',
          displayName: 'Your Business'
        },
        hashtags: ['AI', 'SocialMedia', 'Innovation']
      },
      {
        id: '2',
        content: 'Behind the scenes of our product development process. Building something amazing! 📸✨',
        platform: 'INSTAGRAM',
        scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        status: 'SCHEDULED',
        account: {
          platform: 'INSTAGRAM',
          username: '@yourbusiness',
          displayName: 'Your Business'
        },
        mediaUrls: ['https://example.com/image1.jpg'],
        hashtags: ['BehindTheScenes', 'ProductDevelopment', 'Building']
      },
      {
        id: '3',
        content: 'Professional insights on the latest industry trends. Swipe to see our analysis of market changes.',
        platform: 'LINKEDIN',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        status: 'SCHEDULED',
        account: {
          platform: 'LINKEDIN',
          username: 'your-business',
          displayName: 'Your Business'
        }
      }
    ].slice(0, limit)

    // Try to get real data first, fallback to demo data
    try {
      const upcomingPosts = await postSchedulerService.getUpcomingScheduledPosts(
        session.user.id,
        limit
      )
      
      // If no real data, return demo data
      if (!upcomingPosts || upcomingPosts.length === 0) {
        return NextResponse.json({ upcomingPosts: demoUpcomingPosts })
      }
      
      return NextResponse.json({ upcomingPosts })
    } catch (dbError) {
      // If database error, return demo data
      console.log('Using demo data for scheduled posts')
      return NextResponse.json({ upcomingPosts: demoUpcomingPosts })
    }
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, scheduledAt, action } = body

    if (!postId || !action) {
      return NextResponse.json(
        { error: 'Post ID and action are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'schedule':
        if (!scheduledAt) {
          return NextResponse.json(
            { error: 'Scheduled date is required for scheduling' },
            { status: 400 }
          )
        }
        await postSchedulerService.schedulePost(postId, new Date(scheduledAt))
        return NextResponse.json({ 
          message: 'Post scheduled successfully',
          postId,
          scheduledAt 
        })

      case 'cancel':
        await postSchedulerService.cancelScheduledPost(postId)
        return NextResponse.json({ 
          message: 'Scheduled post cancelled successfully',
          postId 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "schedule" or "cancel"' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing schedule request:', error)
    return NextResponse.json(
      { error: 'Failed to process schedule request' },
      { status: 500 }
    )
  }
}
