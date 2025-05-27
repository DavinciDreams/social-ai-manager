import { PrismaClient } from '@prisma/client'
import { publishToSocialMedia } from './social-media-service'

const prisma = new PrismaClient()

export class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running')
      return
    }

    this.isRunning = true
    console.log('Starting post scheduler...')
    
    // Check for scheduled posts every minute
    this.intervalId = setInterval(() => {
      this.processScheduledPosts()
    }, 60000) // 1 minute

    // Process immediately on start
    this.processScheduledPosts()
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Post scheduler stopped')
  }

  private async processScheduledPosts() {
    try {
      const now = new Date()
      
      // Find posts scheduled for publishing
      const scheduledPosts = await prisma.post.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            lte: now,
          },
        },        include: {
          account: true,
        },
        take: 10, // Process up to 10 posts at a time
      })

      if (scheduledPosts.length === 0) {
        return
      }

      console.log(`Processing ${scheduledPosts.length} scheduled posts`)

      for (const post of scheduledPosts) {
        try {
          // Mark as processing to avoid duplicate processing
          await prisma.post.update({
            where: { id: post.id },
            data: { status: 'SCHEDULED' }
          })

          // Publish to social media platform
          const publishResult = await publishToSocialMedia({
            platform: post.platform,
            content: post.content,            mediaUrls: post.mediaUrls,
            platformAccountId: post.account.id,
            accessToken: post.account.accessToken,
          })

          if (publishResult.success) {
            // Update post as published
            await prisma.post.update({
              where: { id: post.id },              data: {
                status: 'PUBLISHED',
                publishedAt: now,
              }
            })

            console.log(`Successfully published post ${post.id} to ${post.platform}`)
          } else {
            // Mark as failed
            await prisma.post.update({
              where: { id: post.id },              data: {
                status: 'FAILED',
              }
            })

            console.error(`Failed to publish post ${post.id}:`, publishResult.error)
          }
        } catch (error) {
          // Mark as failed
          await prisma.post.update({
            where: { id: post.id },            data: {
              status: 'FAILED',
            }
          })

          console.error(`Error processing post ${post.id}:`, error)
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
          status: 'SCHEDULED',
          scheduledAt,
        }
      })

      console.log(`Post ${postId} scheduled for ${scheduledAt}`)
      return { success: true }
    } catch (error) {
      console.error('Error scheduling post:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async cancelScheduledPost(postId: string) {
    try {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'DRAFT',
          scheduledAt: null,
        }
      })

      console.log(`Cancelled scheduled post ${postId}`)
      return { success: true }
    } catch (error) {
      console.error('Error cancelling scheduled post:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.intervalId ? 'In 1 minute' : 'Not scheduled',
    }
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService()

// Auto-start the scheduler in production
if (process.env.NODE_ENV === 'production') {
  schedulerService.start()
}
