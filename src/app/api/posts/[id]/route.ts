import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.post.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        account: {
          select: {
            platform: true,
            username: true,
            displayName: true,
          },
        },
        analytics: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Post fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      content,
      mediaUrls,
      hashtags,
      scheduledAt,
      status,
    } = body

    const { id } = await params

    // Verify user owns the post
    const existingPost = await prisma.post.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Don't allow editing published posts
    if (existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot edit published posts' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (mediaUrls !== undefined) updateData.mediaUrls = mediaUrls
    if (hashtags !== undefined) updateData.hashtags = hashtags
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    }
    if (status !== undefined) updateData.status = status

    const updatedPost = await prisma.post.update({
      where: { id: id },
      data: {
        ...updateData,
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

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('Post update error:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify user owns the post
    const existingPost = await prisma.post.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await prisma.post.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Post deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
