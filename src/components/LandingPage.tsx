'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { 
  ChartBarIcon, 
  CalendarIcon, 
  SparklesIcon, 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function LandingPage() {
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI Content Generation',
      description: 'Generate engaging posts tailored to each platform with AI-powered content creation.',
    },
    {
      icon: CalendarIcon,
      title: 'Smart Scheduling',
      description: 'Schedule posts across all platforms with AI-optimized timing suggestions.',
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Get detailed insights and AI-powered recommendations to boost engagement.',
    },
    {
      icon: UserGroupIcon,
      title: 'Team Collaboration',
      description: 'Work with your team seamlessly with role-based access and approval workflows.',
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Engagement Automation',
      description: 'Auto-respond to comments and messages with AI-powered sentiment analysis.',
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Trend Detection',
      description: 'Stay ahead with AI-powered trend detection and content suggestions.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <SparklesIcon className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Social AI Manager</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <button
            onClick={() => signIn()}
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Social Media
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Automate your social media strategy with AI. Generate content, schedule posts, 
            analyze performance, and engage with your audience across all platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => signIn()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started Free
            </button>
            <button className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed to help businesses and creators manage their social media presence efficiently.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-6 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platforms Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl bg-gray-50 rounded-2xl my-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Connect all your platforms
          </h2>
          <p className="text-xl text-gray-600">
            Manage Twitter, Instagram, Facebook, LinkedIn, TikTok, and more from one dashboard.
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
          {/* Platform logos would go here */}
          <div className="px-6 py-3 bg-white rounded-lg shadow-sm border text-gray-700 font-medium">Twitter/X</div>
          <div className="px-6 py-3 bg-white rounded-lg shadow-sm border text-gray-700 font-medium">Instagram</div>
          <div className="px-6 py-3 bg-white rounded-lg shadow-sm border text-gray-700 font-medium">Facebook</div>
          <div className="px-6 py-3 bg-white rounded-lg shadow-sm border text-gray-700 font-medium">LinkedIn</div>
          <div className="px-6 py-3 bg-white rounded-lg shadow-sm border text-gray-700 font-medium">TikTok</div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to transform your social media?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of businesses using AI to grow their social media presence.
          </p>
          <button
            onClick={() => signIn()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
          >
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>&copy; 2025 Social AI Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
