'use client'

import { useState } from 'react'
import { SparklesIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

export default function ContentGenerator() {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState('TWITTER')
  const [tone, setTone] = useState('professional')
  const [audience, setAudience] = useState('')
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [generatedContent, setGeneratedContent] = useState<{
    content: string
    hashtags: string[]
    suggestions: string[]
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const platforms = [
    { value: 'TWITTER', label: 'Twitter/X', limit: '280 characters' },
    { value: 'INSTAGRAM', label: 'Instagram', limit: '2,200 characters' },
    { value: 'FACEBOOK', label: 'Facebook', limit: '63,206 characters' },
    { value: 'LINKEDIN', label: 'LinkedIn', limit: '3,000 characters' },
    { value: 'TIKTOK', label: 'TikTok', limit: '150 characters' },
  ]

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'inspirational', label: 'Inspirational' },
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          platform,
          tone,
          audience,
          includeHashtags,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedContent(data)
      } else {
        console.error('Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Content Generator</h1>
        <p className="text-gray-600">Create engaging content with AI assistance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Content Settings</h2>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} ({p.limit})
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tones.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., tech entrepreneurs, fitness enthusiasts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to post about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your content idea..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Include Hashtags */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hashtags"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hashtags" className="ml-2 block text-sm text-gray-900">
              Include hashtags
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Generated Content */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Generated Content</h2>

          {generatedContent ? (
            <div className="space-y-4">
              {/* Main Content */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Content
                </label>
                <div className="bg-gray-50 p-4 rounded-md border relative">
                  <p className="text-gray-900 whitespace-pre-wrap">{generatedContent.content}</p>
                  <button
                    onClick={() => copyToClipboard(generatedContent.content)}
                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Hashtags */}
              {generatedContent.hashtags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggested Hashtags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md cursor-pointer hover:bg-blue-200"
                        onClick={() => copyToClipboard(`#${hashtag}`)}
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Suggestions */}
              {generatedContent.suggestions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternative Versions
                  </label>
                  <div className="space-y-2">
                    {generatedContent.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded-md border cursor-pointer hover:bg-gray-100"
                        onClick={() => copyToClipboard(suggestion)}
                      >
                        <p className="text-sm text-gray-700">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  Schedule Post
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Save to Library
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <SparklesIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No content generated yet</h3>
              <p className="mt-1 text-sm text-gray-500">Fill out the form and click generate to create content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
