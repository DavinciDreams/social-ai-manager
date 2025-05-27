import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Define MediaType enum to match your Prisma schema
enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const tags = JSON.parse(formData.get('tags') as string || '[]');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Determine content type
    const contentType = getContentTypeFromMime(file.type);
    
    // For demo purposes, we'll use a placeholder URL
    // In production, you would upload to AWS S3, Cloudinary, or similar
    const url = `https://placeholder.example.com/${file.name}`;    // Save to database
    const contentItem = await prisma.contentLibrary.create({
      data: {
        userId: user.id,
        title: name || file.name,
        mediaType: contentType.toUpperCase() as MediaType,
        mediaUrl: url,
        content: description || '',
        tags,
        category: '',
        isTemplate: false,
      },
    });

    return NextResponse.json(contentItem);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const tags = searchParams.get('tags')?.split(',') || [];
    const search = searchParams.get('search') || '';

    const where: any = {
      userId: user.id,
    };    if (type && type !== 'all') {
      where.mediaType = type.toUpperCase() as MediaType;
    }

    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contentItems = await prisma.contentLibrary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contentItems);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }    // Verify ownership
    const contentItem = await prisma.contentLibrary.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!contentItem) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Delete from database
    await prisma.contentLibrary.delete({
      where: { id },
    });

    // TODO: Delete from storage (AWS S3, Cloudinary, etc.)
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

function getContentTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return MediaType.IMAGE;
  if (mimeType.startsWith('video/')) return MediaType.VIDEO;
  if (mimeType.startsWith('audio/')) return MediaType.DOCUMENT;
  return MediaType.DOCUMENT;
}
