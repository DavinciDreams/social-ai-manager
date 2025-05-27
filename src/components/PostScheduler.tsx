'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, ClockIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'

interface ScheduledPost {
  id: string
  content: string
  platform: string
  scheduledAt: string
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
  account: {
    platform: string
    username: string
    displayName: string
  }
  mediaUrls?: string[]
  hashtags?: string[]
}

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated: () => void
}

export default function PostScheduler() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchScheduledPosts()
    }
  }, [session])

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/posts/schedule?limit=50')
      if (response.ok) {
        const data = await response.json()
        setScheduledPosts(data.upcomingPosts)
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelScheduled = async (postId: string) => {
    try {
      const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          action: 'cancel',
        }),
      })

      if (response.ok) {
        fetchScheduledPosts() // Refresh the list
      }
    } catch (error) {
      console.error('Error cancelling scheduled post:', error)
    }
  }

  const handlePublishNow = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchScheduledPosts() // Refresh the list
      }
    } catch (error) {
      console.error('Error publishing post:', error)
    }
  }

  const platforms = [
    { value: 'TWITTER', label: 'Twitter/X', color: 'bg-blue-500' },
    { value: 'INSTAGRAM', label: 'Instagram', color: 'bg-pink-500' },
    { value: 'FACEBOOK', label: 'Facebook', color: 'bg-blue-600' },
    { value: 'LINKEDIN', label: 'LinkedIn', color: 'bg-blue-700' },
    { value: 'TIKTOK', label: 'TikTok', color: 'bg-black' },
  ]

  const getPlatformInfo = (platform: string) => {
    return platforms.find(p => p.value === platform) || platforms[0]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }
  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledAt)
      return postDate.toDateString() === date.toDateString()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post Scheduler</h1>
          <p className="text-gray-600">Plan and schedule your social media posts</p>
        </div>        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Schedule New Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                ←
              </button>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => {
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
              const isToday = day.toDateString() === new Date().toDateString()
              const postsForDay = getPostsForDate(day)

              return (
                <div
                  key={index}
                  className={`
                    p-2 min-h-[80px] border border-gray-100 cursor-pointer hover:bg-gray-50
                    ${!isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
                    ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                  `}
                >
                  <div className="text-sm font-medium">{day.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {postsForDay.map(post => {
                      const platformInfo = getPlatformInfo(post.platform)
                      return (
                        <div
                          key={post.id}
                          className={`w-full h-2 rounded-sm ${platformInfo.color}`}
                          title={`${platformInfo.label}: ${post.content.substring(0, 50)}...`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scheduled Posts List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Posts</h2>
            <div className="space-y-4">
            {scheduledPosts
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map(post => {
                const platformInfo = getPlatformInfo(post.platform)
                const scheduledDate = new Date(post.scheduledAt)
                
                return (
                  <div key={post.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${platformInfo.color}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {post.account.displayName || post.account.username}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(post.status)}`}>
                          {post.status.toLowerCase()}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handlePublishNow(post.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Publish now"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelScheduled(post.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel scheduled post"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {post.content}
                    </p>

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            #{tag}
                          </span>
                        ))}
                        {post.hashtags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{post.hashtags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {scheduledDate.toLocaleDateString()}
                      <ClockIcon className="h-4 w-4 ml-3 mr-1" />
                      {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )
              })}
            
            {scheduledPosts.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled posts</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first post</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best Times to Post */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">AI-Recommended Post Times</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {platforms.map(platform => (
            <div key={platform.value} className="text-center">
              <div className={`w-12 h-12 rounded-full ${platform.color} mx-auto mb-2 flex items-center justify-center`}>
                <span className="text-white text-xs font-medium">
                  {platform.value.charAt(0)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">{platform.label}</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <div>9:00 AM</div>
                <div>1:00 PM</div>
                <div>5:00 PM</div>
              </div>
            </div>
          ))}        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            setShowCreateModal(false)
            fetchScheduledPosts()
          }}
        />
      )}
    </div>
  )
}

function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [hashtags, setHashtags] = useState('')
  const [socialAccounts, setSocialAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSocialAccounts()
      // Set default scheduled time to 1 hour from now
      const defaultTime = new Date()
      defaultTime.setHours(defaultTime.getHours() + 1)
      setScheduledAt(defaultTime.toISOString().slice(0, 16))
    }
  }, [isOpen])

  const fetchSocialAccounts = async () => {
    try {
      const response = await fetch('/api/social-accounts')
      if (response.ok) {
        const data = await response.json()
        setSocialAccounts(data.accounts)
      }
    } catch (error) {
      console.error('Error fetching social accounts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || selectedAccounts.length === 0 || !scheduledAt) {
      return
    }

    setLoading(true)
    
    try {
      const hashtagsArray = hashtags
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.substring(1))

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          accountIds: selectedAccounts,
          scheduledAt,
          hashtags: hashtagsArray,
        }),
      })

      if (response.ok) {
        onPostCreated()
        setContent('')
        setScheduledAt('')
        setSelectedAccounts([])
        setHashtags('')
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Schedule New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="What's on your mind?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="#hashtag1 #hashtag2 #hashtag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Accounts
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {socialAccounts.map((account) => (
                <label key={account.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAccounts([...selectedAccounts, account.id])
                      } else {
                        setSelectedAccounts(selectedAccounts.filter(id => id !== account.id))
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {account.platform} - {account.displayName || account.username}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim() || selectedAccounts.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
