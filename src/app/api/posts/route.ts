import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Platform = 'TWITTER' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'YOUTUBE'
type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as PostStatus | null
    const platform = searchParams.get('platform') as Platform | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
      ...(status && { status }),
      ...(platform && { platform }),
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          account: {
            select: {
              platform: true,
              username: true,
              displayName: true,
            },
          },
          analytics: {
            select: {
              impressions: true,
              engagements: true,
              likes: true,
              shares: true,
              comments: true,
              clicks: true,
              reach: true,
              engagementRate: true,
            },
            orderBy: { recordedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
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
    const {
      content,
      mediaUrls = [],
      hashtags = [],
      scheduledAt,
      accountIds,
      aiGenerated = false,
    } = body

    // Validate required fields
    if (!content || !accountIds || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'Content and at least one account are required' },
        { status: 400 }
      )
    }

    // Verify user owns the social accounts
    const accounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: accountIds },
        userId: session.user.id,
        isActive: true,
      },
    })

    if (accounts.length !== accountIds.length) {
      return NextResponse.json(
        { error: 'Invalid or inactive social accounts' },
        { status: 400 }
      )
    }

    // Create posts for each account
    const posts = await Promise.all(
      accounts.map(async (account: any) => {
        const status: PostStatus = scheduledAt 
          ? 'SCHEDULED' 
          : 'DRAFT'

        return prisma.post.create({
          data: {
            userId: session.user.id,
            accountId: account.id,
            content,
            mediaUrls,
            hashtags,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status,
            platform: account.platform,
            aiGenerated,
          },
          include: {
            account: {
              select: {
                platform: true,
                username: true,
                displayName: true,
              },
            },
          },
        })
      })
    )

    return NextResponse.json({ posts }, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create posts' },
      { status: 500 }
    )
  }
}
