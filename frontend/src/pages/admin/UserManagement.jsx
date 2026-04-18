import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import api from '../../services/axiosInstance';

const ROLES = ['ADMIN', 'LECTURER', 'STUDENT', 'NON_ACADEMIC', 'TECHNICIAN', 'BOOKING_MANAGER', 'RESOURCE_MANAGER', 'TICKET_MANAGER'];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRoles, setEditRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoles = (user) => {
    setSelectedUser(user);
    setEditRoles(user.roles ? user.roles.map((r) => (typeof r === 'string' ? r : r.name || r)) : []);
    setShowRoleModal(true);
  };

  const handleRoleToggle = (role) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      await api.put(`/api/admin/users/${selectedUser.id}/roles`, { roles: editRoles });
      setSuccess('Roles updated successfully');
      setShowRoleModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update roles');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-base-200">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500 mt-1">Manage users and their roles</p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-4">
              <input
                type="text"
                placeholder="Search users..."
                className="input input-bordered w-full max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-ghost btn-sm" onClick={loadUsers}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Roles</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="font-medium">{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {(user.roles || []).map((role) => (
                                <span key={typeof role === 'string' ? role : role.name} className="badge badge-primary badge-sm">
                                  {typeof role === 'string' ? role : role.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${user.enabled !== false ? 'badge-success' : 'badge-error'} badge-sm`}>
                              {user.enabled !== false ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleEditRoles(user)}
                            >
                              Edit Roles
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Role Edit Modal */}
        {showRoleModal && selectedUser && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Edit Roles for {selectedUser.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={editRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveRoles}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
