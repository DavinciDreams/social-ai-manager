import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// import { MediaType } from '@prisma/client'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const sortBy = searchParams.get('sortBy') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []

    const where = {
      userId: user.id,
      ...(type && type !== 'all' ? { type: type.toUpperCase() } : {}),
      ...(tags.length > 0 ? { tags: { hasSome: tags } } : {}),
    }

    let orderBy: any = { createdAt: 'desc' }
    
    if (sortBy === 'usage') {
      // For sorting by usage, we'll need to join with posts and count usage
      orderBy = { createdAt: 'desc' } // Default for now
    } else if (sortBy === 'performance') {
      orderBy = { createdAt: 'desc' } // Default for now
    }    const [items, total] = await Promise.all([
      prisma.contentLibrary.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentLibrary.count({ where }),
    ])    // Transform items to include usage analytics
    const transformedItems = items.map((item: any) => ({
      ...item,
      usage: {
        totalUses: 0, // This would need to be calculated separately
        platforms: [], // We could fetch this from related posts
        lastUsed: null, // We could get this from the latest post using this content
      },
      analytics: {
        totalImpressions: 0, // Would be calculated from post analytics
        totalEngagements: 0,
        avgEngagementRate: 0,
      },
    }))

    return NextResponse.json({
      items: transformedItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching content library:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    }    const body = await request.json()
    const { title, content, type, mediaUrl, tags = [], thumbnailUrl, fileSize, dimensions, category } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }    const contentItem = await prisma.contentLibrary.create({
      data: {
        userId: user.id,
        title: title,
        content: content || '',
        mediaUrl: mediaUrl || '',
        mediaType: type ? type.toUpperCase() : undefined,
        tags,
        category: category || '',
        isTemplate: false,
      },
    })

    return NextResponse.json(contentItem)
  } catch (error) {
    console.error('Error creating content item:', error)
    return NextResponse.json(
      { error: 'Failed to create content item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'No content IDs provided' },
        { status: 400 }
      )
    }

    // Verify all content items belong to the user
    const contentItems = await prisma.contentLibrary.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    })

    if (contentItems.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some content items not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete the content items
    await prisma.contentLibrary.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true, deletedCount: contentItems.length })
  } catch (error) {
    console.error('Error deleting content items:', error)
    return NextResponse.json(
      { error: 'Failed to delete content items' },
      { status: 500 }
    )
  }
}
