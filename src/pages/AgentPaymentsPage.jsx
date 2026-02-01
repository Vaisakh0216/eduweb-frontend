import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Delete } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { agentPaymentService, branchService, agentService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PAYMENT_MODES } from '../utils/constants';

const AgentPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filters, setFilters] = useState({ branchId: '', agentId: '', paymentMode: '', startDate: null, endDate: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => { 
    branchService.getActive().then(res => setBranches(res.data.data)); 
    agentService.getActive().then(res => setAgents(res.data.data));
  }, []);
  useEffect(() => { fetchPayments(); }, [pagination.page, pagination.limit]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await agentPaymentService.getAll(params);
      setPayments(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try { await agentPaymentService.delete(deleteDialog.id); setDeleteDialog({ open: false, id: null }); fetchPayments(); } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'paymentDate', headerName: 'Date', minWidth: 100, renderCell: (row) => formatDate(row.paymentDate) },
    { field: 'admission', headerName: 'Admission', minWidth: 130, renderCell: (row) => row.admissionId?.admissionNo },
    { field: 'agent', headerName: 'Agent', minWidth: 150, renderCell: (row) => row.agentId?.name },
    { field: 'branch', headerName: 'Branch', minWidth: 100, renderCell: (row) => row.branchId?.code },
    { field: 'paymentMode', headerName: 'Mode', minWidth: 100 },
    { field: 'transactionRef', headerName: 'Reference', minWidth: 120 },
    { field: 'voucher', headerName: 'Voucher', minWidth: 140, renderCell: (row) => row.voucherId?.voucherNo },
    { field: 'amount', headerName: 'Amount', minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.amount) },
    { field: 'actions', headerName: 'Actions', minWidth: 80, renderCell: (row) => <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip> },
  ];

  const filterConfig = [
    { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
    { field: 'agentId', label: 'Agent', options: agents.map(a => ({ value: a._id, label: a.name })) },
    { field: 'paymentMode', label: 'Mode', options: PAYMENT_MODES },
  ];

  return (
    <Box>
      <PageHeader title="Agent Payments" subtitle="View all agent payments" />
      <SearchFilters filters={filterConfig} values={filters} onChange={setFilters} onSearch={fetchPayments} showDateRange />
      <DataTable columns={columns} data={payments} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
      <ConfirmDialog open={deleteDialog.open} title="Delete Agent Payment" message="Are you sure?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default AgentPaymentsPage;
