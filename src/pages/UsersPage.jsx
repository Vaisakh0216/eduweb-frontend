// UsersPage.jsx
import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Alert, InputAdornment } from '@mui/material';
import { Edit, PersonOff, Visibility, VisibilityOff } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import { userService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const emptyForm = { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'staff', branches: [], isActive: true };

const validateForm = (formData, isEdit) => {
  const errors = {};
  if (!formData.firstName.trim()) errors.firstName = 'First name is required';
  if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!isEdit) {
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  }
  if (formData.phone && !/^\+?[\d\s\-()]{7,15}$/.test(formData.phone)) {
    errors.phone = 'Enter a valid phone number';
  }
  if (!formData.role) errors.role = 'Role is required';
  return errors;
};

const UsersPage = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { branchService.getActive().then(res => setBranches(res.data.data)).catch(console.error); }, []);
  useEffect(() => { fetchUsers(); }, [pagination.page, pagination.limit]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: filters.search || undefined, role: filters.role || undefined };
      const res = await userService.getAll(params);
      setUsers(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAddDialog = () => {
    setEditUser(null);
    setFormData(emptyForm);
    setFieldErrors({});
    setServerError('');
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditUser(user);
    setFormData({ ...user, password: '', branches: user.branches?.map(b => b._id) || [] });
    setFieldErrors({});
    setServerError('');
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setFieldErrors({});
    setServerError('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const errors = validateForm(formData, !!editUser);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setServerError('');
    try {
      if (editUser) {
        await userService.update(editUser._id, formData);
      } else {
        await userService.create(formData);
      }
      handleClose();
      fetchUsers();
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Failed to save user. Please try again.';
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await userService.toggleStatus(id);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'email', headerName: 'Email', minWidth: 200 },
    { field: 'fullName', headerName: 'Name', minWidth: 150, renderCell: (row) => `${row.firstName} ${row.lastName}` },
    { field: 'role', headerName: 'Role', minWidth: 120, renderCell: (row) => <Chip label={ROLE_LABELS[row.role]} size="small" /> },
    { field: 'branches', headerName: 'Branches', minWidth: 200, renderCell: (row) => row.branches?.map(b => b.name).join(', ') || '-' },
    { field: 'isActive', headerName: 'Status', minWidth: 100, renderCell: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', minWidth: 120,
      renderCell: (row) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}><IconButton size="small" onClick={() => handleToggleStatus(row._id)}><PersonOff fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Users" subtitle="Manage system users" actionLabel="Add User" onActionClick={openAddDialog} />
      <SearchFilters
        searchPlaceholder="Search users..."
        filters={[{ field: 'role', label: 'Role', options: [{ value: 'super_admin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' }, { value: 'staff', label: 'Staff' }] }]}
        values={filters}
        onChange={setFilters}
        onSearch={fetchUsers}
      />
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
      />

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          {serverError && <Alert severity="error" sx={{ mt: 1, mb: 2 }}>{serverError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                required
              />
            </Grid>
            {!editUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password || 'Minimum 6 characters'}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(p => !p)} edge="end" size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={!!fieldErrors.phone}
                helperText={fieldErrors.phone}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required error={!!fieldErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role} onChange={(e) => handleChange('role', e.target.value)} label="Role">
                  {isSuperAdmin && <MenuItem value="super_admin">Super Admin</MenuItem>}
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Branches</InputLabel>
                <Select multiple value={formData.branches} onChange={(e) => handleChange('branches', e.target.value)} label="Branches">
                  {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
