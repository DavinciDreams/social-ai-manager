'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SocialAccount {
  id: string;
  platform: 'TWITTER' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'YOUTUBE';
  accountId: string;
  username: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Platform {
  id: 'TWITTER' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'YOUTUBE';
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  features: string[];
}

const SocialAccountsManager: React.FC = () => {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const platforms: Platform[] = [
    {
      id: 'TWITTER',
      name: 'Twitter/X',
      description: 'Share tweets, threads, and engage with your audience',
      icon: '𝕏',
      color: 'text-black',
      bgColor: 'bg-black',
      features: ['Tweets', 'Threads', 'Analytics', 'Scheduling'],
    },
    {
      id: 'INSTAGRAM',
      name: 'Instagram',
      description: 'Share photos, stories, and reels',
      icon: '📷',
      color: 'text-pink-600',
      bgColor: 'bg-gradient-to-br from-purple-600 to-pink-600',
      features: ['Posts', 'Stories', 'Reels', 'Analytics'],
    },
    {
      id: 'FACEBOOK',
      name: 'Facebook',
      description: 'Connect with your community and share updates',
      icon: '📘',
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      features: ['Posts', 'Pages', 'Groups', 'Analytics'],
    },
    {
      id: 'LINKEDIN',
      name: 'LinkedIn',
      description: 'Professional networking and business content',
      icon: '💼',
      color: 'text-blue-700',
      bgColor: 'bg-blue-700',
      features: ['Posts', 'Articles', 'Company Pages', 'Analytics'],
    },
    {
      id: 'TIKTOK',
      name: 'TikTok',
      description: 'Create and share short-form videos',
      icon: '🎵',
      color: 'text-black',
      bgColor: 'bg-black',
      features: ['Videos', 'Trends', 'Analytics', 'Scheduling'],
    },
    {
      id: 'YOUTUBE',
      name: 'YouTube',
      description: 'Upload and manage your video content',
      icon: '▶️',
      color: 'text-red-600',
      bgColor: 'bg-red-600',
      features: ['Videos', 'Shorts', 'Analytics', 'Scheduling'],
    },
  ];

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social-accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
    setLoading(false);
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/auth/connect/${platformId.toLowerCase()}`;
    } catch (error) {
      console.error('Failed to connect account:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social-accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAccounts(accounts.filter(account => account.id !== accountId));
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  const handleRefresh = async (accountId: string) => {
    try {
      const response = await fetch(`/api/social-accounts/${accountId}/refresh`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const updatedAccount = await response.json();
        setAccounts(accounts.map(account => 
          account.id === accountId ? updatedAccount : account
        ));
      }
    } catch (error) {
      console.error('Failed to refresh account:', error);
    }
  };

  const getConnectedAccount = (platformId: string) => {
    return accounts.find(account => account.platform === platformId && account.isActive);
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiryDate <= sevenDaysFromNow;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Social Media Accounts</h1>
            <p className="text-sm text-gray-600 mt-1">
              Connect and manage your social media accounts
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              {accounts.filter(a => a.isActive).length} connected
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Connected Accounts Summary */}
          {accounts.filter(a => a.isActive).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Connected Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.filter(a => a.isActive).map((account) => {
                  const platform = platforms.find(p => p.id === account.platform);
                  const expiringSoon = isExpiringSoon(account.expiresAt);
                  
                  return (
                    <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${platform?.bgColor} flex items-center justify-center text-white text-lg`}>
                            {platform?.icon}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{platform?.name}</h3>
                            <p className="text-sm text-gray-500">@{account.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {expiringSoon ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                      
                      {expiringSoon && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-xs text-yellow-800">
                            Token expires soon. Refresh to maintain connection.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRefresh(account.id)}
                          className="flex-1 text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 flex items-center justify-center space-x-1"
                        >
                          <ArrowPathIcon className="h-3 w-3" />
                          <span>Refresh</span>
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="text-sm text-red-600 hover:text-red-800 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Platforms */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Available Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform) => {
                const connectedAccount = getConnectedAccount(platform.id);
                const isConnected = !!connectedAccount;
                const isConnecting = connecting === platform.id;

                return (
                  <div
                    key={platform.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg ${platform.bgColor} flex items-center justify-center text-white text-xl`}>
                          {platform.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{platform.name}</h3>
                          {isConnected && (
                            <p className="text-sm text-green-600 flex items-center space-x-1">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>Connected</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{platform.description}</p>

                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Features
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {platform.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <>
                          <div className="flex-1 text-sm text-green-600 flex items-center space-x-1">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>@{connectedAccount.username}</span>
                          </div>
                          <button
                            onClick={() => handleDisconnect(connectedAccount.id)}
                            className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          {isConnecting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-4 w-4" />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-700 mb-4">
              Having trouble connecting your accounts? Here are some common solutions:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure you have admin access to the social media accounts</li>
              <li>• Check that third-party app permissions are enabled</li>
              <li>• Try disconnecting and reconnecting the account</li>
              <li>• Contact support if you continue to experience issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAccountsManager;
