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

    const test = await prisma.aBTest.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        variants: {
          include: {
            post: {
              include: {
                analytics: true,
              },
            },
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
    }

    // Calculate results
    const results = calculateTestResults(test)

    return NextResponse.json({
      ...test,
      results,
    })
  } catch (error) {
    console.error('Error fetching A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch A/B test' },
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
    const { action, ...updateData } = body

    const { id } = await params

    const test = await prisma.aBTest.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        variants: {
          include: {
            post: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
    }

    let updatedTest: any

    if (action === 'start') {
      // Start the A/B test
      if (test.status !== 'DRAFT') {
        return NextResponse.json(
          { error: 'Test can only be started from draft status' },
          { status: 400 }
        )
      }      const now = new Date()
      const endDate = new Date(now.getTime() + test.duration * 60 * 60 * 1000)

      updatedTest = await prisma.aBTest.update({
        where: { id: id },
        data: {
          status: 'RUNNING',
          startDate: now,
          endDate,
        },
        include: {
          variants: {
            include: {
              post: true,
            },
          },
        },
      })      // Update variant posts to scheduled/published status
      for (const variant of test.variants) {
        if (variant.postId) {
          await prisma.post.update({
            where: { id: variant.postId },
            data: { status: 'SCHEDULED' },
          })
        }
      }

    } else if (action === 'stop') {
      // Stop the A/B test
      if (test.status !== 'RUNNING') {
        return NextResponse.json(
          { error: 'Test can only be stopped when running' },
          { status: 400 }
        )
      }      updatedTest = await prisma.aBTest.update({
        where: { id: id },
        data: {
          status: 'COMPLETED',
          endDate: new Date(),
        },
        include: {
          variants: {
            include: {
              post: {
                include: {
                  analytics: true,
                },
              },
            },
          },
        },
      })

    } else if (action === 'pause') {
      // Pause the A/B test
      if (test.status !== 'RUNNING') {
        return NextResponse.json(
          { error: 'Test can only be paused when running' },
          { status: 400 }
        )
      }      updatedTest = await prisma.aBTest.update({
        where: { id: id },
        data: { status: 'PAUSED' },
        include: {
          variants: {
            include: {
              post: true,
            },
          },
        },
      })

    } else if (action === 'resume') {
      // Resume the A/B test
      if (test.status !== 'PAUSED') {
        return NextResponse.json(
          { error: 'Test can only be resumed when paused' },
          { status: 400 }
        )
      }      updatedTest = await prisma.aBTest.update({
        where: { id: id },
        data: { status: 'RUNNING' },
        include: {
          variants: {
            include: {
              post: true,
            },
          },
        },
      })

    } else {      // Regular update
      updatedTest = await prisma.aBTest.update({
        where: { id: id },
        data: updateData,
        include: {
          variants: {
            include: {
              post: true,
            },
          },
        },
      })
    }

    const results = calculateTestResults(updatedTest)

    return NextResponse.json({
      ...updatedTest,
      results,
    })
  } catch (error) {
    console.error('Error updating A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to update A/B test' },
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
    }

    const { id } = await params

    const test = await prisma.aBTest.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
      include: {
        variants: true,
      },
    })

    if (!test) {
      return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
    }

    if (test.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Cannot delete a running test. Stop it first.' },
        { status: 400 }
      )
    }

    // Delete test and related data
    await prisma.$transaction(async (tx: any) => {
      // Delete variants
      await tx.aBTestVariant.deleteMany({
        where: { testId: test.id },
      })

      // Delete associated posts (optional - you might want to keep them)
      for (const variant of test.variants) {
        await tx.post.delete({
          where: { id: variant.postId },
        })
      }

      // Delete the test
      await tx.aBTest.delete({
        where: { id: test.id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to delete A/B test' },
      { status: 500 }
    )
  }
}

function calculateTestResults(test: any) {
  if (!test.variants || test.variants.length < 2) {
    return null
  }

  const variantA = test.variants[0]
  const variantB = test.variants[1]

  const analyticsA = variantA.post.analytics?.[0]
  const analyticsB = variantB.post.analytics?.[0]

  if (!analyticsA || !analyticsB) {
    return {
      status: 'INSUFFICIENT_DATA',
      message: 'Not enough data to determine winner',
    }
  }

  let metricA: number
  let metricB: number

  switch (test.testMetric) {
    case 'ENGAGEMENT_RATE':
      metricA = analyticsA.impressions > 0 ? (analyticsA.engagements / analyticsA.impressions) * 100 : 0
      metricB = analyticsB.impressions > 0 ? (analyticsB.engagements / analyticsB.impressions) * 100 : 0
      break
    case 'CLICK_THROUGH_RATE':
      metricA = analyticsA.impressions > 0 ? (analyticsA.clicks / analyticsA.impressions) * 100 : 0
      metricB = analyticsB.impressions > 0 ? (analyticsB.clicks / analyticsB.impressions) * 100 : 0
      break
    case 'REACH':
      metricA = analyticsA.reach
      metricB = analyticsB.reach
      break
    default:
      metricA = analyticsA.engagements
      metricB = analyticsB.engagements
  }

  const winner = metricA > metricB ? 'A' : metricB > metricA ? 'B' : 'TIE'
  const improvement = winner !== 'TIE' ? Math.abs(((metricA - metricB) / Math.max(metricA, metricB)) * 100) : 0

  return {
    status: 'COMPLETED',
    winner,
    improvement: improvement.toFixed(2),
    variantAMetric: metricA.toFixed(2),
    variantBMetric: metricB.toFixed(2),
    metricName: test.testMetric,
    confidence: calculateStatisticalSignificance(analyticsA, analyticsB),
  }
}

function calculateStatisticalSignificance(analyticsA: any, analyticsB: any): string {
  const sampleSizeA = analyticsA.impressions
  const sampleSizeB = analyticsB.impressions
  
  if (sampleSizeA < 100 || sampleSizeB < 100) {
    return 'LOW'
  } else if (sampleSizeA < 1000 || sampleSizeB < 1000) {
    return 'MEDIUM'
  } else {
    return 'HIGH'
  }
}
