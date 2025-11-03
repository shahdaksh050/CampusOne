import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function UserRoleManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleUpdate(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setUpdating(userId);
      await api.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
      
      alert('Role updated successfully');
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role: ' + err.message);
    } finally {
      setUpdating(null);
    }
  }

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-[var(--destructive)]/20 text-[var(--destructive)] border border-[var(--destructive)]/30';
      case 'teacher':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'student':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[var(--muted-foreground)]">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">User Role Management</h1>
        <p className="text-[var(--muted-foreground)]">Manage user roles and permissions</p>
      </div>

      {error && (
        <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)] text-[var(--destructive)] px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[var(--input-background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--muted-foreground)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--card)] rounded-lg shadow-lg border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--card)] divide-y divide-[var(--border)]">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-[var(--secondary)] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-[var(--primary-foreground)] font-semibold shadow-lg">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-[var(--card-foreground)]">
                          {user.name || 'No name'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[var(--card-foreground)]">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.firebaseUid === currentUser?.uid ? (
                      <span className="text-[var(--muted-foreground)]">Cannot modify own role</span>
                    ) : (
                      <div className="flex gap-2">
                        {user.role !== 'student' && (
                          <button
                            onClick={() => handleRoleUpdate(user._id, 'student')}
                            disabled={updating === user._id}
                            className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {updating === user._id ? '...' : 'Student'}
                          </button>
                        )}
                        {user.role !== 'teacher' && (
                          <button
                            onClick={() => handleRoleUpdate(user._id, 'teacher')}
                            disabled={updating === user._id}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {updating === user._id ? '...' : 'Teacher'}
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleRoleUpdate(user._id, 'admin')}
                            disabled={updating === user._id}
                            className="px-3 py-1 bg-[var(--destructive)]/20 text-[var(--destructive)] border border-[var(--destructive)]/30 rounded hover:bg-[var(--destructive)]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {updating === user._id ? '...' : 'Admin'}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-[var(--muted-foreground)]">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-[var(--muted-foreground)]">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-[var(--foreground)]">{users.length}</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-[var(--muted-foreground)]">Students</div>
          <div className="mt-2 text-3xl font-bold text-green-400">
            {users.filter(u => u.role === 'student').length}
          </div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-sm font-medium text-[var(--muted-foreground)]">Teachers</div>
          <div className="mt-2 text-3xl font-bold text-blue-400">
            {users.filter(u => u.role === 'teacher').length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRoleManagement;
