import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishToSocialMedia } from '@/lib/social-media-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the post with account information
    const post = await prisma.post.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        account: true,
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Post is already published' },
        { status: 400 }
      )
    }

    if (!post.account.isActive) {
      return NextResponse.json(
        { error: 'Social account is not active' },
        { status: 400 }
      )
    }

    try {      // Attempt to publish to the social media platform
      const publishResult = await publishToSocialMedia({
        platform: post.platform,
        platformAccountId: post.account.id,
        accessToken: post.account.accessToken,
        content: post.content,
        mediaUrls: post.mediaUrls,
      })

      // Update post status to published
      const updatedPost = await prisma.post.update({
        where: { id: id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          updatedAt: new Date(),
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

      // Create initial analytics record
      await prisma.postAnalytics.create({
        data: {
          postId: post.id,
          impressions: 0,
          engagements: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          clicks: 0,
          reach: 0,
          engagementRate: 0,
        },
      })

      return NextResponse.json({
        post: updatedPost,
        publishResult,
        message: 'Post published successfully',
      })
    } catch (publishError) {
      console.error('Social media publish error:', publishError)

      // Update post status to failed
      await prisma.post.update({
        where: { id: id },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      })

      return NextResponse.json(
        { error: 'Failed to publish to social media platform' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Post publish error:', error)
    return NextResponse.json(
      { error: 'Failed to publish post' },
      { status: 500 }
    )
  }
}
