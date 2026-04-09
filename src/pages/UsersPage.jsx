// UsersPage.jsx
import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Grid, Alert, InputAdornment, Typography, Card, CardContent, Divider, CircularProgress } from '@mui/material';
import { Edit, PersonOff, Visibility, VisibilityOff, Percent, Payments, Delete } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import { userService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const emptyForm = { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'staff', branches: [], isActive: true };
const emptyPayForm = { amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'Cash', notes: '' };

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

  // Profit share state
  const [profitDialogOpen, setProfitDialogOpen] = useState(false);
  const [profitUser, setProfitUser] = useState(null);
  const [profitSummary, setProfitSummary] = useState(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitPct, setProfitPct] = useState('');
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [paySaving, setPaySaving] = useState(false);
  const [profitError, setProfitError] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [profitSummaries, setProfitSummaries] = useState({});
  const [editPayment, setEditPayment] = useState(null);   // payment being edited
  const [deletePaymentId, setDeletePaymentId] = useState(null);

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

  const fetchProfitSummaries = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await userService.getAdminProfitSummaries();
      setProfitSummaries(res.data.data || {});
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProfitSummaries(); }, []);   // eslint-disable-line

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

  const openProfitDialog = async (user) => {
    setProfitUser(user);
    setProfitPct(user.profitShare?.percentage ?? '');
    setProfitSummary(null);
    setProfitError('');
    setProfitDialogOpen(true);
    setProfitLoading(true);
    try {
      const res = await userService.getProfitSummary(user._id);
      setProfitSummary(res.data.data);
    } catch (e) { setProfitError('Failed to load profit summary'); }
    finally { setProfitLoading(false); }
  };

  const handleSaveProfitPct = async () => {
    if (profitPct === '' || profitPct < 0 || profitPct > 100) {
      setProfitError('Enter a percentage between 0 and 100');
      return;
    }
    try {
      await userService.updateProfitShare(profitUser._id, { percentage: Number(profitPct) });
      fetchUsers();
      // Refresh summary
      const res = await userService.getProfitSummary(profitUser._id);
      setProfitSummary(res.data.data);
      setProfitError('');
    } catch (e) { setProfitError(e.response?.data?.message || 'Failed to update'); }
  };

  const openPayDialog = () => {
    setEditPayment(null);
    setPayForm(emptyPayForm);
    setProfitError('');
    setPayDialogOpen(true);
  };

  const openEditPayDialog = (p) => {
    setEditPayment(p);
    setPayForm({
      amount: p.amount,
      paymentDate: new Date(p.paymentDate).toISOString().split('T')[0],
      paymentMode: p.paymentMode,
      notes: p.notes || '',
    });
    setProfitError('');
    setPayDialogOpen(true);
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await userService.deleteProfitPayment(paymentId);
      setDeletePaymentId(null);
      const [summaryRes] = await Promise.all([
        userService.getProfitSummary(profitUser._id),
        fetchProfitSummaries(),
        fetchUsers(),
      ]);
      setProfitSummary(summaryRes.data.data);
    } catch (e) { setProfitError(e.response?.data?.message || 'Delete failed'); }
  };

  const handleMakePayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      setProfitError('Enter a valid amount');
      return;
    }
    setPaySaving(true);
    setProfitError('');
    try {
      if (editPayment) {
        await userService.updateProfitPayment(editPayment._id, { ...payForm, amount: Number(payForm.amount) });
      } else {
        await userService.makeProfitPayment(profitUser._id, { ...payForm, amount: Number(payForm.amount) });
      }
      setPayDialogOpen(false);
      setEditPayment(null);
      const [summaryRes] = await Promise.all([
        userService.getProfitSummary(profitUser._id),
        fetchProfitSummaries(),
        fetchUsers(),
      ]);
      setProfitSummary(summaryRes.data.data);
    } catch (e) { setProfitError(e.response?.data?.message || 'Save failed'); }
    finally { setPaySaving(false); }
  };

  const columns = [
    { field: 'email', headerName: 'Email', minWidth: 200 },
    { field: 'fullName', headerName: 'Name', minWidth: 150, renderCell: (row) => `${row.firstName} ${row.lastName}` },
    { field: 'role', headerName: 'Role', minWidth: 120, renderCell: (row) => <Chip label={ROLE_LABELS[row.role]} size="small" /> },
    { field: 'branches', headerName: 'Branches', minWidth: 180, renderCell: (row) => row.branches?.map(b => b.name).join(', ') || '-' },
    { field: 'isActive', headerName: 'Status', minWidth: 90, renderCell: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', minWidth: 100,
      renderCell: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.isActive ? 'Deactivate' : 'Activate'}><IconButton size="small" onClick={() => handleToggleStatus(row._id)}><PersonOff fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const handleRowClick = (row) => {
    if (!isSuperAdmin || row.role !== 'admin') return;
    setSelectedAdmin(prev => prev?._id === row._id ? null : row);
  };

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

      {/* Profit Share action bar — shown when an admin row is selected */}
      {isSuperAdmin && selectedAdmin && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5, mb: 1, borderRadius: 2,
          bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Payments fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>{selectedAdmin.firstName} {selectedAdmin.lastName}</Typography>
            <Chip label={`${selectedAdmin.profitShare?.percentage || 0}% profit share`} size="small" color="primary" variant="outlined" />
          </Box>
          <Button variant="contained" size="small" startIcon={<Percent />} onClick={() => openProfitDialog(selectedAdmin)}>
            Manage Profit Share
          </Button>
        </Box>
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))}
        onRowClick={handleRowClick}
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

      {/* Profit Share Dialog */}
      <Dialog open={profitDialogOpen} onClose={() => setProfitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Profit Share — {profitUser?.firstName} {profitUser?.lastName}
        </DialogTitle>
        <DialogContent>
          {profitError && <Alert severity="error" sx={{ mb: 2 }}>{profitError}</Alert>}

          {/* Set percentage */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, mt: 1 }}>
            <TextField
              label="Profit Share %"
              type="number"
              value={profitPct}
              onChange={(e) => setProfitPct(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: 180 }}
              size="small"
            />
            <Button variant="outlined" onClick={handleSaveProfitPct} startIcon={<Percent />}>
              Save %
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Summary cards */}
          {profitLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
          ) : profitSummary && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">Total Earned</Typography>
                      <Typography variant="h6" color="success.main">{formatCurrency(profitSummary.earned)}</Typography>
                      <Typography variant="caption" color="text.secondary">{profitSummary.percentage}% of net profit</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                      <Typography variant="h6" color="primary.main">{formatCurrency(profitSummary.totalPaid)}</Typography>
                      <Typography variant="caption" color="text.secondary">{profitSummary.paymentCount} payment(s)</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary">Pending</Typography>
                      <Typography variant="h6" color={profitSummary.due > 0 ? 'error.main' : 'text.primary'}>{formatCurrency(profitSummary.due)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recent payments */}
              {profitSummary.recentPayments?.length > 0 && (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Payments</Typography>
                  {profitSummary.recentPayments.map((p) => (
                    <Box key={p._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{formatCurrency(p.amount)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')} · {p.paymentMode}
                          {p.notes && ` · ${p.notes}`}
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditPayDialog(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeletePaymentId(p._id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </Box>
                  ))}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfitDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Payments />} onClick={openPayDialog} disabled={!profitSummary || profitSummary.due <= 0}>
            Make Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePaymentId} onClose={() => setDeletePaymentId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Payment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this profit payment? This will update the total paid amount.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePaymentId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => handleDeletePayment(deletePaymentId)}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Make / Edit Profit Payment Dialog */}
      <Dialog open={payDialogOpen} onClose={() => { setPayDialogOpen(false); setEditPayment(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>{editPayment ? 'Edit Payment' : 'Make Profit Payment'}</DialogTitle>
        <DialogContent>
          {profitError && <Alert severity="error" sx={{ mb: 2 }}>{profitError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Amount (₹)" type="number" value={payForm.amount}
                onChange={(e) => setPayForm(p => ({ ...p, amount: e.target.value }))}
                inputProps={{ min: 1 }} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Payment Date" type="date" value={payForm.paymentDate}
                onChange={(e) => setPayForm(p => ({ ...p, paymentDate: e.target.value }))}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select value={payForm.paymentMode} label="Payment Mode"
                  onChange={(e) => setPayForm(p => ({ ...p, paymentMode: e.target.value }))}>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank">Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" value={payForm.notes}
                onChange={(e) => setPayForm(p => ({ ...p, notes: e.target.value }))} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialogOpen(false)} disabled={paySaving}>Cancel</Button>
          <Button variant="contained" onClick={handleMakePayment} disabled={paySaving}>
            {paySaving ? 'Saving...' : editPayment ? 'Update' : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
