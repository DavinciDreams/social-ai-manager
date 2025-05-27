'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  TrashIcon,
  PlusIcon,
  TrophyIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { ResponsiveContainer } from 'recharts'

interface ABTest {
  id: string
  name: string
  description: string
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  testMetric: string
  trafficSplit: number
  duration: number
  startDate?: string
  endDate?: string
  createdAt: string
  variants: Array<{
    id: string
    name: string
    postId: string
    trafficPercentage: number
    post: {
      content: string
      mediaUrls: string[]
      analytics?: Array<{
        impressions: number
        engagements: number
        clicks: number
        reach: number
      }>
    }
  }>
  results?: {
    status: string
    winner?: string
    improvement?: string
    variantAMetric?: string
    variantBMetric?: string
    metricName?: string
    confidence?: string
    message?: string
  }
}

export default function ABTestingDashboard() {
  const { data: session } = useSession()
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const statusOptions = [
    { value: '', label: 'All Tests' },    { value: 'DRAFT', label: 'Draft' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'COMPLETED', label: 'Completed' },
  ]

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus) params.append('status', selectedStatus)
      
      const response = await fetch(`/api/ab-tests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests || [])
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedStatus])

  useEffect(() => {
    if (session?.user) {
      fetchTests()
    }
  }, [session, fetchTests])

  const handleTestAction = async (testId: string, action: string) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      
      if (response.ok) {
        fetchTests() // Refresh the list
      }
    } catch (error) {
      console.error(`Error ${action} test:`, error)
    }
  }

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this A/B test?')) return
    
    try {
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        fetchTests() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting test:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'RUNNING': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWinnerColor = (winner: string) => {
    switch (winner) {
      case 'A': return 'text-green-600'
      case 'B': return 'text-blue-600'
      case 'TIE': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Testing Dashboard</h1>
          <p className="text-gray-600">Optimize your content with data-driven testing</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create A/B Test
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No A/B tests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first A/B test to start optimizing your content
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create A/B Test
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow-sm border p-6">
              {/* Test Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{test.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </div>
                  {test.description && (
                    <p className="text-sm text-gray-500 mt-1">{test.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Metric: {test.testMetric}</span>
                    <span>Duration: {formatDuration(test.duration)}</span>
                    <span>Split: {test.trafficSplit}% / {100 - test.trafficSplit}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {test.status === 'DRAFT' && (
                    <button
                      onClick={() => handleTestAction(test.id, 'start')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Start Test"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                  )}
                  {test.status === 'RUNNING' && (
                    <>
                      <button
                        onClick={() => handleTestAction(test.id, 'pause')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md"
                        title="Pause Test"
                      >
                        <PauseIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTestAction(test.id, 'stop')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Stop Test"
                      >
                        <StopIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {test.status === 'PAUSED' && (
                    <button
                      onClick={() => handleTestAction(test.id, 'resume')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                      title="Resume Test"
                    >
                      <PlayIcon className="h-4 w-4" />
                    </button>
                  )}
                  {test.status !== 'RUNNING' && (
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete Test"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Variants Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {test.variants.map((variant, index) => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{variant.name}</h4>
                      <span className="text-sm text-gray-500">{variant.trafficPercentage}% traffic</span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-md p-3 mb-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {variant.post.content}
                      </p>
                      {variant.post.mediaUrls.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {variant.post.mediaUrls.length} media file(s)
                        </p>
                      )}
                    </div>

                    {/* Variant Metrics */}
                    {variant.post.analytics && variant.post.analytics[0] && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Impressions</p>
                          <p className="font-medium">{variant.post.analytics[0].impressions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Engagements</p>
                          <p className="font-medium">{variant.post.analytics[0].engagements.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Clicks</p>
                          <p className="font-medium">{variant.post.analytics[0].clicks.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Reach</p>
                          <p className="font-medium">{variant.post.analytics[0].reach.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Results */}
              {test.results && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <TrophyIcon className="h-4 w-4 mr-2" />
                    Test Results
                  </h4>
                  
                  {test.results.status === 'INSUFFICIENT_DATA' ? (
                    <p className="text-sm text-gray-600">{test.results.message}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Winner</p>
                        <p className={`font-medium ${getWinnerColor(test.results.winner!)}`}>
                          {test.results.winner === 'TIE' ? 'Tie' : `Variant ${test.results.winner}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Improvement</p>
                        <p className="font-medium">{test.results.improvement}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Confidence</p>
                        <p className="font-medium">{test.results.confidence}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Metric</p>
                        <p className="font-medium">{test.results.metricName}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Time Info */}
              <div className="flex items-center space-x-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Created {new Date(test.createdAt).toLocaleDateString()}
                </div>
                {test.startDate && (
                  <div className="flex items-center">
                    <PlayIcon className="h-3 w-3 mr-1" />
                    Started {new Date(test.startDate).toLocaleDateString()}
                  </div>
                )}
                {test.endDate && (
                  <div className="flex items-center">
                    <StopIcon className="h-3 w-3 mr-1" />
                    Ended {new Date(test.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create A/B Test</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                A/B testing functionality will be implemented in the full version.
                This would include form fields for test name, description, variants, and configuration.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
