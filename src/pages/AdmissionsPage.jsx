import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit, Visibility, Delete } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import StatusChip from '../components/common/StatusChip';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { admissionService, branchService, collegeService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { ADMISSION_STATUS_OPTIONS } from '../utils/constants';

const AdmissionsPage = () => {
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [branches, setBranches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    branchId: '',
    collegeId: '',
    admissionStatus: '',
    startDate: null,
    endDate: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    fetchBranches();
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [pagination.page, pagination.limit]);

  const fetchBranches = async () => {
    try {
      const response = await branchService.getActive();
      setBranches(response.data.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await collegeService.getActive();
      setColleges(response.data.data);
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        branchId: filters.branchId || undefined,
        collegeId: filters.collegeId || undefined,
        admissionStatus: filters.admissionStatus || undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      };

      const response = await admissionService.getAll(params);
      setAdmissions(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
      }));
    } catch (error) {
      console.error('Failed to fetch admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAdmissions();
  };

  const handleDelete = async () => {
    try {
      await admissionService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchAdmissions();
    } catch (error) {
      console.error('Failed to delete admission:', error);
    }
  };

  const columns = [
    { field: 'admissionNo', headerName: 'Admission No', minWidth: 130 },
    {
      field: 'admissionDate',
      headerName: 'Date',
      minWidth: 100,
      renderCell: (row) => formatDate(row.admissionDate),
    },
    {
      field: 'student',
      headerName: 'Student',
      minWidth: 150,
      renderCell: (row) => `${row.student?.firstName} ${row.student?.lastName}`,
    },
    {
      field: 'branch',
      headerName: 'Branch',
      minWidth: 120,
      renderCell: (row) => row.branchId?.name,
    },
    {
      field: 'college',
      headerName: 'College',
      minWidth: 150,
      renderCell: (row) => row.collegeId?.name,
    },
    {
      field: 'course',
      headerName: 'Course',
      minWidth: 150,
      renderCell: (row) => row.courseId?.name,
    },
    {
      field: 'admissionStatus',
      headerName: 'Status',
      minWidth: 110,
      renderCell: (row) => <StatusChip status={row.admissionStatus} />,
    },
    {
      field: 'totalFee',
      headerName: 'Total Fee',
      minWidth: 120,
      align: 'right',
      renderCell: (row) => formatCurrency(row.fees?.totalFee),
    },
    {
      field: 'studentDue',
      headerName: 'Student Due',
      minWidth: 120,
      align: 'right',
      renderCell: (row) => formatCurrency(row.paymentSummary?.studentDue),
    },
    ...(!isStaff ? [{
      field: 'serviceChargeDue',
      headerName: 'SC Due',
      minWidth: 100,
      align: 'right',
      renderCell: (row) => formatCurrency(row.serviceCharge?.due),
    }] : []),
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 120,
      renderCell: (row) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admissions/${row._id}`); }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admissions/${row._id}/edit`); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id: row._id }); }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filterConfig = [
    { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
    { field: 'collegeId', label: 'College', options: colleges.map(c => ({ value: c._id, label: c.name })) },
    { field: 'admissionStatus', label: 'Status', options: ADMISSION_STATUS_OPTIONS },
  ];

  return (
    <Box>
      <PageHeader
        title="Admissions"
        subtitle="Manage student admissions"
        actionLabel="New Admission"
        onActionClick={() => navigate('/admissions/new')}
      />

      <SearchFilters
        searchPlaceholder="Search by admission no, student name, phone..."
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onClear={() => setFilters({ search: '', branchId: '', collegeId: '', admissionStatus: '', startDate: null, endDate: null })}
        showDateRange
      />

      <DataTable
        columns={columns}
        data={admissions}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onRowsPerPageChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        onRowClick={(row) => navigate(`/admissions/${row._id}`)}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Admission"
        message="Are you sure you want to delete this admission? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />
    </Box>
  );
};

export default AdmissionsPage;
