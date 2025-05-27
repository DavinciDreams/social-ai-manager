import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    const { id: teamId } = await params;
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }    // Check if user has permission to invite (OWNER or ADMIN)
    const userMembership = await prisma.teamMembership.findFirst({
      where: {
        teamId,
        userId: user.id,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!userMembership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find or create the invited user
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      // Create a placeholder user that will be activated when they sign up
      invitedUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0], // Use email prefix as temporary name
        },
      });
    }

    // Check if user is already a member
    const existingMembership = await prisma.teamMembership.findFirst({
      where: {
        teamId,
        userId: invitedUser.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }

    // Add user to team
    await prisma.teamMembership.create({
      data: {
        teamId,
        userId: invitedUser.id,
        role,
      },
    });

    // Get updated team with members
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // TODO: Send invitation email
    
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Team invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}