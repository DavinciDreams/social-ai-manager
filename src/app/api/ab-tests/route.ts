import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JsonValue } from '@prisma/client/runtime/library';

type TestStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

type ABTestWithVariants = {
  id: string
  name: string
  description: string | null
  status: string
  testMetric: string
  variants: Array<{
    id: string
    name: string
    metrics: Array<{ id: string; value: number }>
    post?: { 
      analytics?: Array<{ 
        impressions: number 
        engagements: number 
        clicks: number 
        reach?: number 
      }> 
    }
  }>
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
    const { 
      name, 
      description, 
      variantA, 
      variantB, 
      testMetric = 'ENGAGEMENT_RATE',
      trafficSplit = 50,
      duration = 24, // hours
      targetAudience,
      accountId, // Social account to post to
      platform
    } = body

    if (!name || !variantA || !variantB || !accountId || !platform) {
      return NextResponse.json(
        { error: 'Name, variant A, variant B, account ID, and platform are required' },
        { status: 400 }
      )
    }// Create A/B test
    interface VariantInput {
        content: string;
        mediaUrls?: string[];
        hashtags?: string[];
        scheduledAt?: string | Date | null;
    }    interface ABTestTransactionResult {
        id: string;
        userId: string;
        name: string;
        description: string | null;
        testMetric: string;
        trafficSplit: number;
        duration: number;
        targetAudience: JsonValue | null;
        platforms: string[];
        status: string;
        startDate: Date | null;
        endDate: Date | null;
    }    interface ABTestRecord {
        id: string;
        userId: string;
        name: string;
        description: string | null;
        testMetric: string;
        trafficSplit: number;
        duration: number;
        targetAudience: JsonValue | null;
        platforms: string[];
        status: string;
        startDate: Date | null;
        endDate: Date | null;
    }

    interface PostRecord {
        id: string;
        userId: string;
        accountId: string;
        content: string;
        mediaUrls: string[];
        hashtags: string[];
        platform: string;
        scheduledAt: Date | null;
        status: string;
    }

    interface ABTestVariantData {
        testId: string;
        name: string;
        postId: string;
        trafficPercentage: number;
    }

    const abTest: ABTestTransactionResult = await prisma.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient): Promise<ABTestTransactionResult> => {
        // Create the A/B test record
        const test: ABTestRecord = await tx.aBTest.create({
            data: {
                userId: user.id,
                name,
                description: description || '',
                testMetric,
                trafficSplit,
                duration,
                targetAudience: targetAudience || {},
                platforms: [platform],
                status: 'DRAFT',
                startDate: null,
                endDate: null,
            },
        });

        // Create variant A post
        const postA: PostRecord = await tx.post.create({
            data: {
                userId: user.id,
                accountId: accountId,
                content: (variantA as VariantInput).content,
                mediaUrls: (variantA as VariantInput).mediaUrls || [],
                hashtags: (variantA as VariantInput).hashtags || [],
                platform: platform,
                scheduledAt: (variantA as VariantInput).scheduledAt ? new Date((variantA as VariantInput).scheduledAt as string) : null,
                status: 'DRAFT',
            },
        });

        // Create variant B post
        const postB: PostRecord = await tx.post.create({
            data: {
                userId: user.id,
                accountId: accountId,
                content: (variantB as VariantInput).content,
                mediaUrls: (variantB as VariantInput).mediaUrls || [],
                hashtags: (variantB as VariantInput).hashtags || [],
                platform: platform,
                scheduledAt: (variantB as VariantInput).scheduledAt ? new Date((variantB as VariantInput).scheduledAt as string) : null,
                status: 'DRAFT',
            },
        });

        // Create test variants
        const variantsData: ABTestVariantData[] = [
            {
                testId: test.id,
                name: 'Variant A',
                postId: postA.id,
                trafficPercentage: trafficSplit,
            },
            {
                testId: test.id,
                name: 'Variant B',
                postId: postB.id,
                trafficPercentage: 100 - trafficSplit,
            },
        ];

        await tx.aBTestVariant.createMany({
            data: variantsData,
        });

        return test;
    });

    // Fetch the complete test with variants
    const completeTest = await prisma.aBTest.findUnique({
      where: { id: abTest.id },
      include: {
        variants: {
          include: {
            post: true,
          },
        },
      },
    })

    return NextResponse.json(completeTest)
  } catch (error) {
    console.error('Error creating A/B test:', error)
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    )
  }
}

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
    }    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where = {
      userId: user.id,
      ...(status ? { status: status as TestStatus } : {}),
    }

    const [tests, total] = await Promise.all([
      prisma.aBTest.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aBTest.count({ where }),
    ])    // Calculate test results for each test
    const testsWithResults = tests.map((test: any) => ({
      ...test,
      results: calculateTestResults(test),
    }))

    return NextResponse.json({
      tests: testsWithResults,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching A/B tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch A/B tests' },
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
  const analyticsA = variantA.post?.analytics?.[0]
  const analyticsB = variantB.post?.analytics?.[0]

  if (!analyticsA || !analyticsB) {
    return {
      status: 'INSUFFICIENT_DATA',
      message: 'Not enough data to determine winner',
    }
  }

  let metricA: number
  let metricB: number

  switch (test.testMetric) {    case 'ENGAGEMENT_RATE':
      metricA = analyticsA.impressions > 0 ? (analyticsA.engagements / analyticsA.impressions) * 100 : 0
      metricB = analyticsB.impressions > 0 ? (analyticsB.engagements / analyticsB.impressions) * 100 : 0
      break
    case 'CLICK_THROUGH_RATE':
      metricA = analyticsA.impressions > 0 ? (analyticsA.clicks / analyticsA.impressions) * 100 : 0
      metricB = analyticsB.impressions > 0 ? (analyticsB.clicks / analyticsB.impressions) * 100 : 0
      break
    case 'REACH':
      metricA = analyticsA.reach || 0
      metricB = analyticsB.reach || 0
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

function calculateStatisticalSignificance(
  analyticsA: { impressions: number; engagements: number; clicks: number; reach?: number }, 
  analyticsB: { impressions: number; engagements: number; clicks: number; reach?: number }
): string {
  // Simplified statistical significance calculation
  // In a real implementation, you'd use proper statistical tests
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
