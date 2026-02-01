// UsersPage.jsx
import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Switch, FormControlLabel } from '@mui/material';
import { Edit, Delete, PersonOff, PersonAdd } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { userService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const UsersPage = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '', role: 'staff', branches: [], isActive: true
  });

  useEffect(() => { fetchBranches(); }, []);
  useEffect(() => { fetchUsers(); }, [pagination.page, pagination.limit]);

  const fetchBranches = async () => {
    try {
      const res = await branchService.getActive();
      setBranches(res.data.data);
    } catch (e) { console.error(e); }
  };

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

  const handleSave = async () => {
    try {
      if (editUser) {
        await userService.update(editUser._id, formData);
      } else {
        await userService.create(formData);
      }
      setDialogOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  const handleToggleStatus = async (id) => {
    try {
      await userService.toggleStatus(id);
      fetchUsers();
    } catch (e) { console.error(e); }
  };

  const openEditDialog = (user) => {
    setEditUser(user);
    setFormData({ ...user, password: '', branches: user.branches?.map(b => b._id) || [] });
    setDialogOpen(true);
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
      <PageHeader title="Users" subtitle="Manage system users" actionLabel="Add User" onActionClick={() => { setEditUser(null); setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'staff', branches: [], isActive: true }); setDialogOpen(true); }} />
      <SearchFilters searchPlaceholder="Search users..." filters={[{ field: 'role', label: 'Role', options: [{ value: 'super_admin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' }, { value: 'staff', label: 'Staff' }] }]} values={filters} onChange={setFilters} onSearch={fetchUsers} />
      <DataTable columns={columns} data={users} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            {!editUser && <Grid item xs={12}><TextField fullWidth label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></Grid>}
            <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} label="Role">
                  {isSuperAdmin && <MenuItem value="super_admin">Super Admin</MenuItem>}
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Branches</InputLabel>
                <Select multiple value={formData.branches} onChange={(e) => setFormData({ ...formData, branches: e.target.value })} label="Branches">
                  {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
