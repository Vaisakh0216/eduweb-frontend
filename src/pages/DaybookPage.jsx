// import { useState, useEffect } from 'react';
// import { Box, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Typography } from '@mui/material';
// import { Edit, Delete, Download } from '@mui/icons-material';
// import PageHeader from '../components/common/PageHeader';
// import DataTable from '../components/common/DataTable';
// import SearchFilters from '../components/common/SearchFilters';
// import ConfirmDialog from '../components/common/ConfirmDialog';
// import { daybookService, branchService } from '../api/services';
// import { useAuth } from '../context/AuthContext';
// import { formatCurrency, formatDate, formatCategoryLabel } from '../utils/formatters';
// import { DAYBOOK_TYPES, DAYBOOK_CATEGORIES } from '../utils/constants';

// const DaybookPage = () => {
//   const { isSuperAdmin, isAdmin } = useAuth();
//   const [entries, setEntries] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
//   const [branches, setBranches] = useState([]);
//   const [filters, setFilters] = useState({ branchId: '', category: '', type: '', startDate: null, endDate: null });
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editEntry, setEditEntry] = useState(null);
//   const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
//   const [formData, setFormData] = useState({ branchId: '', category: 'misc', type: 'income', amount: 0, dueAmount: 0, description: '', remarks: '' });

//   useEffect(() => { branchService.getActive().then(res => setBranches(res.data.data)); }, []);
//   useEffect(() => { fetchEntries(); fetchSummary(); }, [pagination.page, pagination.limit]);

//   const fetchEntries = async () => {
//     setLoading(true);
//     try {
//       const params = { page: pagination.page, limit: pagination.limit, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
//       if (params.startDate) params.startDate = params.startDate.toISOString();
//       if (params.endDate) params.endDate = params.endDate.toISOString();
//       const res = await daybookService.getAll(params);
//       setEntries(res.data.data);
//       setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
//     } catch (e) { console.error(e); } finally { setLoading(false); }
//   };

//   const fetchSummary = async () => {
//     try {
//       const params = { ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
//       if (params.startDate) params.startDate = params.startDate.toISOString();
//       if (params.endDate) params.endDate = params.endDate.toISOString();
//       const res = await daybookService.getSummary(params);
//       setSummary(res.data.data);
//     } catch (e) { console.error(e); }
//   };

//   const handleSave = async () => {
//     try {
//       if (editEntry) await daybookService.update(editEntry._id, formData);
//       else await daybookService.create(formData);
//       setDialogOpen(false); setEditEntry(null); fetchEntries(); fetchSummary();
//     } catch (e) { console.error(e); }
//   };

//   const handleDelete = async () => {
//     try { await daybookService.delete(deleteDialog.id); setDeleteDialog({ open: false, id: null }); fetchEntries(); fetchSummary(); } catch (e) { console.error(e); }
//   };

//   const handleExport = async () => {
//     try {
//       const params = { ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
//       if (params.startDate) params.startDate = params.startDate.toISOString();
//       if (params.endDate) params.endDate = params.endDate.toISOString();
//       const res = await daybookService.export(params);
//       const csv = [Object.keys(res.data.data[0] || {}).join(','), ...res.data.data.map(row => Object.values(row).join(','))].join('\n');
//       const blob = new Blob([csv], { type: 'text/csv' });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a'); a.href = url; a.download = `daybook_${new Date().toISOString().split('T')[0]}.csv`; a.click();
//     } catch (e) { console.error(e); }
//   };

//   const columns = [
//     { field: 'date', headerName: 'Date', minWidth: 100, renderCell: (row) => formatDate(row.date) },
//     { field: 'branch', headerName: 'Branch', minWidth: 100, renderCell: (row) => row.branchId?.code },
//     { field: 'category', headerName: 'Category', minWidth: 180, renderCell: (row) => formatCategoryLabel(row.category) },
//     { field: 'type', headerName: 'Type', minWidth: 80, renderCell: (row) => <Chip label={row.type} size="small" color={row.type === 'income' ? 'success' : 'error'} /> },
//     { field: 'description', headerName: 'Description', minWidth: 200 },
//     { field: 'amount', headerName: 'Amount', minWidth: 120, align: 'right', renderCell: (row) => formatCurrency(row.amount) },
//     { field: 'voucher', headerName: 'Voucher', minWidth: 130, renderCell: (row) => row.voucherId?.voucherNo || '-' },
//     { field: 'actions', headerName: 'Actions', minWidth: 100, renderCell: (row) => (isSuperAdmin || isAdmin) && (
//       <Box>
//         <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditEntry(row); setFormData({ ...row, branchId: row.branchId?._id }); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
//         <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteDialog({ open: true, id: row._id })}><Delete fontSize="small" /></IconButton></Tooltip>
//       </Box>
//     )},
//   ];

//   const filterConfig = [
//     { field: 'branchId', label: 'Branch', options: branches.map(b => ({ value: b._id, label: b.name })) },
//     { field: 'category', label: 'Category', options: DAYBOOK_CATEGORIES },
//     { field: 'type', label: 'Type', options: DAYBOOK_TYPES },
//   ];

//   return (
//     <Box>
//       <PageHeader title="Daybook" subtitle="Track daily income and expenses" actionLabel={(isSuperAdmin || isAdmin) ? "Add Entry" : null} onActionClick={() => { setEditEntry(null); setFormData({ branchId: branches[0]?._id || '', category: 'misc', type: 'income', amount: 0, dueAmount: 0, description: '', remarks: '' }); setDialogOpen(true); }}>
//         <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>Export CSV</Button>
//       </PageHeader>

//       {summary && (
//         <Grid container spacing={2} sx={{ mb: 3 }}>
//           <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Income</Typography><Typography variant="h5" color="success.main">{formatCurrency(summary.totalIncome)}</Typography></CardContent></Card></Grid>
//           <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Expense</Typography><Typography variant="h5" color="error.main">{formatCurrency(summary.totalExpense)}</Typography></CardContent></Card></Grid>
//           <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Net Profit</Typography><Typography variant="h5" color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}>{formatCurrency(summary.netProfit)}</Typography></CardContent></Card></Grid>
//         </Grid>
//       )}

//       <SearchFilters filters={filterConfig} values={filters} onChange={setFilters} onSearch={() => { fetchEntries(); fetchSummary(); }} showDateRange />
//       <DataTable columns={columns} data={entries} loading={loading} pagination={pagination} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} onRowsPerPageChange={(l) => setPagination(prev => ({ ...prev, limit: l, page: 1 }))} />

//       <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
//         <DialogTitle>{editEntry ? 'Edit Entry' : 'Add Entry'}</DialogTitle>
//         <DialogContent>
//           <Grid container spacing={2} sx={{ mt: 1 }}>
//             <Grid item xs={6}><FormControl fullWidth><InputLabel>Branch</InputLabel><Select value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} label="Branch">{branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</Select></FormControl></Grid>
//             <Grid item xs={6}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} label="Type">{DAYBOOK_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid>
//             <Grid item xs={12}><FormControl fullWidth><InputLabel>Category</InputLabel><Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} label="Category">{DAYBOOK_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}</Select></FormControl></Grid>
//             <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} /></Grid>
//             <Grid item xs={6}><TextField fullWidth label="Due Amount" type="number" value={formData.dueAmount || ''} onChange={(e) => setFormData({ ...formData, dueAmount: parseFloat(e.target.value) || 0 })} /></Grid>
//             <Grid item xs={12}><TextField fullWidth label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
//             <Grid item xs={12}><TextField fullWidth label="Remarks" multiline rows={2} value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} /></Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
//       </Dialog>

//       <ConfirmDialog open={deleteDialog.open} title="Delete Entry" message="Are you sure?" confirmLabel="Delete" confirmColor="error" onConfirm={handleDelete} onCancel={() => setDeleteDialog({ open: false, id: null })} />
//     </Box>
//   );
// };

// export default DaybookPage;

// import { useState, useEffect, useRef } from "react";
// import {
//   Box,
//   IconButton,
//   Tooltip,
//   Chip,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Grid,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Card,
//   CardContent,
//   Typography,
//   CircularProgress,
// } from "@mui/material";
// import { Edit, Delete, Download } from "@mui/icons-material";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
// import PageHeader from "../components/common/PageHeader";
// import DataTable from "../components/common/DataTable";
// import SearchFilters from "../components/common/SearchFilters";
// import ConfirmDialog from "../components/common/ConfirmDialog";
// import { daybookService, branchService } from "../api/services";
// import { useAuth } from "../context/AuthContext";
// import {
//   formatCurrency,
//   formatDate,
//   formatCategoryLabel,
// } from "../utils/formatters";
// import { DAYBOOK_TYPES, DAYBOOK_CATEGORIES } from "../utils/constants";

// const DaybookPage = () => {
//   const { isSuperAdmin, isAdmin } = useAuth();
//   const [entries, setEntries] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//   });
//   const [branches, setBranches] = useState([]);
//   const [filters, setFilters] = useState({
//     branchId: "",
//     category: "",
//     type: "",
//     startDate: null,
//     endDate: null,
//   });
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editEntry, setEditEntry] = useState(null);
//   const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
//   const [saving, setSaving] = useState(false);
//   const savingRef = useRef(false);
//   const [formData, setFormData] = useState({
//     branchId: "",
//     category: "misc",
//     type: "income",
//     amount: "",
//     dueAmount: "",
//     description: "",
//     remarks: "",
//     transactionRef: "",
//     date: new Date(),
//   });

//   useEffect(() => {
//     branchService.getActive().then((res) => setBranches(res.data.data));
//   }, []);
//   useEffect(() => {
//     fetchEntries();
//     fetchSummary();
//   }, [pagination.page, pagination.limit]);

//   const fetchEntries = async () => {
//     setLoading(true);
//     try {
//       const params = {
//         page: pagination.page,
//         limit: pagination.limit,
//         ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
//       };
//       if (params.startDate) params.startDate = params.startDate.toISOString();
//       if (params.endDate) params.endDate = params.endDate.toISOString();
//       const res = await daybookService.getAll(params);
//       setEntries(res.data.data);
//       setPagination((prev) => ({ ...prev, total: res.data.pagination.total }));
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSummary = async () => {
//     try {
//       const params = {
//         ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
//       };
//       if (params.startDate) params.startDate = params.startDate.toISOString();
//       if (params.endDate) params.endDate = params.endDate.toISOString();
//       const res = await daybookService.getSummary(params);
//       setSummary(res.data.data);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const handleSave = async () => {
//     if (savingRef.current) return;
//     savingRef.current = true;
//     setSaving(true);
//     try {
//       if (editEntry) await daybookService.update(editEntry._id, formData);
//       else await daybookService.create(formData);
//       setDialogOpen(false);
//       setEditEntry(null);
//       fetchEntries();
//       fetchSummary();
//     } catch (e) {
//       console.error(e);
//     } finally {
//       savingRef.current = false;
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await daybookService.delete(deleteDialog.id);
//       setDeleteDialog({ open: false, id: null });
//       fetchEntries();
//       fetchSummary();
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const handleExport = async () => {
//     try {
//       const params = {
//         ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
//       };
//       if (params.startDate) params.startDate = params.startDate.toISOString();
//       if (params.endDate) params.endDate = params.endDate.toISOString();
//       const res = await daybookService.export(params);
//       const csv = [
//         Object.keys(res.data.data[0] || {}).join(","),
//         ...res.data.data.map((row) => Object.values(row).join(",")),
//       ].join("\n");
//       const blob = new Blob([csv], { type: "text/csv" });
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `daybook_${new Date().toISOString().split("T")[0]}.csv`;
//       a.click();
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   const openAddDialog = () => {
//     setEditEntry(null);
//     setFormData({
//       branchId: branches[0]?._id || "",
//       category: "misc",
//       type: "income",
//       amount: 0,
//       dueAmount: 0,
//       description: "",
//       remarks: "",
//       transactionRef: "",
//       date: new Date(),
//     });
//     setDialogOpen(true);
//   };

//   const openEditDialog = (row) => {
//     setEditEntry(row);
//     setFormData({
//       ...row,
//       branchId: row.branchId?._id,
//       date: row.date ? new Date(row.date) : new Date(),
//       transactionRef: row.transactionRef || "",
//     });
//     setDialogOpen(true);
//   };

//   const columns = [
//     {
//       field: "date",
//       headerName: "Date",
//       minWidth: 100,
//       renderCell: (row) => formatDate(row.date),
//     },
//     {
//       field: "branch",
//       headerName: "Branch",
//       minWidth: 100,
//       renderCell: (row) => row.branchId?.code,
//     },
//     {
//       field: "category",
//       headerName: "Category",
//       minWidth: 180,
//       renderCell: (row) => formatCategoryLabel(row.category),
//     },
//     {
//       field: "type",
//       headerName: "Type",
//       minWidth: 80,
//       renderCell: (row) => (
//         <Chip
//           label={row.type}
//           size="small"
//           color={row.type === "income" ? "success" : "error"}
//         />
//       ),
//     },
//     { field: "description", headerName: "Description", minWidth: 200 },
//     {
//       field: "transactionRef",
//       headerName: "Transaction Ref",
//       minWidth: 140,
//       renderCell: (row) => row.transactionRef || "-",
//     },
//     {
//       field: "amount",
//       headerName: "Amount",
//       minWidth: 120,
//       align: "right",
//       renderCell: (row) => formatCurrency(row.amount),
//     },
//     {
//       field: "voucher",
//       headerName: "Voucher",
//       minWidth: 130,
//       renderCell: (row) => row.voucherId?.voucherNo || "-",
//     },
//     {
//       field: "actions",
//       headerName: "Actions",
//       minWidth: 100,
//       renderCell: (row) =>
//         (isSuperAdmin || isAdmin) && (
//           <Box>
//             <Tooltip title="Edit">
//               <IconButton size="small" onClick={() => openEditDialog(row)}>
//                 <Edit fontSize="small" />
//               </IconButton>
//             </Tooltip>
//             <Tooltip title="Delete">
//               <IconButton
//                 size="small"
//                 onClick={() => setDeleteDialog({ open: true, id: row._id })}
//               >
//                 <Delete fontSize="small" />
//               </IconButton>
//             </Tooltip>
//           </Box>
//         ),
//     },
//   ];

//   const filterConfig = [
//     {
//       field: "branchId",
//       label: "Branch",
//       options: branches.map((b) => ({ value: b._id, label: b.name })),
//     },
//     { field: "category", label: "Category", options: DAYBOOK_CATEGORIES },
//     { field: "type", label: "Type", options: DAYBOOK_TYPES },
//   ];

//   return (
//     <Box>
//       <PageHeader
//         title="Daybook"
//         subtitle="Track daily income and expenses"
//         actionLabel={isSuperAdmin || isAdmin ? "Add Entry" : null}
//         onActionClick={openAddDialog}
//       >
//         <Button
//           variant="outlined"
//           startIcon={<Download />}
//           onClick={handleExport}
//         >
//           Export CSV
//         </Button>
//       </PageHeader>

//       {summary && (
//         <Grid container spacing={2} sx={{ mb: 3 }}>
//           <Grid item xs={4}>
//             <Card>
//               <CardContent>
//                 <Typography variant="body2" color="text.secondary">
//                   Total Income
//                 </Typography>
//                 <Typography variant="h5" color="success.main">
//                   {formatCurrency(summary.totalIncome)}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//           <Grid item xs={4}>
//             <Card>
//               <CardContent>
//                 <Typography variant="body2" color="text.secondary">
//                   Total Expense
//                 </Typography>
//                 <Typography variant="h5" color="error.main">
//                   {formatCurrency(summary.totalExpense)}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//           <Grid item xs={4}>
//             <Card>
//               <CardContent>
//                 <Typography variant="body2" color="text.secondary">
//                   Net Profit
//                 </Typography>
//                 <Typography
//                   variant="h5"
//                   color={summary.netProfit >= 0 ? "success.main" : "error.main"}
//                 >
//                   {formatCurrency(summary.netProfit)}
//                 </Typography>
//               </CardContent>
//             </Card>
//           </Grid>
//         </Grid>
//       )}

//       <SearchFilters
//         filters={filterConfig}
//         values={filters}
//         onChange={setFilters}
//         onSearch={() => {
//           fetchEntries();
//           fetchSummary();
//         }}
//         showDateRange
//       />
//       <DataTable
//         columns={columns}
//         data={entries}
//         loading={loading}
//         pagination={pagination}
//         onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
//         onRowsPerPageChange={(l) =>
//           setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
//         }
//       />

//       <Dialog
//         open={dialogOpen}
//         onClose={() => setDialogOpen(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>{editEntry ? "Edit Entry" : "Add Entry"}</DialogTitle>
//         <DialogContent>
//           <Grid container spacing={2} sx={{ mt: 1 }}>
//             <Grid item xs={6}>
//               <DatePicker
//                 label="Date"
//                 value={formData.date ? new Date(formData.date) : null}
//                 onChange={(d) => setFormData({ ...formData, date: d })}
//                 slotProps={{ textField: { fullWidth: true } }}
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <FormControl fullWidth>
//                 <InputLabel>Branch</InputLabel>
//                 <Select
//                   value={formData.branchId}
//                   onChange={(e) =>
//                     setFormData({ ...formData, branchId: e.target.value })
//                   }
//                   label="Branch"
//                 >
//                   {branches.map((b) => (
//                     <MenuItem key={b._id} value={b._id}>
//                       {b.name}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={6}>
//               <FormControl fullWidth>
//                 <InputLabel>Type</InputLabel>
//                 <Select
//                   value={formData.type}
//                   onChange={(e) =>
//                     setFormData({ ...formData, type: e.target.value })
//                   }
//                   label="Type"
//                 >
//                   {DAYBOOK_TYPES.map((t) => (
//                     <MenuItem key={t.value} value={t.value}>
//                       {t.label}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={6}>
//               <FormControl fullWidth>
//                 <InputLabel>Category</InputLabel>
//                 <Select
//                   value={formData.category}
//                   onChange={(e) =>
//                     setFormData({ ...formData, category: e.target.value })
//                   }
//                   label="Category"
//                 >
//                   {DAYBOOK_CATEGORIES.map((c) => (
//                     <MenuItem key={c.value} value={c.value}>
//                       {c.label}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 fullWidth
//                 label="Amount"
//                 type="number"
//                 value={formData.amount || ''}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     amount: parseFloat(e.target.value) || 0,
//                   })
//                 }
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 fullWidth
//                 label="Due Amount"
//                 type="number"
//                 value={formData.dueAmount || ''}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     dueAmount: parseFloat(e.target.value) || 0,
//                   })
//                 }
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Transaction Reference"
//                 value={formData.transactionRef}
//                 onChange={(e) =>
//                   setFormData({ ...formData, transactionRef: e.target.value })
//                 }
//                 placeholder="UTR / Check No / Reference"
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Description"
//                 value={formData.description}
//                 onChange={(e) =>
//                   setFormData({ ...formData, description: e.target.value })
//                 }
//               />
//             </Grid>
//             <Grid item xs={12}>
//               <TextField
//                 fullWidth
//                 label="Remarks"
//                 multiline
//                 rows={2}
//                 value={formData.remarks}
//                 onChange={(e) =>
//                   setFormData({ ...formData, remarks: e.target.value })
//                 }
//               />
//             </Grid>
//           </Grid>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
//           <Button
//             variant="contained"
//             onClick={handleSave}
//             disabled={saving}
//             startIcon={
//               saving ? <CircularProgress size={16} color="inherit" /> : null
//             }
//           >
//             {saving ? "Saving..." : "Save"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <ConfirmDialog
//         open={deleteDialog.open}
//         title="Delete Entry"
//         message="Are you sure?"
//         confirmLabel="Delete"
//         confirmColor="error"
//         onConfirm={handleDelete}
//         onCancel={() => setDeleteDialog({ open: false, id: null })}
//       />
//     </Box>
//   );
// };

// export default DaybookPage;

import { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListSubheader,
  Paper,
  Alert,
} from "@mui/material";
import {
  Edit,
  Delete,
  Download,
  AttachFile,
  CloudUpload,
  InsertDriveFile,
  Close,
  DeleteSweep,
  Warning,
  AccountBalance,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import PageHeader from "../components/common/PageHeader";
import DataTable from "../components/common/DataTable";
import SearchFilters from "../components/common/SearchFilters";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { daybookService, branchService } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  DAYBOOK_TRANSACTION_TYPES,
  DAYBOOK_EXPENSE_CATEGORY_GROUPS,
  DAYBOOK_RECEIPT_CATEGORY_GROUPS,
  DAYBOOK_ACCOUNTS,
  DAYBOOK_CATEGORIES,
} from "../utils/constants";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 2019 }, (_, i) => 2020 + i);

const DaybookPage = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branchId: "",
    transactionType: "",
    startDate: null,
    endDate: null,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [uploading, setUploading] = useState(false);
  const [monthYear, setMonthYear] = useState({ month: "", year: THIS_YEAR });
  const [formData, setFormData] = useState({
    branchId: "",
    transactionType: "expense",
    category: "",
    account: "Cash",
    paymentMonth: "",
    amount: 0,
    description: "",
    remarks: "",
    transactionRef: "",
    paidTo: "",
    date: new Date(),
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearBranchId, setClearBranchId] = useState("");
  const [clearType, setClearType] = useState("soft");
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearSuccess, setClearSuccess] = useState("");
  const [obDialogOpen, setObDialogOpen] = useState(false);
  const [obForm, setObForm] = useState({
    branchId: "",
    amount: "",
    date: new Date(),
    description: "",
  });
  const [obCurrent, setObCurrent] = useState(null);
  const [obLoading, setObLoading] = useState(false);
  const [obError, setObError] = useState("");

  useEffect(() => {
    branchService.getActive().then((res) => setBranches(res.data.data));
  }, []);
  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, [pagination.page, pagination.limit]);

  const fetchEntries = async (overrideFilters) => {
    setLoading(true);
    const activeFilters = overrideFilters ?? filters;
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(activeFilters).filter(([_, v]) => v)
        ),
      };
      if (params.startDate instanceof Date)
        params.startDate = params.startDate.toISOString();
      if (params.endDate instanceof Date)
        params.endDate = params.endDate.toISOString();
      // Opening Balance is filtered by category, not transactionType
      if (params.transactionType === "opening_balance") {
        delete params.transactionType;
        params.category = "opening_balance";
      }
      const res = await daybookService.getAll(params);
      setEntries(res.data.data);
      setPagination((prev) => ({ ...prev, total: res.data.pagination.total }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (overrideFilters) => {
    const activeFilters = overrideFilters ?? filters;
    try {
      const params = {
        ...Object.fromEntries(
          Object.entries(activeFilters).filter(([_, v]) => v)
        ),
      };
      if (params.startDate instanceof Date)
        params.startDate = params.startDate.toISOString();
      if (params.endDate instanceof Date)
        params.endDate = params.endDate.toISOString();
      const res = await daybookService.getSummary(params);
      setSummary(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMonthYearChange = (field, value) => {
    const updated = { ...monthYear, [field]: value };
    setMonthYear(updated);
    const newFilters = { ...filters };
    if (updated.month) {
      newFilters.startDate = new Date(updated.year, updated.month - 1, 1);
      newFilters.endDate = new Date(updated.year, updated.month, 0, 23, 59, 59);
    } else {
      newFilters.startDate = null;
      newFilters.endDate = null;
    }
    setFilters(newFilters);
    fetchEntries(newFilters);
    fetchSummary(newFilters);
  };

  const handleSave = async () => {
    try {
      let entry;
      if (editEntry) {
        entry = await daybookService.update(editEntry._id, formData);
      } else {
        entry = await daybookService.create(formData);
      }

      // Upload attachment if selected
      if (attachmentFile && entry.data?.data?._id) {
        await handleUploadAttachment(entry.data.data._id);
      }

      setDialogOpen(false);
      setEditEntry(null);
      setAttachmentFile(null);
      fetchEntries();
      fetchSummary();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadAttachment = async (entryId) => {
    if (!attachmentFile) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", attachmentFile);
      await daybookService.uploadAttachment(entryId, formDataUpload);
    } catch (e) {
      console.error("Error uploading attachment:", e);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (entryId, attachmentId) => {
    try {
      await daybookService.removeAttachment(entryId, attachmentId);
      fetchEntries();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenClearDialog = () => {
    setClearDialogOpen(true);
    setClearBranchId("");
    setClearType("soft");
    setClearError("");
    setClearSuccess("");
  };

  const handleCloseClearDialog = () => {
    setClearDialogOpen(false);
    setClearError("");
    setClearSuccess("");
  };

  const handleClearDaybook = async () => {
    setClearLoading(true);
    setClearError("");
    setClearSuccess("");
    try {
      const params = clearBranchId ? { branchId: clearBranchId } : {};
      const res =
        clearType === "hard"
          ? await daybookService.hardClear(params)
          : await daybookService.clear(params);
      setClearSuccess(
        res.data.message ||
          `${res.data.data.deletedCount} entries cleared successfully`
      );
      setTimeout(() => {
        fetchEntries();
        fetchSummary();
        handleCloseClearDialog();
      }, 1500);
    } catch (e) {
      setClearError(e.response?.data?.message || "Failed to clear daybook");
    } finally {
      setClearLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await daybookService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchEntries();
      fetchSummary();
    } catch (e) {
      console.error(e);
    }
  };

  const openObDialog = async () => {
    const defaultBranch = branches[0]?._id || "";
    setObForm({
      branchId: defaultBranch,
      amount: "",
      date: new Date(),
      description: "",
      account: "Cash",
    });
    setObError("");
    setObCurrent(null);
    if (defaultBranch) {
      try {
        const res = await daybookService.getOpeningBalance(defaultBranch);
        setObCurrent(res.data.data);
      } catch {}
    }
    setObDialogOpen(true);
  };

  const handleObBranchChange = async (branchId) => {
    setObForm((f) => ({ ...f, branchId }));
    setObCurrent(null);
    if (branchId) {
      try {
        const res = await daybookService.getOpeningBalance(branchId);
        setObCurrent(res.data.data);
      } catch {}
    }
  };

  const handleObSave = async () => {
    if (!obForm.branchId || !obForm.amount) {
      setObError("Branch and amount are required.");
      return;
    }
    setObLoading(true);
    setObError("");
    try {
      await daybookService.setOpeningBalance({
        branchId: obForm.branchId,
        amount: parseFloat(obForm.amount),
        date: obForm.date,
        description: obForm.description || "Opening Balance",
        account: obForm.account || "Cash",
      });
      setObDialogOpen(false);
      fetchEntries();
      fetchSummary();
    } catch (e) {
      setObError(e.response?.data?.message || "Failed to set opening balance.");
    } finally {
      setObLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      };
      if (params.startDate)
        params.startDate = new Date(params.startDate).toISOString();
      if (params.endDate)
        params.endDate = new Date(params.endDate).toISOString();
      const res = await daybookService.export(params);
      const csv = [
        Object.keys(res.data.data[0] || {}).join(","),
        ...res.data.data.map((row) => Object.values(row).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daybook_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddDialog = () => {
    setEditEntry(null);
    setAttachmentFile(null);
    setFormData({
      branchId: branches[0]?._id || "",
      transactionType: "expense",
      category: "",
      account: "Cash",
      paymentMonth: "",
      amount: 0,
      description: "",
      remarks: "",
      transactionRef: "",
      paidTo: "",
      date: new Date(),
    });
    setDialogOpen(true);
  };

  const openEditDialog = (row) => {
    setEditEntry(row);
    setAttachmentFile(null);
    setFormData({
      branchId: row.branchId?._id || "",
      transactionType: row.transactionType || "expense",
      category: row.category || "",
      account: row.account || "Cash",
      paymentMonth: row.paymentMonth || "",
      amount: row.amount || 0,
      description: row.description || "",
      remarks: row.remarks || "",
      transactionRef: row.transactionRef || "",
      paidTo: row.paidTo || "",
      date: row.date ? new Date(row.date) : new Date(),
    });
    setDialogOpen(true);
  };

  // Get transaction type for display (amount color)
  const getRowType = (row) => {
    if (row.transactionType) return row.transactionType;
    const incomeCategories = [
      "received_from_student",
      "received_from_college_service_charge",
      "service_charge_income",
    ];
    return incomeCategories.includes(row.category) ? "income" : "expense";
  };

  const isOpeningBalance = (row) =>
    row.category === "opening_balance" ||
    row.transactionType === "opening_balance";

  // Compute per-row running balances from the visible entries (sorted by date asc)
  const entriesWithBalances = (() => {
    let bankBal = 0;
    let cashBal = 0;
    return [...entries]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((row) => {
        const type = getRowType(row);
        const amt = row.amount || 0;
        const account = (row.account || "").toLowerCase();
        // Opening balance initialises the respective account balance
        if (isOpeningBalance(row)) {
          if (account === "bank") bankBal += amt;
          else cashBal += amt; // cash / petty cash / unspecified
        } else if (type === "income") {
          if (account === "bank") bankBal += amt;
          else if (account === "cash" || account === "petty cash")
            cashBal += amt;
        } else if (type === "expense") {
          if (account === "bank") bankBal -= amt;
          else if (account === "cash" || account === "petty cash")
            cashBal -= amt;
        }
        return {
          ...row,
          _bankBal: bankBal,
          _cashBal: cashBal,
          _totalBal: bankBal + cashBal,
        };
      });
  })();

  // Restore original display order after computing balances
  const balanceMap = Object.fromEntries(
    entriesWithBalances.map((r) => [r._id, r])
  );

  const columns = [
    {
      field: "date",
      headerName: "Date",
      minWidth: 100,
      renderCell: (row) => formatDate(row.date),
    },
    {
      field: "branch",
      headerName: "Branch",
      minWidth: 80,
      renderCell: (row) => row.branchId?.code || "-",
    },
    {
      field: "type",
      headerName: "Type",
      minWidth: 110,
      renderCell: (row) => {
        if (row.category === "opening_balance") return "Opening Balance";
        const map = {
          income: "Receipt",
          expense: "Payment",
          transfer: "Transfer",
          asset: "Journal",
        };
        return map[row.transactionType] || row.transactionType || "-";
      },
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 160,
      renderCell: (row) => {
        if (!row.category || row.category === "opening_balance") return "-";
        return (
          DAYBOOK_CATEGORIES.find((c) => c.value === row.category)?.label ||
          row.category
        );
      },
    },
    { field: "description", headerName: "Description", minWidth: 200 },
    {
      field: "paidTo",
      headerName: "Paid To / Received From",
      minWidth: 160,
      renderCell: (row) => row.paidTo || "-",
    },
    {
      field: "account",
      headerName: "Mode",
      minWidth: 100,
      renderCell: (row) => row.account || "-",
    },
    {
      field: "transactionRef",
      headerName: "Transaction No",
      minWidth: 140,
      renderCell: (row) => row.transactionRef || "-",
    },
    {
      field: "debit",
      headerName: "Debit",
      minWidth: 110,
      align: "right",
      renderCell: (row) => {
        const type = getRowType(row);
        return type === "expense" ? (
          <Typography color="error.main" fontWeight={500}>
            {formatCurrency(row.amount)}
          </Typography>
        ) : (
          "-"
        );
      },
    },
    {
      field: "credit",
      headerName: "Credit",
      minWidth: 110,
      align: "right",
      renderCell: (row) => {
        const type = getRowType(row);
        // Opening balance is a credit entry (initialises the account balance)
        if (isOpeningBalance(row)) {
          return (
            <Typography color="success.main" fontWeight={500}>
              {formatCurrency(row.amount)}
            </Typography>
          );
        }
        return type === "income" ? (
          <Typography color="success.main" fontWeight={500}>
            {formatCurrency(row.amount)}
          </Typography>
        ) : (
          "-"
        );
      },
    },
    {
      field: "bankBalance",
      headerName: "Bank Balance",
      minWidth: 120,
      align: "right",
      renderCell: (row) => {
        const r = balanceMap[row._id];
        return r ? formatCurrency(r._bankBal) : "-";
      },
    },
    {
      field: "cashBalance",
      headerName: "Cash Balance",
      minWidth: 120,
      align: "right",
      renderCell: (row) => {
        const r = balanceMap[row._id];
        return r ? formatCurrency(r._cashBal) : "-";
      },
    },
    {
      field: "totalBalance",
      headerName: "Total Balance",
      minWidth: 120,
      align: "right",
      renderCell: (row) => {
        const r = balanceMap[row._id];
        return r ? (
          <Typography fontWeight={600}>
            {formatCurrency(r._totalBal)}
          </Typography>
        ) : (
          "-"
        );
      },
    },
    {
      field: "voucher",
      headerName: "Voucher No",
      minWidth: 130,
      renderCell: (row) => row.voucherId?.voucherNo || "-",
    },
    {
      field: "attachments",
      headerName: "Bill",
      minWidth: 60,
      align: "center",
      renderCell: (row) =>
        row.attachments && row.attachments.length > 0 ? (
          <Tooltip title={`${row.attachments.length} attachment(s)`}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  daybookService.getAttachment(row._id, row.attachments[0]._id),
                  "_blank"
                );
              }}
            >
              <AttachFile fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      renderCell: (row) =>
        (isSuperAdmin || isAdmin) && (
          <Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => openEditDialog(row)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => setDeleteDialog({ open: true, id: row._id })}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
    },
  ];

  const filterConfig = [
    {
      field: "branchId",
      label: "Branch",
      options: branches.map((b) => ({ value: b._id, label: b.name })),
    },
    {
      field: "transactionType",
      label: "Type",
      options: DAYBOOK_TRANSACTION_TYPES,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Daybook"
        subtitle="Track daily income and expenses"
        actionLabel={isSuperAdmin || isAdmin ? "Add Entry" : null}
        onActionClick={openAddDialog}
      >
        {(isSuperAdmin || isAdmin) && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AccountBalance />}
            onClick={openObDialog}
          >
            Opening Balance
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
        >
          Export CSV
        </Button>
        {isSuperAdmin && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={handleOpenClearDialog}
          >
            Clear Daybook
          </Button>
        )}
      </PageHeader>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total Receipts
                </Typography>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(summary.totalIncome)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total Payments
                </Typography>
                <Typography variant="h5" color="error.main">
                  {formatCurrency(summary.totalExpense)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Net Cash Flow
                </Typography>
                <Typography
                  variant="h5"
                  color={summary.netProfit >= 0 ? "success.main" : "error.main"}
                >
                  {formatCurrency(summary.netProfit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Opening Balance
                </Typography>
                <Typography
                  variant="h5"
                  color={summary.openingBalance >= 0 ? "primary.main" : "error.main"}
                >
                  {formatCurrency(summary.openingBalance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Closing Balance
                </Typography>
                <Typography
                  variant="h5"
                  color={summary.closingBalance >= 0 ? "success.main" : "error.main"}
                >
                  {formatCurrency(summary.closingBalance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Month Filter:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={monthYear.month}
            onChange={(e) => handleMonthYearChange("month", e.target.value)}
            label="Month"
          >
            <MenuItem value="">All Months</MenuItem>
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={monthYear.year}
            onChange={(e) => handleMonthYearChange("year", e.target.value)}
            label="Year"
          >
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
      <SearchFilters
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onSearch={() => {
          fetchEntries();
          fetchSummary();
        }}
        showDateRange
      />
      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) =>
          setPagination((prev) => ({ ...prev, limit: l, page: 1 }))
        }
      />

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editEntry ? "Edit Entry" : "Add Entry"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <DatePicker
                label="Date"
                value={formData.date ? new Date(formData.date) : null}
                onChange={(d) => setFormData({ ...formData, date: d })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({ ...formData, branchId: e.target.value })
                  }
                  label="Branch"
                >
                  {branches.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={(formData.transactionType === "expense" || formData.transactionType === "income") ? 6 : 12}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={formData.transactionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionType: e.target.value,
                      category: "",
                    })
                  }
                  label="Transaction Type"
                >
                  {DAYBOOK_TRANSACTION_TYPES.filter(
                    (t) => t.value !== "opening_balance"
                  ).map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {formData.transactionType === "expense" && (
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Expense Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    label="Expense Category"
                  >
                    {DAYBOOK_EXPENSE_CATEGORY_GROUPS.map((group) => [
                      <ListSubheader key={group.group}>
                        {group.group}
                      </ListSubheader>,
                      ...group.items.map((item) => (
                        <MenuItem
                          key={item.value}
                          value={item.value}
                          sx={{ pl: 3 }}
                        >
                          {item.label}
                        </MenuItem>
                      )),
                    ])}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {formData.transactionType === "income" && (
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Receipt Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    label="Receipt Category"
                  >
                    <MenuItem value="">— General Receipt —</MenuItem>
                    {DAYBOOK_RECEIPT_CATEGORY_GROUPS.map((group) => [
                      <ListSubheader key={group.group}>
                        {group.group}
                      </ListSubheader>,
                      ...group.items.map((item) => (
                        <MenuItem
                          key={item.value}
                          value={item.value}
                          sx={{ pl: 3 }}
                        >
                          {item.label}
                        </MenuItem>
                      )),
                    ])}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.account}
                  onChange={(e) =>
                    setFormData({ ...formData, account: e.target.value })
                  }
                  label="Account"
                >
                  {DAYBOOK_ACCOUNTS.map((a) => (
                    <MenuItem key={a.value} value={a.value}>
                      {a.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Month</InputLabel>
                <Select
                  value={formData.paymentMonth}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMonth: e.target.value })
                  }
                  label="Payment Month"
                >
                  <MenuItem value="">— None —</MenuItem>
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.label}>
                      {m.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || "",
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Transaction Reference"
                value={formData.transactionRef}
                onChange={(e) =>
                  setFormData({ ...formData, transactionRef: e.target.value })
                }
                placeholder="UTR / Check No / Reference"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Paid To"
                value={formData.paidTo}
                onChange={(e) =>
                  setFormData({ ...formData, paidTo: e.target.value })
                }
                placeholder="Enter recipient name"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </Grid>

            {/* Bill Attachment */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Bill / Attachment
              </Typography>
              {editEntry?.attachments?.length > 0 && (
                <List dense sx={{ mb: 1 }}>
                  {editEntry.attachments.map((att) => (
                    <ListItem key={att._id} disablePadding>
                      <InsertDriveFile
                        fontSize="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                      <ListItemText
                        primary={att.originalName}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() =>
                            handleRemoveAttachment(editEntry._id, att._id)
                          }
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 2,
                  textAlign: "center",
                }}
              >
                {attachmentFile ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <InsertDriveFile color="primary" />
                    <Typography variant="body2">
                      {attachmentFile.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setAttachmentFile(null)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    component="label"
                    startIcon={<CloudUpload />}
                    variant="outlined"
                  >
                    Upload Bill
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => setAttachmentFile(e.target.files[0])}
                    />
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={uploading}>
            {uploading ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Entry"
        message="Are you sure you want to delete this entry?"
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />

      {/* Opening Balance Dialog */}
      <Dialog
        open={obDialogOpen}
        onClose={() => setObDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set Opening Balance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={obForm.branchId}
                  onChange={(e) => handleObBranchChange(e.target.value)}
                  label="Branch"
                >
                  {branches.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {obCurrent && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Current opening balance:{" "}
                  <strong>{formatCurrency(obCurrent.amount)}</strong> (set on{" "}
                  {formatDate(obCurrent.date)}). Saving will replace it.
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <DatePicker
                label="As of Date"
                value={obForm.date}
                onChange={(d) => setObForm((f) => ({ ...f, date: d }))}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Account</InputLabel>
                <Select
                  value={obForm.account || "Cash"}
                  onChange={(e) => setObForm((f) => ({ ...f, account: e.target.value }))}
                  label="Account"
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank">Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Opening Balance Amount"
                type="number"
                fullWidth
                size="small"
                value={obForm.amount}
                onChange={(e) =>
                  setObForm((f) => ({ ...f, amount: e.target.value }))
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description (optional)"
                fullWidth
                size="small"
                value={obForm.description}
                onChange={(e) =>
                  setObForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Grid>
            {obError && (
              <Grid item xs={12}>
                <Alert severity="error">{obError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setObDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleObSave}
            disabled={obLoading}
          >
            {obLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Daybook Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={handleCloseClearDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="error" />
          Clear Daybook
        </DialogTitle>
        <DialogContent>
          {clearError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {clearError}
            </Alert>
          )}
          {clearSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {clearSuccess}
            </Alert>
          )}
          <Alert severity="warning" sx={{ mb: 3 }}>
            This action will delete daybook entries. Please proceed with
            caution.
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
                  {branches.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
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
              <Typography
                variant="caption"
                color={clearType === "hard" ? "error" : "text.secondary"}
              >
                {clearType === "soft"
                  ? "Entries will be marked as deleted but can be recovered from database"
                  : "⚠️ WARNING: Entries will be permanently deleted and cannot be recovered!"}
              </Typography>
            </Grid>
          </Grid>
          {clearType === "hard" && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Permanent Deletion Warning!</strong>
              <br />
              You are about to permanently delete{" "}
              {clearBranchId
                ? "all entries for the selected branch"
                : "ALL daybook entries"}
              . This action cannot be undone!
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
            onClick={handleClearDaybook}
            disabled={clearLoading}
            startIcon={<DeleteSweep />}
          >
            {clearLoading
              ? "Clearing..."
              : `Clear${clearType === "hard" ? " Permanently" : ""}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DaybookPage;
