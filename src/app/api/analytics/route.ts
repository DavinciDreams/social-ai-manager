import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d
    const platform = searchParams.get('platform') // Optional filter

    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default: // 7d
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Build where condition
    const whereCondition: any = {
      userId: session.user.id,
      publishedAt: {
        gte: startDate,
        lte: now,
      },
      status: 'PUBLISHED',
    }

    if (platform) {
      whereCondition.platform = platform
    }

    // Get posts with analytics
    const posts = await prisma.post.findMany({
      where: whereCondition,
      include: {
        analytics: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        account: {
          select: {
            platform: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    // Calculate aggregate metrics
    let totalImpressions = 0
    let totalEngagements = 0
    let totalLikes = 0
    let totalShares = 0
    let totalComments = 0
    let totalClicks = 0
    let totalReach = 0

    const platformBreakdown: { [key: string]: any } = {}
    const dailyMetrics: { [key: string]: any } = {}

    posts.forEach((post: any) => {
      const analytics = post.analytics[0]
      if (analytics) {
        totalImpressions += analytics.impressions
        totalEngagements += analytics.engagements
        totalLikes += analytics.likes
        totalShares += analytics.shares
        totalComments += analytics.comments
        totalClicks += analytics.clicks
        totalReach += analytics.reach

        // Platform breakdown
        if (!platformBreakdown[post.platform]) {
          platformBreakdown[post.platform] = {
            platform: post.platform,
            posts: 0,
            impressions: 0,
            engagements: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            avgEngagementRate: 0,
          }
        }

        platformBreakdown[post.platform].posts += 1
        platformBreakdown[post.platform].impressions += analytics.impressions
        platformBreakdown[post.platform].engagements += analytics.engagements
        platformBreakdown[post.platform].likes += analytics.likes
        platformBreakdown[post.platform].shares += analytics.shares
        platformBreakdown[post.platform].comments += analytics.comments

        // Daily metrics
        const day = post.publishedAt?.toISOString().split('T')[0]
        if (day) {
          if (!dailyMetrics[day]) {
            dailyMetrics[day] = {
              date: day,
              posts: 0,
              impressions: 0,
              engagements: 0,
              likes: 0,
              shares: 0,
              comments: 0,
            }
          }

          dailyMetrics[day].posts += 1
          dailyMetrics[day].impressions += analytics.impressions
          dailyMetrics[day].engagements += analytics.engagements
          dailyMetrics[day].likes += analytics.likes
          dailyMetrics[day].shares += analytics.shares
          dailyMetrics[day].comments += analytics.comments
        }
      }
    })

    // Calculate average engagement rates for platforms
    Object.values(platformBreakdown).forEach((platform: any) => {
      platform.avgEngagementRate = platform.impressions > 0 
        ? (platform.engagements / platform.impressions) * 100 
        : 0
    })

    // Calculate overall engagement rate
    const overallEngagementRate = totalImpressions > 0 
      ? (totalEngagements / totalImpressions) * 100 
      : 0    // Get top performing posts
    const topPosts = posts
      .filter((post: any) => post.analytics.length > 0)
      .sort((a: any, b: any) => b.analytics[0].engagements - a.analytics[0].engagements)
      .slice(0, 5)
      .map((post: any) => ({
        id: post.id,
        content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        platform: post.platform,
        account: post.account,
        publishedAt: post.publishedAt,
        analytics: post.analytics[0],
      }))

    return NextResponse.json({
      summary: {
        totalPosts: posts.length,
        totalImpressions,
        totalEngagements,
        totalLikes,
        totalShares,
        totalComments,
        totalClicks,
        totalReach,
        engagementRate: overallEngagementRate,
        period,
      },
      platformBreakdown: Object.values(platformBreakdown),
      dailyMetrics: Object.values(dailyMetrics).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      topPosts,
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
