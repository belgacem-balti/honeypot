import React, { useState } from 'react';
import { Users, Mail, Shield, Crown, MoreHorizontal, UserPlus, Search, ExternalLink } from 'lucide-react';

const fakeMembers = [
  { id: 1, name: 'Sarah Chen', email: 'sarah.chen@taskflow.io', role: 'Owner', avatar: 'SC', status: 'online', tasks: 24, completed: 18, joined: '2024-01-15' },
  { id: 2, name: 'Marcus Johnson', email: 'marcus.j@taskflow.io', role: 'Admin', avatar: 'MJ', status: 'online', tasks: 31, completed: 27, joined: '2024-02-03' },
  { id: 3, name: 'Emma Wilson', email: 'emma.w@taskflow.io', role: 'Member', avatar: 'EW', status: 'away', tasks: 18, completed: 12, joined: '2024-03-12' },
  { id: 4, name: 'Alex Rivera', email: 'alex.r@taskflow.io', role: 'Member', avatar: 'AR', status: 'offline', tasks: 15, completed: 9, joined: '2024-04-21' },
  { id: 5, name: 'Priya Patel', email: 'priya.p@taskflow.io', role: 'Member', avatar: 'PP', status: 'online', tasks: 22, completed: 20, joined: '2024-05-08' },
  { id: 6, name: 'David Kim', email: 'david.k@taskflow.io', role: 'Viewer', avatar: 'DK', status: 'offline', tasks: 8, completed: 5, joined: '2024-06-15' },
];

const roleIcons = {
  Owner: Crown,
  Admin: Shield,
  Member: Users,
  Viewer: ExternalLink,
};

const roleBadges = {
  Owner: 'bg-warning-100 text-warning-700 border-warning-200',
  Admin: 'bg-primary-100 text-primary-700 border-primary-200',
  Member: 'bg-gray-100 text-gray-600 border-gray-200',
  Viewer: 'bg-gray-50 text-gray-500 border-gray-150',
};

const statusDots = {
  online: 'bg-success-500',
  away: 'bg-warning-500',
  offline: 'bg-gray-300',
};

const gradients = [
  'from-primary-500/20 to-primary-600/10',
  'from-success-500/20 to-success-600/10',
  'from-warning-500/20 to-warning-600/10',
  'from-danger-500/20 to-danger-600/10',
  'from-purple-500/20 to-purple-600/10',
  'from-cyan-500/20 to-cyan-600/10',
];

const textColors = [
  'text-primary-600',
  'text-success-600',
  'text-warning-600',
  'text-danger-600',
  'text-purple-600',
  'text-cyan-600',
];

export default function Team() {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = fakeMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const online = fakeMembers.filter((m) => m.status === 'online').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            {fakeMembers.length} members · {online} online
          </p>
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-primary btn-md">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: fakeMembers.length },
          { label: 'Online Now', value: online },
          { label: 'Total Tasks', value: fakeMembers.reduce((s, m) => s + m.tasks, 0) },
          { label: 'Completed', value: fakeMembers.reduce((s, m) => s + m.completed, 0) },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((member, i) => {
          const RoleIcon = roleIcons[member.role] || Users;
          return (
            <div key={member.id} className="card-hover p-5 group" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center border border-white/50`}>
                      <span className={`text-sm font-bold ${textColors[i % textColors.length]}`}>{member.avatar}</span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDots[member.status]}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </p>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${roleBadges[member.role]}`}>
                  <RoleIcon className="w-3 h-3" />
                  {member.role}
                </span>
                <span className="text-xs text-gray-400">Joined {new Date(member.joined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Task completion</span>
                  <span className="text-xs font-semibold text-gray-700">
                    {member.completed}/{member.tasks}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                    style={{ width: `${member.tasks > 0 ? (member.completed / member.tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Invite Team Member</h2>
            <p className="text-sm text-gray-500 mb-5">Send an invitation to join your workspace</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" placeholder="colleague@company.com" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select className="input-field">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Personal message (optional)</label>
                <textarea rows={3} placeholder="Hey! Join our workspace..." className="input-field resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setInviteOpen(false)} className="btn-secondary btn-md">Cancel</button>
              <button onClick={() => setInviteOpen(false)} className="btn-primary btn-md">
                <Mail className="w-4 h-4" />
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
