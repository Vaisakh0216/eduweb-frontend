import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Typography } from '@mui/material';
import { Edit, Delete, Download } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { daybookService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatCategoryLabel } from '../utils/formatters';
import { DAYBOOK_TYPES, DAYBOOK_CATEGORIES } from '../utils/constants';

const DaybookPage = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ branchId: '', category: '', type: '', startDate: null, endDate: null });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({ branchId: '', category: 'misc', type: 'income', amount: 0, dueAmount: 0, description: '', remarks: '' });

  useEffect(() => { branchService.getActive().then(res => setBranches(res.data.data)); }, []);
  useEffect(() => { fetchEntries(); fetchSummary(); }, [pagination.page, pagination.limit]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await daybookService.getAll(params);
      setEntries(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const params = { ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await daybookService.getSummary(params);
      setSummary(res.data.data);
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    try {
      if (editEntry) await daybookService.update(editEntry._id, formData);
      else await daybookService.create(formData);
      setDialogOpen(false); setEditEntry(null); fetchEntries(); fetchSummary();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try { await daybookService.delete(deleteDialog.id); setDeleteDialog({ open: false, id: null }); fetchEntries(); fetchSummary(); } catch (e) { console.error(e); }
  };

  const handleExport = async () => {
    try {
      const params = { ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await daybookService.export(params);
      const csv = [Object.keys(res.data.data[0] || {}).join(','), ...res.data.data.map(row => Object.values(row).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `daybook_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'date', headerName: 'Date', minWidth: 100, renderCell: (row) => formatDate(row.date) },
    { field: 'branch', headerName: 'Branch', minWidth: 100, renderCell: (row) => row.branchId?.code },
    { field: 'category', headerName: 'Category', minWidth: 180, renderCell: (row) => formatCategoryLabel(row.category) },
    { field: 'type', headerName: 'Type', minWidth: 80, renderCell: (row) => <Chip label={row.type} size="small" color={row.type === 'income' ? 'success' : 'error'} /> },
    { field: 'description', headerName: 'Description', minWidth: 200 },
    { field: 'amount', headerName: 'Amount', minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.amount) },
    { field: 'voucher', headerName: 'Voucher', minWidth: 130, renderCell: (row) => row.voucherId?.voucherNo || '-' },
    { field: 'actions', headerName: 'Actions', minWidth: 100, renderCell: (row) => (isSuperAdmin || isAdmin) && (
      <Box>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditEntry(row); setFormData({ ...row, branchId: row.branchId?._id }); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const filterConfig = [
    { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
    { field: 'category', label: 'Category', options: DAYBOOK_CATEGORIES },
    { field: 'type', label: 'Type', options: DAYBOOK_TYPES },
  ];

  return (
    <Box>
      <PageHeader title="Daybook" subtitle="Track daily income and expenses" actionLabel={(isSuperAdmin || isAdmin) ? "Add Entry" : null} onActionClick={() => { setEditEntry(null); setFormData({ branchId: branches[0]?._id || '', category: 'misc', type: 'income', amount: 0, dueAmount: 0, description: '', remarks: '' }); setDialogOpen(true); }}>
        <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
      </PageHeader>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Income</Typography><Typography variant="h5" color="success.main">{formatCurrency(summary.totalIncome)}</Typography></CardContent></Card></Grid>
          <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Expense</Typography><Typography variant="h5" color="error.main">{formatCurrency(summary.totalExpense)}</Typography></CardContent></Card></Grid>
          <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Net Profit</Typography><Typography variant="h5" color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}>{formatCurrency(summary.netProfit)}</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <SearchFilters filters={filterConfig} values={filters} onChange={setFilters} onSearch={() => { fetchEntries(); fetchSummary(); }} showDateRange />
      <DataTable columns={columns} data={entries} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editEntry ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Branch</InputLabel><Select value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} label="Branch">{branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} label="Type">{DAYBOOK_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><FormControl fullWidth><InputLabel>Category</InputLabel><Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Category">{DAYBOOK_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Amount" type="number" value={formData.dueAmount} onChange={(e) => setFormData({ ...formData, dueAmount: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" multiline rows={2} value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} title="Delete Entry" message="Are you sure?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default DaybookPage;
