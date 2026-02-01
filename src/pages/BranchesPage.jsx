import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { branchService } from '../api/services';

const BranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({ name: '', code: '', phone: '', email: '', address: { addressLine: '', city: '', state: '', pincode: '' } });

  useEffect(() => { fetchBranches(); }, [pagination.page, pagination.limit]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: filters.search || undefined };
      const res = await branchService.getAll(params);
      setBranches(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editBranch) {
        await branchService.update(editBranch._id, formData);
      } else {
        await branchService.create(formData);
      }
      setDialogOpen(false);
      setEditBranch(null);
      fetchBranches();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try {
      await branchService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchBranches();
    } catch (e) { console.error(e); }
  };

  const openEditDialog = (branch) => {
    setEditBranch(branch);
    setFormData({ name: branch.name, code: branch.code, phone: branch.phone || '', email: branch.email || '', address: branch.address || { addressLine: '', city: '', state: '', pincode: '' } });
    setDialogOpen(true);
  };

  const columns = [
    { field: 'code', headerName: 'Code', minWidth: 80 },
    { field: 'name', headerName: 'Name', minWidth: 200 },
    { field: 'city', headerName: 'City', minWidth: 120, renderCell: (row) => row.address?.city || '-' },
    { field: 'phone', headerName: 'Phone', minWidth: 130 },
    { field: 'email', headerName: 'Email', minWidth: 180 },
    { field: 'isActive', headerName: 'Status', minWidth: 100, renderCell: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', minWidth: 100,
      renderCell: (row) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Branches" subtitle="Manage branches" actionLabel="Add Branch" onActionClick={() => { setEditBranch(null); setFormData({ name: '', code: '', phone: '', email: '', address: { addressLine: '', city: '', state: '', pincode: '' } }); setDialogOpen(true); }} />
      <SearchFilters searchPlaceholder="Search branches..." values={filters} onChange={setFilters} onSearch={fetchBranches} />
      <DataTable columns={columns} data={branches} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editBranch ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}><TextField fullWidth label="Branch Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} inputProps={{ maxLength: 5 }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" value={formData.address?.addressLine} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="City" value={formData.address?.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="State" value={formData.address?.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Pincode" value={formData.address?.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} title="Delete Branch" message="Are you sure you want to delete this branch?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default BranchesPage;
