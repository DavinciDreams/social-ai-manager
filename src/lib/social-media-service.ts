import axios from 'axios'

export interface SocialMediaPost {
  content: string
  mediaUrls?: string[]
  scheduledAt?: Date
}

export interface PostResult {
  success: boolean
  platformPostId?: string
  postId?: string
  url?: string
  error?: string
}

export interface AnalyticsData {
  impressions: number
  engagements: number
  likes: number
  shares: number
  comments: number
  clicks: number
  reach: number
}

export class SocialMediaService {
  async postToTwitter(accessToken: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        {
          text: post.content,
          ...(post.mediaUrls && { media: { media_ids: post.mediaUrls } }),
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        success: true,
        platformPostId: response.data.data.id,
        postId: response.data.data.id,
        url: `https://twitter.com/${response.data.data.author_id}/status/${response.data.data.id}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to post to Twitter',
      }
    }
  }

  async postToInstagram(accessToken: string, userId: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      // Instagram requires media for posts
      if (!post.mediaUrls || post.mediaUrls.length === 0) {
        return {
          success: false,
          error: 'Instagram posts require media',
        }
      }

      // Create media container
      const mediaResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${userId}/media`,
        {
          image_url: post.mediaUrls[0],
          caption: post.content,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const creationId = mediaResponse.data.id

      // Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${userId}/media_publish`,
        {
          creation_id: creationId,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      return {
        success: true,
        platformPostId: publishResponse.data.id,
        postId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}/`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to Instagram',
      }
    }
  }

  async postToFacebook(accessToken: string, pageId: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          message: post.content,
          ...(post.mediaUrls && { link: post.mediaUrls[0] }),
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      return {
        success: true,
        platformPostId: response.data.id,
        postId: response.data.id,
        url: `https://facebook.com/${pageId}/posts/${response.data.id}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to post to Facebook',
      }
    }
  }

  async postToLinkedIn(accessToken: string, userId: string, post: SocialMediaPost): Promise<PostResult> {
    try {
      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: `urn:li:person:${userId}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: post.content,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      )

      return {
        success: true,
        platformPostId: response.headers['x-restli-id'],
        postId: response.headers['x-restli-id'],
        url: `https://linkedin.com/feed/update/urn:li:share:${response.headers['x-restli-id']}/`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to post to LinkedIn',
      }
    }
  }

  async getTwitterAnalytics(accessToken: string, tweetId: string): Promise<AnalyticsData> {
    try {
      const response = await axios.get(
        `https://api.twitter.com/2/tweets/${tweetId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            'tweet.fields': 'public_metrics',
          },
        }
      )

      const metrics = response.data.data.public_metrics

      return {
        impressions: metrics.impression_count || 0,
        engagements: metrics.like_count + metrics.retweet_count + metrics.reply_count,
        likes: metrics.like_count || 0,
        shares: metrics.retweet_count || 0,
        comments: metrics.reply_count || 0,
        clicks: 0, // Not available in basic API
        reach: metrics.impression_count || 0,
      }
    } catch (error) {
      console.error('Error fetching Twitter analytics:', error)
      throw new Error('Failed to fetch Twitter analytics')
    }
  }

  async getInstagramAnalytics(accessToken: string, mediaId: string): Promise<AnalyticsData> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaId}/insights`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          params: {
            metric: 'impressions,reach,likes,comments,shares,saved',
          },
        }
      )

      const data = response.data.data
      const metrics: { [key: string]: number } = {}

      data.forEach((metric: any) => {
        metrics[metric.name] = metric.values[0]?.value || 0
      })

      return {
        impressions: metrics.impressions || 0,
        engagements: (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0),
        likes: metrics.likes || 0,
        shares: metrics.shares || 0,
        comments: metrics.comments || 0,
        clicks: 0,
        reach: metrics.reach || 0,
      }
    } catch (error) {
      console.error('Error fetching Instagram analytics:', error)
      throw new Error('Failed to fetch Instagram analytics')
    }
  }

  async validateAccessToken(platform: string, accessToken: string): Promise<boolean> {
    try {
      switch (platform) {
        case 'TWITTER':
          await axios.get('https://api.twitter.com/2/users/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          })
          return true
        case 'INSTAGRAM':
        case 'FACEBOOK':
          await axios.get('https://graph.facebook.com/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          })
          return true
        case 'LINKEDIN':
          await axios.get('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          })
          return true
        default:
          return false
      }
    } catch (error) {
      return false
    }
  }
}

export const socialMediaService = new SocialMediaService()

export interface PublishToSocialMediaParams {
  platform: string
  content: string
  mediaUrls?: string[]
  platformAccountId: string
  accessToken: string
}

export async function publishToSocialMedia(params: PublishToSocialMediaParams): Promise<PostResult> {
  const service = new SocialMediaService()
  
  const post: SocialMediaPost = {
    content: params.content,
    mediaUrls: params.mediaUrls,
  }

  let result: PostResult
  switch (params.platform) {
    case 'TWITTER':
      result = await service.postToTwitter(params.accessToken, post)
      break
    case 'INSTAGRAM':
      result = await service.postToInstagram(params.accessToken, params.platformAccountId, post)
      break
    case 'FACEBOOK':
      result = await service.postToFacebook(params.accessToken, params.platformAccountId, post)
      break
    case 'LINKEDIN':
      result = await service.postToLinkedIn(params.accessToken, params.platformAccountId, post)
      break
    default:
      throw new Error(`Unsupported platform: ${params.platform}`)
  }

  // Add generated URL and postId if successful
  if (result.success && result.platformPostId) {
    result.postId = result.platformPostId
    result.url = generatePlatformUrl(params.platform, params.platformAccountId, result.platformPostId)
  }

  return result
}

function generatePlatformUrl(platform: string, accountId: string, postId: string): string {
  switch (platform) {
    case 'TWITTER':
      return `https://twitter.com/${accountId}/status/${postId}`
    case 'INSTAGRAM':
      return `https://instagram.com/p/${postId}/`
    case 'FACEBOOK':
      return `https://facebook.com/${accountId}/posts/${postId}`
    case 'LINKEDIN':
      return `https://linkedin.com/feed/update/urn:li:share:${postId}/`
    default:
      return ''
  }
}
