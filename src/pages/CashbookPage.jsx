import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { DeleteSweep, Warning } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { cashbookService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatCategoryLabel } from '../utils/formatters';
import { DAYBOOK_CATEGORIES } from '../utils/constants';

const CashbookPage = () => {
  const { isSuperAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ branchId: '', category: '', startDate: null, endDate: null });
  
  // Clear dialog states
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearBranchId, setClearBranchId] = useState('');
  const [clearType, setClearType] = useState('soft'); // 'soft' or 'hard'
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState('');
  const [clearSuccess, setClearSuccess] = useState('');

  useEffect(() => { branchService.getActive().then(res => setBranches(res.data.data)); }, []);
  useEffect(() => { fetchEntries(); fetchSummary(); }, [pagination.page, pagination.limit]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await cashbookService.getAll(params);
      setEntries(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try {
      const params = { ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await cashbookService.getSummary(params);
      setSummary(res.data.data);
    } catch (e) { console.error(e); }
  };

  const handleOpenClearDialog = () => {
    setClearDialogOpen(true);
    setClearBranchId('');
    setClearType('soft');
    setClearError('');
    setClearSuccess('');
  };

  const handleCloseClearDialog = () => {
    setClearDialogOpen(false);
    setClearError('');
    setClearSuccess('');
  };

  const handleClearCashbook = async () => {
    setClearLoading(true);
    setClearError('');
    setClearSuccess('');
    
    try {
      let res;
      const params = clearBranchId ? { branchId: clearBranchId } : {};
      
      if (clearType === 'hard') {
        res = await cashbookService.hardClear(params);
      } else {
        res = await cashbookService.clear(params);
      }
      
      setClearSuccess(res.data.message || `${res.data.data.deletedCount} entries cleared successfully`);
      
      // Refresh data after clearing
      setTimeout(() => {
        fetchEntries();
        fetchSummary();
        handleCloseClearDialog();
      }, 1500);
    } catch (e) {
      setClearError(e.response?.data?.message || 'Failed to clear cashbook');
    } finally {
      setClearLoading(false);
    }
  };

  const columns = [
    { field: 'date', headerName: 'Date', minWidth: 100, renderCell: (row) => formatDate(row.date) },
    { field: 'branch', headerName: 'Branch', minWidth: 100, renderCell: (row) => row.branchId?.code },
    { field: 'category', headerName: 'Category', minWidth: 180, renderCell: (row) => formatCategoryLabel(row.category) },
    { field: 'description', headerName: 'Description', minWidth: 200 },
    { field: 'voucher', headerName: 'Voucher', minWidth: 130, renderCell: (row) => row.voucherId?.voucherNo || '-' },
    { field: 'credited', headerName: 'Credit', minWidth: 120, align: 'right', renderCell: (row) => row.credited ? <Typography color="success.main">{formatCurrency(row.credited)}</Typography> : '-' },
    { field: 'debited', headerName: 'Debit', minWidth: 120, align: 'right', renderCell: (row) => row.debited ? <Typography color="error.main">{formatCurrency(row.debited)}</Typography> : '-' },
    { field: 'runningBalance', headerName: 'Balance', minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.runningBalance) },
  ];

  const filterConfig = [
    { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
    { field: 'category', label: 'Category', options: DAYBOOK_CATEGORIES },
  ];

  return (
    <Box>
      <PageHeader title="Cashbook" subtitle="Track cash transactions">
        {isSuperAdmin && (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteSweep />} 
            onClick={handleOpenClearDialog}
          >
            Clear Cashbook
          </Button>
        )}
      </PageHeader>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Credited</Typography><Typography variant="h5" color="success.main">{formatCurrency(summary.totalCredited)}</Typography></CardContent></Card></Grid>
          <Grid item xs={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Debited</Typography><Typography variant="h5" color="error.main">{formatCurrency(summary.totalDebited)}</Typography></CardContent></Card></Grid>
          <Grid item xs={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Transactions</Typography><Typography variant="h5">{summary.transactions}</Typography></CardContent></Card></Grid>
          <Grid item xs={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Current Balance</Typography><Typography variant="h5" color="primary.main">{formatCurrency(summary.currentBalance)}</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      <SearchFilters filters={filterConfig} values={filters} onChange={setFilters} onSearch={() => { fetchEntries(); fetchSummary(); }} showDateRange />
      <DataTable columns={columns} data={entries} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />

      {/* Clear Cashbook Dialog */}
      <Dialog open={clearDialogOpen} onClose={handleCloseClearDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Clear Cashbook
        </DialogTitle>
        <DialogContent>
          {clearError && <Alert severity="error" sx={{ mb: 2 }}>{clearError}</Alert>}
          {clearSuccess && <Alert severity="success" sx={{ mb: 2 }}>{clearSuccess}</Alert>}
          
          <Alert severity="warning" sx={{ mb: 3 }}>
            This action will delete cashbook entries. Please proceed with caution.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Branch (Optional)</InputLabel>
                <Select
                  value={clearBranchId}
                  onChange={(e) => setClearBranchId(e.target.value)}
                  label="Branch (Optional)"
                >
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                Leave empty to clear all branches
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Clear Type</InputLabel>
                <Select
                  value={clearType}
                  onChange={(e) => setClearType(e.target.value)}
                  label="Clear Type"
                >
                  <MenuItem value="soft">Soft Delete (Recoverable)</MenuItem>
                  <MenuItem value="hard">Hard Delete (Permanent)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color={clearType === 'hard' ? 'error' : 'text.secondary'}>
                {clearType === 'soft' 
                  ? 'Entries will be marked as deleted but can be recovered from database' 
                  : '⚠️ WARNING: Entries will be permanently deleted and cannot be recovered!'}
              </Typography>
            </Grid>
          </Grid>

          {clearType === 'hard' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Permanent Deletion Warning!</strong><br />
              You are about to permanently delete {clearBranchId ? 'all entries for the selected branch' : 'ALL cashbook entries'}. 
              This action cannot be undone!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog} disabled={clearLoading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleClearCashbook}
            disabled={clearLoading}
            startIcon={<DeleteSweep />}
          >
            {clearLoading ? 'Clearing...' : `Clear ${clearType === 'hard' ? 'Permanently' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashbookPage;
