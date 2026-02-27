import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react';
import type { User } from '../../types';

const MOCK_USERS: User[] = [
  { id: '1', email: 'john@claimiq.com', firstName: 'John', lastName: 'Doe', role: 'admin', createdAt: '2025-01-15T10:00:00Z', isActive: true },
  { id: '2', email: 'sarah.johnson@claimiq.com', firstName: 'Sarah', lastName: 'Johnson', role: 'adjuster', createdAt: '2025-03-20T09:00:00Z', isActive: true },
  { id: '3', email: 'michael.smith@claimiq.com', firstName: 'Michael', lastName: 'Smith', role: 'adjuster', createdAt: '2025-05-10T14:00:00Z', isActive: true },
  { id: '4', email: 'emily@example.com', firstName: 'Emily', lastName: 'Carter', role: 'policyholder', createdAt: '2025-08-01T11:00:00Z', isActive: true },
  { id: '5', email: 'robert@example.com', firstName: 'Robert', lastName: 'Wilson', role: 'policyholder', createdAt: '2025-09-15T16:00:00Z', isActive: false },
];

const ROLE_OPTIONS = [
  { value: 'policyholder', label: 'Policyholder' },
  { value: 'adjuster', label: 'Adjuster' },
  { value: 'admin', label: 'Admin' },
];

export function UserManagementPage() {
  const [users] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Settings', href: '/settings' }, { label: 'User Management' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users and their role assignments.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>Add User</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="search" placeholder="Search users..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-white/[0.08] rounded-lg bg-dark-700/50 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="No users found" description="Try adjusting your search query." />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-dark-700/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-400">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
                        <div>
                          <p className="font-medium text-gray-200">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'adjuster' ? 'info' : 'neutral'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-500 hover:text-gray-300 rounded transition-colors" aria-label={`Edit ${u.firstName}`}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-colors" aria-label={`Delete ${u.firstName}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="John" required />
            <Input label="Last Name" placeholder="Doe" required />
          </div>
          <Input label="Email" type="email" placeholder="user@example.com" required />
          <Select label="Role" options={ROLE_OPTIONS} placeholder="Select a role" required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={() => setShowAddModal(false)}>Add User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
