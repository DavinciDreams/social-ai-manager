import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get user's social accounts
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(socialAccounts);
  } catch (error) {
    console.error('Social accounts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social accounts' },
      { status: 500 }
    );
  }
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
    }    const { platform, username, accessToken, refreshToken, expiresAt, displayName, avatar } = await request.json();

    if (!platform || !username || !accessToken) {
      return NextResponse.json({ 
        error: 'Platform, username, and accessToken are required' 
      }, { status: 400 });
    }

    // Check if account already exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: user.id,
        platform,
        username,
      },
    });

    if (existingAccount) {
      // Update existing account
      const updatedAccount = await prisma.socialAccount.update({
        where: { id: existingAccount.id },        data: {
          username,
          displayName,
          avatar,
          accessToken,
          refreshToken,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updatedAccount);
    } else {      // Create new account
      const newAccount = await prisma.socialAccount.create({
        data: {
          userId: user.id,
          platform,
          username,
          displayName,
          avatar,
          accessToken,
          refreshToken,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      });
      return NextResponse.json(newAccount);
    }
  } catch (error) {
    console.error('Social account creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create social account' },
      { status: 500 }
    );
  }
}
