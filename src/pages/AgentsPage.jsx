import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { agentService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AGENT_TYPES } from '../utils/constants';

const AgentsPage = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', agentType: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({ name: '', agentType: 'Main', phone: '', email: '', commissionRate: 0, address: { addressLine: '', city: '', state: '', pincode: '' }, bankDetails: { bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' } });

  useEffect(() => { fetchAgents(); }, [pagination.page, pagination.limit]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: filters.search || undefined, agentType: filters.agentType || undefined };
      const res = await agentService.getAll(params);
      setAgents(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editAgent) {
        await agentService.update(editAgent._id, formData);
      } else {
        await agentService.create(formData);
      }
      setDialogOpen(false);
      setEditAgent(null);
      fetchAgents();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try {
      await agentService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchAgents();
    } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'name', headerName: 'Agent Name', minWidth: 180 },
    { field: 'agentType', headerName: 'Type', minWidth: 100, renderCell: (row) => <Chip label={row.agentType} size="small" variant="outlined" /> },
    { field: 'phone', headerName: 'Phone', minWidth: 130 },
    { field: 'email', headerName: 'Email', minWidth: 180 },
    { field: 'commissionRate', headerName: 'Commission %', minWidth: 120, renderCell: (row) => `${row.commissionRate || 0}%` },
    { field: 'isActive', headerName: 'Status', minWidth: 100, renderCell: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', minWidth: 120,
      renderCell: (row) => (
        <Box>
          <Tooltip title="View Details"><IconButton size="small" onClick={() => navigate(`/agents/${row._id}`)}><Visibility fontSize="small" /></IconButton></Tooltip>
          {(isSuperAdmin || isAdmin) && (
            <>
              <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditAgent(row); setFormData({ ...row }); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Agents" subtitle="Manage agents" actionLabel={(isSuperAdmin || isAdmin) ? "Add Agent" : null} onActionClick={() => { setEditAgent(null); setFormData({ name: '', agentType: 'Main', phone: '', email: '', commissionRate: 0, address: { addressLine: '', city: '', state: '', pincode: '' }, bankDetails: { bankName: '', accountNumber: '', ifscCode: '', accountHolderName: '' } }); setDialogOpen(true); }} />
      <SearchFilters searchPlaceholder="Search agents..." filters={[{ field: 'agentType', label: 'Type', options: AGENT_TYPES }]} values={filters} onChange={setFilters} onSearch={fetchAgents} />
      <DataTable columns={columns} data={agents} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} onRowClick={(row) => navigate(`/agents/${row._id}`)} />
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editAgent ? 'Edit Agent' : 'Add Agent'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Agent Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.agentType} onChange={(e) => setFormData({ ...formData, agentType: e.target.value })} label="Type">
                  {AGENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}><TextField fullWidth label="Commission %" type="number" value={formData.commissionRate} onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" value={formData.address?.addressLine} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="City" value={formData.address?.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="State" value={formData.address?.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Pincode" value={formData.address?.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} /></Grid>
            <Grid item xs={12}><Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}><strong>Bank Details</strong></Box></Grid>
            <Grid item xs={6}><TextField fullWidth label="Bank Name" value={formData.bankDetails?.bankName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Account Holder" value={formData.bankDetails?.accountHolderName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value } })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Account Number" value={formData.bankDetails?.accountNumber} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="IFSC Code" value={formData.bankDetails?.ifscCode} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value } })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} title="Delete Agent" message="Are you sure you want to delete this agent?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default AgentsPage;
