import { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { courseService, collegeService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const CoursesPage = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', collegeId: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [formData, setFormData] = useState({ name: '', code: '', collegeId: '', degree: '', specialization: '', duration: { years: 4 }, fees: { year1: 0, year2: 0, year3: 0, year4: 0 }, hostelFees: { year1: 0, year2: 0, year3: 0, year4: 0 } });

  useEffect(() => { fetchColleges(); }, []);
  useEffect(() => { fetchCourses(); }, [pagination.page, pagination.limit]);

  const fetchColleges = async () => {
    try {
      const res = await collegeService.getActive();
      setColleges(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, search: filters.search || undefined, collegeId: filters.collegeId || undefined };
      const res = await courseService.getAll(params);
      setCourses(res.data.data);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editCourse) {
        await courseService.update(editCourse._id, formData);
      } else {
        await courseService.create(formData);
      }
      setDialogOpen(false);
      setEditCourse(null);
      fetchCourses();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    try {
      await courseService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchCourses();
    } catch (e) { console.error(e); }
  };

  const columns = [
    { field: 'name', headerName: 'Course Name', minWidth: 200 },
    { field: 'college', headerName: 'College', minWidth: 180, renderCell: (row) => row.collegeId?.name || '-' },
    { field: 'degree', headerName: 'Degree', minWidth: 100 },
    { field: 'duration', headerName: 'Duration', minWidth: 100, renderCell: (row) => `${row.duration?.years || 4} Years` },
    { field: 'fee', headerName: 'Year 1 Fee', minWidth: 120, renderCell: (row) => formatCurrency(row.fees?.year1) },
    { field: 'isActive', headerName: 'Status', minWidth: 100, renderCell: (row) => <Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions', headerName: 'Actions', minWidth: 100,
      renderCell: (row) => (isSuperAdmin || isAdmin) && (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditCourse(row); setFormData({ ...row, collegeId: row.collegeId?._id }); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Courses" subtitle="Manage courses" actionLabel={(isSuperAdmin || isAdmin) ? "Add Course" : null} onActionClick={() => { setEditCourse(null); setFormData({ name: '', code: '', collegeId: '', degree: '', specialization: '', duration: { years: 4 }, fees: { year1: 0, year2: 0, year3: 0, year4: 0 }, hostelFees: { year1: 0, year2: 0, year3: 0, year4: 0 } }); setDialogOpen(true); }} />
      <SearchFilters searchPlaceholder="Search courses..." filters={[{ field: 'collegeId', label: 'College', options: colleges.map(c => ({ value: c._id, label: c.name })) }]} values={filters} onChange={setFilters} onSearch={fetchCourses} />
      <DataTable columns={columns} data={courses} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={8}><TextField fullWidth label="Course Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>College</InputLabel>
                <Select value={formData.collegeId} onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })} label="College">
                  {colleges.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}><TextField fullWidth label="Degree" value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} /></Grid>
            <Grid item xs={3}><TextField fullWidth label="Duration (Years)" type="number" value={formData.duration?.years} onChange={(e) => setFormData({ ...formData, duration: { years: parseInt(e.target.value) } })} /></Grid>
            <Grid item xs={12}><Box sx={{ mt: 2 }}><strong>Tuition Fees</strong></Box></Grid>
            {[1, 2, 3, 4].map(y => (
              <Grid item xs={3} key={y}><TextField fullWidth label={`Year ${y}`} type="number" value={formData.fees?.[`year${y}`] || 0} onChange={(e) => setFormData({ ...formData, fees: { ...formData.fees, [`year${y}`]: parseInt(e.target.value) || 0 } })} /></Grid>
            ))}
            <Grid item xs={12}><Box sx={{ mt: 1 }}><strong>Hostel Fees</strong></Box></Grid>
            {[1, 2, 3, 4].map(y => (
              <Grid item xs={3} key={y}><TextField fullWidth label={`Year ${y}`} type="number" value={formData.hostelFees?.[`year${y}`] || 0} onChange={(e) => setFormData({ ...formData, hostelFees: { ...formData.hostelFees, [`year${y}`]: parseInt(e.target.value) || 0 } })} /></Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteDialog.open} title="Delete Course" message="Are you sure you want to delete this course?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
    </Box>
  );
};

export default CoursesPage;
