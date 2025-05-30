'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  HomeIcon,
  PlusIcon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  CogIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import ContentGenerator from './ContentGenerator'
import PostScheduler from './PostScheduler'
import AnalyticsDashboard from './AnalyticsDashboard'
import ContentLibrary from './ContentLibrary'
import TeamCollaboration from './TeamCollaboration'
import SocialAccountsManager from './SocialAccountsManager'

type TabType = 'overview' | 'create' | 'schedule' | 'analytics' | 'library' | 'team' | 'settings'

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Debug function to test if buttons are working
  const handleTabClick = (tabName: TabType) => {
    console.log('Button clicked:', tabName)
    setActiveTab(tabName)
  }
  const navigation = [
    { name: 'Overview', href: 'overview', icon: HomeIcon },
    { name: 'Create Content', href: 'create', icon: PlusIcon },
    { name: 'Schedule', href: 'schedule', icon: CalendarIcon },
    { name: 'Analytics', href: 'analytics', icon: ChartBarIcon },
    { name: 'Library', href: 'library', icon: FolderIcon },
    { name: 'Team', href: 'team', icon: UserGroupIcon },
    { name: 'Settings', href: 'settings', icon: CogIcon },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />
      case 'create':
        return <ContentGenerator />
      case 'schedule':
        return <PostScheduler />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'library':
        return <ContentLibrary />
      case 'team':
        return <TeamCollaboration />
      case 'settings':
        return <SettingsTab />
      default:
        return <OverviewTab />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Social AI Manager</h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>                <button
                  onClick={() => handleTabClick(item.href as TabType)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-white">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-3 w-full text-left text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600">Welcome to your social media command center</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Scheduled Posts</dt>
                <dd className="text-lg font-medium text-gray-900">12</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-green-500 text-white">
                <ChartBarIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Reach</dt>
                <dd className="text-lg font-medium text-gray-900">45.2K</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-500 text-white">
                <UserGroupIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Engagement</dt>
                <dd className="text-lg font-medium text-gray-900">3.2%</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
                <FolderIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Content Items</dt>
                <dd className="text-lg font-medium text-gray-900">28</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">Post published to Twitter</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">Content generated for Instagram</p>
                <p className="text-sm text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">Analytics report generated</p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  const [settingsTab, setSettingsTab] = useState<'accounts' | 'profile' | 'notifications' | 'billing'>('accounts');

  const settingsTabs = [
    { id: 'accounts', name: 'Social Accounts' },
    { id: 'profile', name: 'Profile' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'billing', name: 'Billing' },
  ];

  const renderSettingsContent = () => {
    switch (settingsTab) {
      case 'accounts':
        return <SocialAccountsManager />;
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'billing':
        return <BillingSettings />;
      default:
        return <SocialAccountsManager />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      {/* Settings Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                settingsTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="min-h-96">
        {renderSettingsContent()}
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us about yourself"
            />
          </div>
          <div className="pt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-500">Receive notifications about your posts and analytics</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-500">Get notified when posts are published</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
              <p className="text-sm text-gray-500">Receive weekly analytics reports</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
          </div>
          <div className="pt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="max-w-2xl">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Billing & Subscription</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Plan</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-blue-900">Professional Plan</h5>
                  <p className="text-sm text-blue-700">$29/month - Unlimited posts and analytics</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Change Plan
                </button>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h4>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                    VISA
                  </div>
                  <span className="text-sm text-gray-900">•••• •••• •••• 4242</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Update
                </button>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Billing History</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-900">Dec 2024 - Professional Plan</span>
                <span className="text-sm text-gray-500">$29.00</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-900">Nov 2024 - Professional Plan</span>
                <span className="text-sm text-gray-500">$29.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
