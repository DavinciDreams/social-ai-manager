import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: accountId } = await params;

    // Verify ownership
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!socialAccount) {
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
    }

    // Delete the account
    await prisma.socialAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Social account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete social account' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: accountId } = await params;
    const updates = await request.json();

    // Verify ownership
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!socialAccount) {
      return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
    }

    // Update the account
    const updatedAccount = await prisma.socialAccount.update({
      where: { id: accountId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Social account update error:', error);
    return NextResponse.json(
      { error: 'Failed to update social account' },
      { status: 500 }
    );
  }
}
