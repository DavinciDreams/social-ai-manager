'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  EyeIcon, 
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  summary: {
    totalPosts: number
    totalImpressions: number
    totalEngagements: number
    totalLikes: number
    totalShares: number
    totalComments: number
    totalClicks: number
    totalReach: number
    engagementRate: number
    period: string
  }
  platformBreakdown: Array<{
    platform: string
    posts: number
    impressions: number
    engagements: number
    likes: number
    shares: number
    comments: number
    avgEngagementRate: number
  }>
  dailyMetrics: Array<{
    date: string
    posts: number
    impressions: number
    engagements: number
    likes: number
    shares: number
    comments: number
  }>
  topPosts: Array<{
    id: string
    content: string
    platform: string
    account: {
      platform: string
      username: string
      displayName: string
    }
    publishedAt: string
    analytics: {
      impressions: number
      engagements: number
      likes: number
      shares: number
      comments: number
      clicks: number
      reach: number
      engagementRate: number
    }
  }>
}

export default function AnalyticsDashboard() {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
  ]

  const platforms = [
    { value: '', label: 'All Platforms' },
    { value: 'TWITTER', label: 'Twitter/X' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'YOUTUBE', label: 'YouTube' },
  ]
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ period: selectedPeriod })
      if (selectedPlatform) params.append('platform', selectedPlatform)
      
      const response = await fetch(`/api/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedPlatform])
  useEffect(() => {
    if (session?.user) {
      fetchAnalytics()
    }
  }, [session, fetchAnalytics])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const platformColors: { [key: string]: string } = {
    TWITTER: '#1DA1F2',
    INSTAGRAM: '#E4405F',
    FACEBOOK: '#1877F2',
    LINKEDIN: '#0A66C2',
    TIKTOK: '#000000',
    YOUTUBE: '#FF0000',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-8 w-8 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data</h3>
        <p className="mt-1 text-sm text-gray-500">Publish some posts to see your analytics</p>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Impressions',
      value: formatNumber(analyticsData.summary.totalImpressions),
      icon: EyeIcon,
    },
    {
      name: 'Engagement Rate',
      value: analyticsData.summary.engagementRate.toFixed(1) + '%',
      icon: HeartIcon,
    },    {
      name: 'Total Reach',
      value: formatNumber(analyticsData.summary.totalReach),
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Total Posts',
      value: analyticsData.summary.totalPosts.toString(),
      icon: ChatBubbleLeftIcon,
    },
  ]

  return (
    <div className="space-y-6">      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your social media performance</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {platforms.map(platform => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Engagement Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.dailyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="engagements" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="impressions" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.platformBreakdown.map(platform => ({
              platform: platform.platform,
              engagement: platform.engagements,
              impressions: platform.impressions,
              posts: platform.posts
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="engagement" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Platform Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.platformBreakdown.map(platform => ({
                  name: platform.platform,
                  value: platform.posts,
                  color: platformColors[platform.platform] || '#94A3B8'
                }))}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {analyticsData.platformBreakdown.map((platform, index) => (
                  <Cell key={`cell-${index}`} fill={platformColors[platform.platform] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {analyticsData.platformBreakdown.map((platform) => (
              <div key={platform.platform} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: platformColors[platform.platform] || '#94A3B8' }}
                />
                <span className="text-sm text-gray-600">{platform.platform}: {platform.posts} posts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performing Posts</h2>
          <div className="space-y-4">
            {analyticsData.topPosts.length > 0 ? analyticsData.topPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <span 
                    className="text-sm font-medium px-2 py-1 rounded"
                    style={{ 
                      backgroundColor: platformColors[post.account.platform] || '#94A3B8',
                      color: 'white'
                    }}
                  >
                    {post.account.platform}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mb-3">{post.content.slice(0, 150)}...</p>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {post.analytics.impressions.toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <HeartIcon className="h-4 w-4 mr-1" />
                    {post.analytics.engagements}
                  </div>                  <div className="flex items-center">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {post.analytics.engagementRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No posts available for analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">AI Insights & Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">📈 Best Performing Content</h3>
            <p className="text-sm text-gray-600">
              Your video content generates 40% more engagement than text posts. Consider creating more video content.
            </p>
          </div>
          <div className="bg-white p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">⏰ Optimal Posting Times</h3>
            <p className="text-sm text-gray-600">
              Your audience is most active on weekdays between 2-4 PM. Schedule more posts during this window.
            </p>
          </div>
          <div className="bg-white p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">🎯 Audience Insights</h3>
            <p className="text-sm text-gray-600">
              Tech-related hashtags increase your reach by 25%. Use #AI, #productivity, and #innovation more often.
            </p>
          </div>
          <div className="bg-white p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">📊 Platform Focus</h3>
            <p className="text-sm text-gray-600">
              Instagram shows the highest engagement rate. Consider allocating more resources to this platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
