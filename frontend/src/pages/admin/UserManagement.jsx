import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { userService } from '../../services/userService';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    roles: ['USER'],
    enabled: true,
    technicianSkills: ''
  });

  // Available roles
  const availableRoles = ['USER', 'ADMIN', 'TECHNICIAN', 'LECTURER', 'NON_ACADEMIC'];

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create user
  const handleCreateUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      alert('Name, email, and password are required');
      return;
    }

    if (formData.roles.length === 0) {
      alert('Select at least one role');
      return;
    }

    try {
      const payload = {
        ...formData,
        email: formData.email.trim(),
        name: formData.name.trim(),
        password: formData.password,
        technicianSkills: formData.roles.includes('TECHNICIAN')
          ? formData.technicianSkills.split(',').map((skill) => skill.trim()).filter(Boolean)
          : []
      };

      await userService.createUser(payload);
      setShowCreateModal(false);
      setFormData({ email: '', name: '', password: '', roles: ['USER'], enabled: true, technicianSkills: '' });
      fetchUsers();
      alert('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + (error.response?.data || error.message));
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (formData.roles.length === 0) {
      alert('Select at least one role');
      return;
    }

    try {
      await userService.updateUserRoles(selectedUser.id, {
        roles: formData.roles,
        technicianSkills: formData.roles.includes('TECHNICIAN')
          ? formData.technicianSkills.split(',').map((skill) => skill.trim()).filter(Boolean)
          : []
      });
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ email: '', name: '', password: '', roles: ['USER'], enabled: true, technicianSkills: '' });
      fetchUsers();
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user: ' + (error.response?.data || error.message));
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await userService.deleteUser(userId);
      fetchUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user: ' + (error.response?.data || error.message));
    }
  };

  // Toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userService.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status: ' + (error.response?.data || error.message));
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      roles: user.roles || ['USER'],
      enabled: user.enabled,
      technicianSkills: Array.isArray(user.technicianSkills) ? user.technicianSkills.join(', ') : ''
    });
    setShowEditModal(true);
  };

  // Handle role change
  const handleRoleChange = (role, isChecked) => {
    if (isChecked) {
      setFormData(prev => ({ ...prev, roles: [...prev.roles, role] }));
    } else {
      setFormData(prev => ({ ...prev, roles: prev.roles.filter(r => r !== role) }));
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users, roles, and permissions</p>
          </div>

          {/* Actions */}
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="input input-bordered w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Add New User
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((listedUser) => (
                        <tr key={listedUser.id}>
                          <td className="font-medium">{listedUser.name}</td>
                          <td>{listedUser.email}</td>
                          <td>
                            <div className="flex gap-1 flex-wrap">
                              {listedUser.roles?.map((role) => (
                                <span key={role} className="badge badge-sm badge-primary">
                                  {role}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="form-control">
                              <label className="label cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="toggle toggle-sm"
                                  checked={listedUser.enabled}
                                  onChange={() => handleToggleStatus(listedUser.id, listedUser.enabled)}
                                />
                                <span className="label-text ml-2">
                                  {listedUser.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </label>
                            </div>
                          </td>
                          <td>{new Date(listedUser.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => openEditModal(listedUser)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-error btn-outline"
                                onClick={() => handleDeleteUser(listedUser.id)}
                                disabled={listedUser.email === currentUser?.email}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Create New User</h3>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter a temporary password"
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Roles</span>
                </label>
                <div className="space-y-2">
                  {availableRoles.map((role) => (
                    <label key={role} className="label cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mr-2"
                        checked={formData.roles.includes(role)}
                        onChange={(e) => handleRoleChange(role, e.target.checked)}
                      />
                      <span className="label-text">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.roles.includes('TECHNICIAN') && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Technician Skills</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.technicianSkills}
                    onChange={(e) => setFormData(prev => ({ ...prev, technicianSkills: e.target.value }))}
                    placeholder="networking, hardware, electrical"
                  />
                </div>
              )}

              <div className="form-control mb-4">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span className="label-text ml-2">Enable user account</span>
                </label>
              </div>

              <div className="modal-action">
                <button className="btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateUser}>
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Edit User: {selectedUser.name}</h3>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  disabled
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.email}
                  disabled
                />
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Roles</span>
                </label>
                <div className="space-y-2">
                  {availableRoles.map((role) => (
                    <label key={role} className="label cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mr-2"
                        checked={formData.roles.includes(role)}
                        onChange={(e) => handleRoleChange(role, e.target.checked)}
                      />
                      <span className="label-text">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-action">
                <button className="btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleUpdateUser}>
                  Update User
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
