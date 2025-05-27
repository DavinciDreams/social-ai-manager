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

    const upcomingPosts = await postSchedulerService.getUpcomingScheduledPosts(
      session.user.id,
      limit
    )

    return NextResponse.json({ upcomingPosts })
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
