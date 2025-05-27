import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishToSocialMedia } from '@/lib/social-media-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = await request.json()
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Get the post with account details
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
        userId: session.user.id,
      },      include: {
        account: true,
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.status !== 'DRAFT' && post.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Post cannot be published in its current status' },
        { status: 400 }
      )
    }

    // Publish to social media platform
    try {      const publishResult = await publishToSocialMedia({
        platform: post.platform,
        content: post.content,
        mediaUrls: post.mediaUrls,
        platformAccountId: post.account.id,
        accessToken: post.account.accessToken,
      })

      // Update post status and add platform post ID
      const updatedPost = await prisma.post.update({        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        include: {
          account: {
            select: {
              platform: true,
              username: true,
              displayName: true,
            },
          },
        }
      })

      return NextResponse.json({
        success: true,
        post: updatedPost,
        platformUrl: publishResult.url,
      })
    } catch (publishError) {
      // Update post status to failed
      await prisma.post.update({
        where: { id: postId },        data: {
          status: 'FAILED',
        }
      })

      return NextResponse.json(
        {
          error: 'Failed to publish to social media platform',
          details: publishError instanceof Error ? publishError.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Publish post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
