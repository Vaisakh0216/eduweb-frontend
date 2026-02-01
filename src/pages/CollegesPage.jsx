import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { collegeService } from '../api/services';
import { useAuth } from '../context/AuthContext';

const CollegesPage = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCollege, setEditCollege] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({ name: '', code: '', phone: '', email: '', website: '', address: { addressLine: '', city: '', state: '', pincode: '' }, contactPerson: { name: '', phone: '', email: '', designation: '' } });

  useEffect(() => { fetchColleges(); }, [pagination.page, pagination.limit]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: filters.search || undefined };
      const res = await collegeService.getAll(params);
      setColleges(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editCollege) {
        await collegeService.update(editCollege._id, formData);
      } else {
        await collegeService.create(formData);
      }
      setDialogOpen(false);
      setEditCollege(null);
      fetchColleges();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try {
      await collegeService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchColleges();
    } catch (e) { console.error(e); }
  };

  const openEditDialog = (college) => {
    setEditCollege(college);
    setFormData({
      name: college.name, code: college.code || '', phone: college.phone || '', email: college.email || '', website: college.website || '',
      address: college.address || { addressLine: '', city: '', state: '', pincode: '' },
      contactPerson: college.contactPerson || { name: '', phone: '', email: '', designation: '' }
    });
    setDialogOpen(true);
  };

  const columns = [
    { field: 'name', headerName: 'College Name', minWidth: 250 },
    { field: 'code', headerName: 'Code', minWidth: 80 },
    { field: 'city', headerName: 'City', minWidth: 120, renderCell: (row) => row.address?.city || '-' },
    { field: 'phone', headerName: 'Phone', minWidth: 130 },
    { field: 'contactPerson', headerName: 'Contact Person', minWidth: 150, renderCell: (row) => row.contactPerson?.name || '-' },
    { field: 'isActive', headerName: 'Status', minWidth: 100, renderCell: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', minWidth: 100,
      renderCell: (row) => (isSuperAdmin || isAdmin) && (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditDialog(row)}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Colleges" subtitle="Manage colleges" actionLabel={(isSuperAdmin || isAdmin) ? "Add College" : null} onActionClick={() => { setEditCollege(null); setFormData({ name: '', code: '', phone: '', email: '', website: '', address: { addressLine: '', city: '', state: '', pincode: '' }, contactPerson: { name: '', phone: '', email: '', designation: '' } }); setDialogOpen(true); }} />
      <SearchFilters searchPlaceholder="Search colleges..." values={filters} onChange={setFilters} onSearch={fetchColleges} />
      <DataTable columns={columns} data={colleges} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editCollege ? 'Edit College' : 'Add College'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}><TextField fullWidth label="College Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" value={formData.address?.addressLine} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="City" value={formData.address?.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="State" value={formData.address?.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Pincode" value={formData.address?.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} /></Grid>
            <Grid item xs={12}><Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}><strong>Contact Person</strong></Box></Grid>
            <Grid item xs={6}><TextField fullWidth label="Name" value={formData.contactPerson?.name} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, name: e.target.value } })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Designation" value={formData.contactPerson?.designation} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, designation: e.target.value } })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.contactPerson?.phone} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, phone: e.target.value } })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" value={formData.contactPerson?.email} onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, email: e.target.value } })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} title="Delete College" message="Are you sure you want to delete this college?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default CollegesPage;
