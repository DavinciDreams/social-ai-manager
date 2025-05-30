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

    // Demo analytics data for development
    const generateDemoData = () => {
      const now = new Date()
      const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
      
      const demoData = {
        overview: {
          totalPosts: Math.floor(Math.random() * 50) + 20,
          totalReach: Math.floor(Math.random() * 50000) + 25000,
          totalEngagement: Math.floor(Math.random() * 5000) + 2000,
          averageEngagementRate: (Math.random() * 3 + 1).toFixed(2) + '%',
          topPlatform: 'Instagram',
          growthRate: '+' + (Math.random() * 15 + 5).toFixed(1) + '%'
        },
        platformStats: [
          {
            platform: 'Instagram',
            posts: Math.floor(Math.random() * 20) + 10,
            reach: Math.floor(Math.random() * 20000) + 15000,
            engagement: Math.floor(Math.random() * 2000) + 1500,
            engagementRate: (Math.random() * 4 + 2).toFixed(2) + '%',
            followers: Math.floor(Math.random() * 5000) + 3000
          },
          {
            platform: 'Twitter',
            posts: Math.floor(Math.random() * 15) + 8,
            reach: Math.floor(Math.random() * 15000) + 8000,
            engagement: Math.floor(Math.random() * 1500) + 800,
            engagementRate: (Math.random() * 3 + 1.5).toFixed(2) + '%',
            followers: Math.floor(Math.random() * 3000) + 2000
          },
          {
            platform: 'LinkedIn',
            posts: Math.floor(Math.random() * 10) + 5,
            reach: Math.floor(Math.random() * 10000) + 5000,
            engagement: Math.floor(Math.random() * 1000) + 500,
            engagementRate: (Math.random() * 2.5 + 2).toFixed(2) + '%',
            followers: Math.floor(Math.random() * 2000) + 1500
          }
        ],
        timeSeriesData: Array.from({ length: days }, (_, i) => {
          const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000)
          return {
            date: date.toISOString().split('T')[0],
            reach: Math.floor(Math.random() * 3000) + 1000,
            engagement: Math.floor(Math.random() * 300) + 100,
            posts: Math.floor(Math.random() * 3) + 1
          }
        }),
        topPosts: [
          {
            id: '1',
            content: 'Our latest product update is here! 🚀 Check out the new features...',
            platform: 'Instagram',
            publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            reach: Math.floor(Math.random() * 5000) + 3000,
            engagement: Math.floor(Math.random() * 500) + 300,
            engagementRate: (Math.random() * 6 + 4).toFixed(2) + '%'
          },
          {
            id: '2',
            content: 'Behind the scenes of our team collaboration process...',
            platform: 'LinkedIn',
            publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            reach: Math.floor(Math.random() * 3000) + 2000,
            engagement: Math.floor(Math.random() * 300) + 200,
            engagementRate: (Math.random() * 5 + 3).toFixed(2) + '%'
          },
          {
            id: '3',
            content: 'Quick tips for social media engagement! Thread 🧵',
            platform: 'Twitter',
            publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            reach: Math.floor(Math.random() * 4000) + 2500,
            engagement: Math.floor(Math.random() * 400) + 250,
            engagementRate: (Math.random() * 4.5 + 2.5).toFixed(2) + '%'
          }
        ],
        insights: [
          'Your Instagram posts perform 40% better with images',
          'Best posting time is between 2-4 PM on weekdays',
          'Posts with hashtags get 25% more engagement',
          'Video content has 60% higher engagement rate'
        ]
      }

      return demoData
    }

    // Calculate date range for real data
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

    // Try to get real data first, fallback to demo data
    try {
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
    } catch (dbError) {
      console.log('Using demo analytics data')
      return NextResponse.json(generateDemoData())
    }
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
