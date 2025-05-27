import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
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
    const { action } = body // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (accept/decline) is required' },
        { status: 400 }
      )
    }    // Find the invitation
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        token: token,
        email: user.email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: { team: true },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    if (action === 'accept') {
      // Check if user is already a member
      const existingMember = await prisma.teamMembership.findFirst({
        where: {
          teamId: invitation.teamId,
          userId: user.id,
        },
      })

      if (existingMember) {
        // Update invitation status and return
        await prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        })

        return NextResponse.json({
          success: true,
          message: 'Already a member of this team',
          team: invitation.team,
        })
      }

      // Create team membership and update invitation
      await prisma.$transaction([
        prisma.teamMembership.create({
          data: {
            teamId: invitation.teamId,
            userId: user.id,
            role: invitation.role,
          },
        }),
        prisma.teamInvitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: `Successfully joined ${invitation.team.name}`,
        team: invitation.team,
      })
    } else {
      // Decline invitation
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'DECLINED' },
      })

      return NextResponse.json({
        success: true,
        message: 'Invitation declined',
      })
    }
  } catch (error) {
    console.error('Error processing team invitation:', error)
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {    const { token } = await params
    // Get invitation details for preview (no auth required)
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        token: token,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          select: {
            name: true,
            description: true,
          },
        },        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      team: invitation.team,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
    })
  } catch (error) {
    console.error('Error fetching invitation details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation details' },
      { status: 500 }
    )
  }
}
