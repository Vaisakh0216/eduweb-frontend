import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Button } from '@mui/material';
import { Print, Visibility } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import { voucherService, branchService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/formatters';

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ search: '', branchId: '', voucherType: '', startDate: null, endDate: null });

  useEffect(() => { branchService.getActive().then(res => setBranches(res.data.data)); }, []);
  useEffect(() => { fetchVouchers(); }, [pagination.page, pagination.limit]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      const res = await voucherService.getAll(params);
      setVouchers(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handlePrint = (id) => { window.open(`/vouchers/${id}/print`, '_blank'); };

  const columns = [
    { field: 'voucherNo', headerName: 'Voucher No', minWidth: 150 },
    { field: 'voucherDate', headerName: 'Date', minWidth: 100, renderCell: (row) => formatDate(row.voucherDate) },
    { field: 'branch', headerName: 'Branch', minWidth: 100, renderCell: (row) => row.branchId?.code },
    { field: 'voucherType', headerName: 'Type', minWidth: 120, renderCell: (row) => <Chip label={row.voucherType.replace('_', ' ')} size="small" /> },
    { field: 'partyName', headerName: 'Party', minWidth: 150 },
    { field: 'description', headerName: 'Description', minWidth: 200 },
    { field: 'admission', headerName: 'Admission', minWidth: 130, renderCell: (row) => row.admissionId?.admissionNo || '-' },
    { field: 'amount', headerName: 'Amount', minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.amount) },
    { field: 'printCount', headerName: 'Prints', minWidth: 80, renderCell: (row) => row.printCount || 0 },
    { field: 'actions', headerName: 'Actions', minWidth: 100, renderCell: (row) => (
      <Box>
        <Tooltip title="Print"><IconButton size="small" onClick={() => handlePrint(row._id)}><Print fontSize="small" /></IconButton></Tooltip>
      </Box>
    )},
  ];

  const filterConfig = [
    { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
    { field: 'voucherType', label: 'Type', options: [{ value: 'payment', label: 'Payment' }, { value: 'agent_payment', label: 'Agent Payment' }, { value: 'receipt', label: 'Receipt' }, { value: 'expense', label: 'Expense' }] },
  ];

  return (
    <Box>
      <PageHeader title="Vouchers" subtitle="View and print vouchers" />
      <SearchFilters searchPlaceholder="Search voucher no..." filters={filterConfig} values={filters} onChange={setFilters} onSearch={fetchVouchers} showDateRange />
      <DataTable columns={columns} data={vouchers} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
    </Box>
  );
};

export default VouchersPage;
