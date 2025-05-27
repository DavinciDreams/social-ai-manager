import { prisma } from './prisma'
import { publishToSocialMedia } from './social-media-service'

export class PostSchedulerService {
  async processScheduledPosts() {
    try {
      // Find all posts that are scheduled and ready to be published
      const now = new Date()
      const scheduledPosts = await prisma.post.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: now,
          },
        },
        include: {
          account: true,
        },
      })

      console.log(`Found ${scheduledPosts.length} posts ready for publishing`)

      for (const post of scheduledPosts) {
        try {          // Attempt to publish the post
          const publishResult = await publishToSocialMedia({
            platform: post.platform,
            platformAccountId: post.account.id,
            accessToken: post.account.accessToken,
            content: post.content,
            mediaUrls: post.mediaUrls,
          })

          if (publishResult.success) {
            // Update post status to published
            await prisma.post.update({
              where: { id: post.id },
              data: {
                status: 'PUBLISHED',
                publishedAt: now,
                updatedAt: now,
              },
            })

            // Create initial analytics record
            await prisma.postAnalytics.create({
              data: {
                postId: post.id,
                impressions: 0,
                engagements: 0,
                likes: 0,
                shares: 0,
                comments: 0,
                clicks: 0,
                reach: 0,
                engagementRate: 0,
              },
            })

            console.log(`Successfully published post ${post.id} to ${post.platform}`)
          } else {
            // Mark post as failed
            await prisma.post.update({
              where: { id: post.id },
              data: {
                status: 'FAILED',
                updatedAt: now,
              },
            })

            console.error(`Failed to publish post ${post.id}:`, publishResult.error)
          }
        } catch (error) {
          console.error(`Error processing post ${post.id}:`, error)
          
          // Mark post as failed
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'FAILED',
              updatedAt: now,
            },
          })
        }
      }
    } catch (error) {
      console.error('Error in processScheduledPosts:', error)
    }
  }

  async schedulePost(postId: string, scheduledAt: Date) {
    try {
      await prisma.post.update({
        where: { id: postId },
        data: {
          scheduledAt,
          status: 'SCHEDULED',
          updatedAt: new Date(),
        },
      })
      
      console.log(`Post ${postId} scheduled for ${scheduledAt}`)
    } catch (error) {
      console.error(`Error scheduling post ${postId}:`, error)
      throw error
    }
  }

  async cancelScheduledPost(postId: string) {
    try {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'DRAFT',
          scheduledAt: null,
          updatedAt: new Date(),
        },
      })
      
      console.log(`Cancelled scheduled post ${postId}`)
    } catch (error) {
      console.error(`Error cancelling scheduled post ${postId}:`, error)
      throw error
    }
  }

  async getUpcomingScheduledPosts(userId: string, limit: number = 10) {
    try {
      const posts = await prisma.post.findMany({
        where: {
          userId,
          status: 'SCHEDULED',
          scheduledAt: {
            gt: new Date(),
          },
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
        orderBy: {
          scheduledAt: 'asc',
        },
        take: limit,
      })

      return posts
    } catch (error) {
      console.error('Error fetching upcoming scheduled posts:', error)
      throw error
    }
  }
}

export const postSchedulerService = new PostSchedulerService()

// Function to start the scheduler (would typically be called in a cron job or background worker)
export function startPostScheduler() {
  // Run every minute
  setInterval(async () => {
    await postSchedulerService.processScheduledPosts()
  }, 60000) // 60 seconds

  console.log('Post scheduler started')
}
