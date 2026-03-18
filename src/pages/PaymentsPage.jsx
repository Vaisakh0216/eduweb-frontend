// PaymentsPage.jsx
import { useState, useEffect } from 'react';
import {
  Box, IconButton, Tooltip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress,
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { paymentService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PAYMENT_MODES, PAYER_TYPES } from '../utils/constants';

const PaymentsPage = () => {
  const { isStaff } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: '', branchId: '', payerType: '', paymentMode: '', transactionRef: '', startDate: null, endDate: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [editDialog, setEditDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ amount: 0, paymentDate: new Date(), paymentMode: 'Cash', transactionRef: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { branchService.getActive().then(res => setBranches(res.data.data)); }, []);
  useEffect(() => { fetchPayments(); }, [pagination.page, pagination.limit]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await paymentService.getAll(params);
      setPayments(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openEditDialog = (row) => {
    setEditId(row._id);
    setEditForm({
      amount: row.amount,
      paymentDate: row.paymentDate ? new Date(row.paymentDate) : new Date(),
      paymentMode: row.paymentMode,
      transactionRef: row.transactionRef || '',
      notes: row.notes || '',
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      await paymentService.update(editId, {
        amount: parseFloat(editForm.amount),
        paymentDate: editForm.paymentDate,
        paymentMode: editForm.paymentMode,
        transactionRef: editForm.transactionRef || null,
        notes: editForm.notes,
      });
      setEditDialog(false);
      fetchPayments();
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try { await paymentService.delete(deleteDialog.id); setDeleteDialog({ open: false, id: null }); fetchPayments(); } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'paymentDate', headerName: 'Date', minWidth: 100, renderCell: (row) => formatDate(row.paymentDate) },
    { field: 'admission', headerName: 'Admission', minWidth: 130, renderCell: (row) => row.admissionId?.admissionNo },
    { field: 'student', headerName: 'Student', minWidth: 150, renderCell: (row) => `${row.admissionId?.student?.firstName || ''} ${row.admissionId?.student?.lastName || ''}` },
    { field: 'branch', headerName: 'Branch', minWidth: 80, renderCell: (row) => row.branchId?.code },
    { field: 'payerType', headerName: 'Payer', minWidth: 80 },
    { field: 'receiverType', headerName: 'Receiver', minWidth: 90 },
    { field: 'paymentMode', headerName: 'Mode', minWidth: 90 },
    { field: 'transactionRef', headerName: 'Txn Ref', minWidth: 120, renderCell: (row) => row.transactionRef || '-' },
    { field: 'voucher', headerName: 'Voucher', minWidth: 140, renderCell: (row) => row.voucherId?.voucherNo },
    { field: 'amount', headerName: 'Amount', minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.amount) },
    {
      field: 'actions', headerName: 'Actions', minWidth: 100,
      renderCell: (row) => !isStaff && (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditDialog(row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filterConfig = [
    { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
    { field: 'payerType', label: 'Payer', options: PAYER_TYPES },
    { field: 'paymentMode', label: 'Mode', options: PAYMENT_MODES },
  ];

  return (
    <Box>
      <PageHeader title="Payments" subtitle="View all payments" />
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by Transaction Ref..."
          value={filters.transactionRef}
          onChange={(e) => setFilters({ ...filters, transactionRef: e.target.value })}
          onKeyPress={(e) => e.key === 'Enter' && fetchPayments()}
          sx={{ width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
        />
      </Box>
      <SearchFilters searchPlaceholder="Search..." filters={filterConfig} values={filters} onChange={setFilters} onSearch={fetchPayments} showDateRange />
      <DataTable columns={columns} data={payments} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <DatePicker
                label="Payment Date"
                value={editForm.paymentDate}
                onChange={(d) => setEditForm({ ...editForm, paymentDate: d })}
                format="dd/MM/yyyy"
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Amount" type="number" value={editForm.amount || ''} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select value={editForm.paymentMode} onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })} label="Payment Mode">
                  {PAYMENT_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Transaction Reference" value={editForm.transactionRef} onChange={(e) => setEditForm({ ...editForm, transactionRef: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate} disabled={submitting || !editForm.amount}>
            {submitting ? <CircularProgress size={24} /> : 'Update Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} title="Delete Payment" message="Are you sure you want to delete this payment? This will update all related numbers." confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default PaymentsPage;
