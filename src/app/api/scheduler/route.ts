import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { schedulerService } from '@/lib/scheduler-service'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = schedulerService.getStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Scheduler status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const { action, postId, scheduledAt } = await request.json()
    
    switch (action) {
      case 'start':
        schedulerService.start()
        return NextResponse.json({ success: true, message: 'Scheduler started' })
      
      case 'stop':
        schedulerService.stop()
        return NextResponse.json({ success: true, message: 'Scheduler stopped' })
      
      case 'schedule':
        if (!postId || !scheduledAt) {
          return NextResponse.json(
            { error: 'Post ID and scheduled time are required' },
            { status: 400 }
          )
        }
        
        const scheduleResult = await schedulerService.schedulePost(
          postId, 
          new Date(scheduledAt)
        )
        
        if (scheduleResult.success) {
          return NextResponse.json({ success: true, message: 'Post scheduled' })
        } else {
          return NextResponse.json(
            { error: scheduleResult.error },
            { status: 500 }
          )
        }
      
      case 'cancel':
        if (!postId) {
          return NextResponse.json(
            { error: 'Post ID is required' },
            { status: 400 }
          )
        }
        
        const cancelResult = await schedulerService.cancelScheduledPost(postId)
        
        if (cancelResult.success) {
          return NextResponse.json({ success: true, message: 'Scheduled post cancelled' })
        } else {
          return NextResponse.json(
            { error: cancelResult.error },
            { status: 500 }
          )
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Scheduler action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
