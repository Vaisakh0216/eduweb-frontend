// PaymentsPage.jsx
import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, TextField, InputAdornment } from '@mui/material';
import { Visibility, Delete, Search } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { paymentService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PAYMENT_MODES, PAYER_TYPES, RECEIVER_TYPES } from '../utils/constants';

const PaymentsPage = () => {
  const { isStaff } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: '', branchId: '', payerType: '', paymentMode: '', transactionRef: '', startDate: null, endDate: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

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
    { field: 'actions', headerName: 'Actions', minWidth: 80, renderCell: (row) => !isStaff && <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip> },
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
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
        />
      </Box>
      <SearchFilters searchPlaceholder="Search..." filters={filterConfig} values={filters} onChange={setFilters} onSearch={fetchPayments} showDateRange />
      <DataTable columns={columns} data={payments} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
      <ConfirmDialog open={deleteDialog.open} title="Delete Payment" message="Are you sure?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default PaymentsPage;
