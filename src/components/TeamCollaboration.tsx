'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  PencilIcon,
  StarIcon,
  ShieldCheckIcon,
  UserIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  _count?: {
    members: number;
  };
}

interface TeamCollaborationProps {
  onTeamSelect?: (team: Team) => void;
}

const TeamCollaboration: React.FC<TeamCollaborationProps> = ({ onTeamSelect }) => {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'members'>('teams');
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length > 0 && !selectedTeam) {
          setSelectedTeam(data[0]);
          onTeamSelect?.(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, onTeamSelect]);
  useEffect(() => {
    if (session) {
      fetchTeams();
    }
  }, [session, fetchTeams]);

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    onTeamSelect?.(team);
  };

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return <StarIcon className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <ShieldCheckIcon className="h-4 w-4 text-blue-500" />;
      case 'EDITOR':
        return <PencilIcon className="h-4 w-4 text-green-500" />;
      case 'MEMBER':
        return <UserIcon className="h-4 w-4 text-gray-500" />;
      case 'VIEWER':
        return <EyeIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'EDITOR':
        return 'bg-green-100 text-green-800';
      case 'MEMBER':
        return 'bg-gray-100 text-gray-800';
      case 'VIEWER':
        return 'bg-gray-50 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = selectedTeam?.members.filter(member =>
    member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            <h1 className="text-2xl font-semibold text-gray-900">Team Collaboration</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your teams and collaborate with team members
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teams'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Teams ({teams.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              disabled={!selectedTeam}
            >
              Members {selectedTeam && `(${selectedTeam.members.length})`}
            </button>
          </nav>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'teams' ? 'Search teams...' : 'Search members...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'teams' ? (
          <TeamsView
            teams={filteredTeams}
            selectedTeam={selectedTeam}
            onTeamSelect={handleTeamSelect}
            onCreateTeam={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <MembersView
            team={selectedTeam}
            members={filteredMembers}
            onInviteMember={() => setIsInviteModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          onTeamCreated={(newTeam) => {
            setTeams([newTeam, ...teams]);
            setSelectedTeam(newTeam);
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {isInviteModalOpen && selectedTeam && (
        <InviteMemberModal
          team={selectedTeam}
          onClose={() => setIsInviteModalOpen(false)}
          onMemberInvited={(updatedTeam) => {
            setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
            setSelectedTeam(updatedTeam);
            setIsInviteModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Teams View Component
interface TeamsViewProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
  onCreateTeam: () => void;
}

const TeamsView: React.FC<TeamsViewProps> = ({ teams, selectedTeam, onTeamSelect, onCreateTeam }) => {
  if (teams.length === 0) {
    return (      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first team to start collaborating.
        </p>
        <button
          onClick={onCreateTeam}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Team
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            isSelected={selectedTeam?.id === team.id}
            onSelect={() => onTeamSelect(team)}
          />
        ))}
      </div>
    </div>
  );
};

// Members View Component
interface MembersViewProps {
  team: Team | null;
  members: TeamMember[];
  onInviteMember: () => void;
}

const MembersView: React.FC<MembersViewProps> = ({ team, members, onInviteMember }) => {
  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return <StarIcon className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <ShieldCheckIcon className="h-4 w-4 text-blue-500" />;
      case 'EDITOR':
        return <PencilIcon className="h-4 w-4 text-green-500" />;
      case 'MEMBER':
        return <UserIcon className="h-4 w-4 text-gray-500" />;
      case 'VIEWER':
        return <EyeIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'EDITOR':
        return 'bg-green-100 text-green-800';
      case 'MEMBER':
        return 'bg-gray-100 text-gray-800';
      case 'VIEWER':
        return 'bg-gray-50 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  if (!team) {
    return (
      <div className="text-center py-12">
        <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Select a team</h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose a team to view and manage its members.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{team.name} Members</h2>
          <p className="text-sm text-gray-600">{members.length} team members</p>
        </div>
        <button
          onClick={onInviteMember}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <UserPlusIcon className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {getRoleIcon(member.role)}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Team Card Component
interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  onSelect: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, isSelected, onSelect }) => {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
        <div className="relative">
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {team.description && (
        <p className="text-sm text-gray-600 mb-3">{team.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Created {new Date(team.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// Create Team Modal Component
interface CreateTeamModalProps {
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (response.ok) {
        const newTeam = await response.json();
        onTeamCreated(newTeam);
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team name"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the team"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Invite Member Modal Component
interface InviteMemberModalProps {
  team: Team;
  onClose: () => void;
  onMemberInvited: (team: Team) => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ team, onClose, onMemberInvited }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('MEMBER');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        onMemberInvited(updatedTeam);
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Invite Team Member</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamMember['role'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="VIEWER">Viewer - Can view content only</option>
              <option value="MEMBER">Member - Can create and edit content</option>
              <option value="EDITOR">Editor - Can manage content and settings</option>
              <option value="ADMIN">Admin - Can manage team and members</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamCollaboration;
