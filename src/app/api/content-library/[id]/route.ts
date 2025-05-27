import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    const contentItem = await prisma.contentLibrary.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!contentItem) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    // Add usage and analytics data
    const itemWithAnalytics = {
      ...contentItem,
      usage: {
        totalUses: 0, // This would need to be calculated separately if needed
        platforms: [], // Would be fetched from related posts
        lastUsed: null,
      },
      analytics: {
        totalImpressions: 0,
        totalEngagements: 0,
        avgEngagementRate: 0,
      },
    }

    return NextResponse.json(itemWithAnalytics)
  } catch (error) {
    console.error('Error fetching content item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content item' },
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, tags, mediaType, category } = body

    const { id } = await params

    const contentItem = await prisma.contentLibrary.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!contentItem) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }    const updatedItem = await prisma.contentLibrary.update({
      where: { id: id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(tags && { tags }),
        ...(mediaType && { mediaType: mediaType.toUpperCase() }),
        ...(category && { category }),
      },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating content item:', error)
    return NextResponse.json(
      { error: 'Failed to update content item' },
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }    const { id } = await params

    const contentItem = await prisma.contentLibrary.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    })

    if (!contentItem) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    await prisma.contentLibrary.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting content item:', error)
    return NextResponse.json(
      { error: 'Failed to delete content item' },
      { status: 500 }
    )
  }
}
