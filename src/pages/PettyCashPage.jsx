import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Tab, Tabs, Alert, CircularProgress,
  ListSubheader, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip,
} from '@mui/material';
import { Add, SwapHoriz, AccountBalanceWallet, TrendingUp, TrendingDown, Refresh } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import PageHeader from '../components/common/PageHeader';
import { daybookService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatCategoryLabel } from '../utils/formatters';
import { DAYBOOK_EXPENSE_CATEGORY_GROUPS } from '../utils/constants';

const LARGE_LIMIT = 500;

const emptyTransferForm = {
  branchId: '',
  sourceAccount: 'Cash',
  amount: '',
  date: new Date(),
  transactionRef: '',
  description: '',
  remarks: '',
};

const emptyExpenseForm = {
  category: '',
  amount: '',
  date: new Date(),
  transactionRef: '',
  description: '',
  remarks: '',
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function BalanceCard({ title, amount, color = 'text.primary', icon }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {icon}
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
        <Typography variant="h5" color={color} fontWeight="bold">
          {formatCurrency(amount)}
        </Typography>
      </CardContent>
    </Card>
  );
}

const PettyCashPage = () => {
  const { user, isSuperAdmin, isAdmin, isStaff } = useAuth();
  const isAdminOrSuper = isSuperAdmin || isAdmin;

  const [activeTab, setActiveTab] = useState(0);
  const [branches, setBranches] = useState([]);

  // Dashboard state
  const [dashBranch, setDashBranch] = useState('');
  const [receivedEntries, setReceivedEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);

  // Transfer form state (admin only)
  const [transferForm, setTransferForm] = useState(emptyTransferForm);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  // Expense dialog state (staff/all)
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState('');

  // Summary state (admin)
  const [summaryData, setSummaryData] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    branchService.getActive().then(res => {
      const b = res.data.data;
      setBranches(b);
      if (isStaff && !isAdminOrSuper && user?.branches?.length > 0) {
        setDashBranch(user.branches[0]._id);
      }
    });
  }, []);

  // Auto-fetch dashboard when branch changes
  useEffect(() => {
    if (dashBranch || isAdminOrSuper) {
      fetchDashboard(dashBranch);
    }
  }, [dashBranch]);

  const fetchDashboard = useCallback(async (branchId) => {
    setDashLoading(true);
    try {
      const params = { limit: LARGE_LIMIT };
      if (branchId) params.branchId = branchId;

      const res = await daybookService.getPettyCash(params);
      const { received = [], expenses = [] } = res.data.data || {};
      setReceivedEntries(received);
      setExpenseEntries(expenses);
    } catch (e) {
      console.error(e);
    } finally {
      setDashLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await daybookService.getPettyCash({ limit: LARGE_LIMIT });
      const { received = [], expenses = [] } = res.data.data || {};

      const given = {};
      const utilized = {};

      received.forEach(e => {
        const bid = e.branchId?._id || e.branchId;
        const bname = e.branchId?.name || 'Unknown';
        if (!given[bid]) given[bid] = { name: bname, total: 0 };
        given[bid].total += e.amount;
      });

      expenses.forEach(e => {
        const bid = e.branchId?._id || e.branchId;
        const bname = e.branchId?.name || 'Unknown';
        if (!utilized[bid]) utilized[bid] = { name: bname, total: 0 };
        utilized[bid].total += e.amount;
      });

      const allBranchIds = new Set([...Object.keys(given), ...Object.keys(utilized)]);
      const rows = [...allBranchIds].map(bid => ({
        branchId: bid,
        branchName: given[bid]?.name || utilized[bid]?.name || 'Unknown',
        totalGiven: given[bid]?.total || 0,
        totalUtilized: utilized[bid]?.total || 0,
        remaining: (given[bid]?.total || 0) - (utilized[bid]?.total || 0),
      }));

      setSummaryData(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load summary when that tab is opened
  const handleTabChange = (_, newVal) => {
    setActiveTab(newVal);
    if (newVal === (isAdminOrSuper ? 2 : -1) || (isAdminOrSuper && newVal === 2)) {
      fetchSummary();
    }
  };

  const totalReceived = receivedEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const totalSpent = expenseEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalReceived - totalSpent;

  const handleTransferChange = (field, value) => {
    setTransferForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTransferSubmit = async () => {
    setTransferError('');
    setTransferSuccess('');
    if (!transferForm.branchId) { setTransferError('Please select a branch.'); return; }
    if (!transferForm.amount || Number(transferForm.amount) <= 0) { setTransferError('Please enter a valid amount.'); return; }

    setTransferLoading(true);
    try {
      const payload = {
        branchId: transferForm.branchId,
        transactionType: 'transfer',
        account: 'Petty Cash',
        amount: Number(transferForm.amount),
        date: transferForm.date instanceof Date ? transferForm.date.toISOString() : transferForm.date,
        description: transferForm.description || `Petty cash transfer from ${transferForm.sourceAccount}`,
        remarks: transferForm.remarks,
        transactionRef: transferForm.transactionRef,
        paymentMode: transferForm.sourceAccount === 'Bank' ? 'BankTransfer' : 'Cash',
      };
      await daybookService.create(payload);
      setTransferSuccess('Petty cash transferred successfully!');
      setTransferForm(emptyTransferForm);
      // Refresh dashboard if viewing same branch
      if (dashBranch === transferForm.branchId || !dashBranch) {
        fetchDashboard(dashBranch);
      }
    } catch (e) {
      setTransferError(e.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleExpenseChange = (field, value) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }));
  };

  const handleExpenseSubmit = async () => {
    setExpenseError('');
    if (!expenseForm.category) { setExpenseError('Please select a category.'); return; }
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) { setExpenseError('Please enter a valid amount.'); return; }
    if (Number(expenseForm.amount) > balance) { setExpenseError(`Amount exceeds available balance (${formatCurrency(balance)}).`); return; }

    const branchId = dashBranch || (user?.branches?.[0]?._id);
    if (!branchId) { setExpenseError('No branch assigned.'); return; }

    setExpenseLoading(true);
    try {
      const payload = {
        branchId,
        transactionType: 'expense',
        account: 'Petty Cash',
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        date: expenseForm.date instanceof Date ? expenseForm.date.toISOString() : expenseForm.date,
        description: expenseForm.description,
        remarks: expenseForm.remarks,
        transactionRef: expenseForm.transactionRef,
        paymentMode: 'Cash',
      };
      await daybookService.create(payload);
      setExpenseOpen(false);
      setExpenseForm(emptyExpenseForm);
      fetchDashboard(dashBranch);
    } catch (e) {
      setExpenseError(e.response?.data?.message || 'Failed to add expense. Please try again.');
    } finally {
      setExpenseLoading(false);
    }
  };

  const tabs = isAdminOrSuper
    ? ['Dashboard', 'Transfer', 'Summary']
    : ['Dashboard'];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <PageHeader title="Petty Cash" subtitle="Manage petty cash transfers and expenses">
          {!isAdminOrSuper && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => { setExpenseForm(emptyExpenseForm); setExpenseError(''); setExpenseOpen(true); }}
            >
              Add Expense
            </Button>
          )}
        </PageHeader>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
          {tabs.map(t => <Tab key={t} label={t} />)}
        </Tabs>

        {/* ── DASHBOARD TAB ── */}
        <TabPanel value={activeTab} index={0}>
          {/* Branch selector (admin sees all, staff fixed) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            {isAdminOrSuper ? (
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={dashBranch}
                  onChange={e => setDashBranch(e.target.value)}
                  label="Branch"
                >
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="subtitle1" fontWeight="medium">
                Branch: {branches.find(b => b._id === dashBranch)?.name || '—'}
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => fetchDashboard(dashBranch)}
              disabled={dashLoading}
            >
              Refresh
            </Button>
            {isAdminOrSuper && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => { setExpenseForm(emptyExpenseForm); setExpenseError(''); setExpenseOpen(true); }}
              >
                Add Expense
              </Button>
            )}
          </Box>

          {dashLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              {/* Balance Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <BalanceCard
                    title="Total Received"
                    amount={totalReceived}
                    color="success.main"
                    icon={<TrendingUp color="success" />}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <BalanceCard
                    title="Total Spent"
                    amount={totalSpent}
                    color="error.main"
                    icon={<TrendingDown color="error" />}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <BalanceCard
                    title="Available Balance"
                    amount={balance}
                    color={balance >= 0 ? 'primary.main' : 'error.main'}
                    icon={<AccountBalanceWallet color={balance >= 0 ? 'primary' : 'error'} />}
                  />
                </Grid>
              </Grid>

              {/* Received History */}
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Received History</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Date</TableCell>
                      {isAdminOrSuper && !dashBranch && <TableCell>Branch</TableCell>}
                      <TableCell>Description</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receivedEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No received entries
                        </TableCell>
                      </TableRow>
                    ) : receivedEntries.map(row => (
                      <TableRow key={row._id} hover>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        {isAdminOrSuper && !dashBranch && <TableCell>{row.branchId?.name || '-'}</TableCell>}
                        <TableCell>{row.description || '-'}</TableCell>
                        <TableCell>{row.transactionRef || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography color="success.main" fontWeight="medium">
                            {formatCurrency(row.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Expense History */}
              <Typography variant="h6" fontWeight="medium" sx={{ mb: 1 }}>Expense History</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Date</TableCell>
                      {isAdminOrSuper && !dashBranch && <TableCell>Branch</TableCell>}
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenseEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No expense entries
                        </TableCell>
                      </TableRow>
                    ) : expenseEntries.map(row => (
                      <TableRow key={row._id} hover>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        {isAdminOrSuper && !dashBranch && <TableCell>{row.branchId?.name || '-'}</TableCell>}
                        <TableCell>{formatCategoryLabel(row.category)}</TableCell>
                        <TableCell>{row.description || '-'}</TableCell>
                        <TableCell>{row.transactionRef || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography color="error.main" fontWeight="medium">
                            {formatCurrency(row.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </TabPanel>

        {/* ── TRANSFER TAB (admin only) ── */}
        {isAdminOrSuper && (
          <TabPanel value={activeTab} index={1}>
            <Card sx={{ maxWidth: 680 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <SwapHoriz color="primary" />
                  <Typography variant="h6" fontWeight="medium">Transfer to Petty Cash</Typography>
                </Box>

                {transferError && <Alert severity="error" sx={{ mb: 2 }}>{transferError}</Alert>}
                {transferSuccess && <Alert severity="success" sx={{ mb: 2 }}>{transferSuccess}</Alert>}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Branch</InputLabel>
                      <Select
                        value={transferForm.branchId}
                        onChange={e => handleTransferChange('branchId', e.target.value)}
                        label="Branch"
                      >
                        {branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Source Account</InputLabel>
                      <Select
                        value={transferForm.sourceAccount}
                        onChange={e => handleTransferChange('sourceAccount', e.target.value)}
                        label="Source Account"
                      >
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="Bank">Bank</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Destination Account"
                      value="Petty Cash"
                      fullWidth
                      disabled
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Amount"
                      type="number"
                      fullWidth
                      required
                      value={transferForm.amount}
                      onChange={e => handleTransferChange('amount', e.target.value)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Date"
                      value={transferForm.date}
                      onChange={val => handleTransferChange('date', val)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Transaction Reference"
                      fullWidth
                      value={transferForm.transactionRef}
                      onChange={e => handleTransferChange('transactionRef', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      value={transferForm.description}
                      onChange={e => handleTransferChange('description', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Remarks"
                      fullWidth
                      multiline
                      rows={2}
                      value={transferForm.remarks}
                      onChange={e => handleTransferChange('remarks', e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button onClick={() => { setTransferForm(emptyTransferForm); setTransferError(''); setTransferSuccess(''); }}>
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleTransferSubmit}
                    disabled={transferLoading}
                    startIcon={<SwapHoriz />}
                  >
                    {transferLoading ? 'Transferring...' : 'Transfer'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        )}

        {/* ── SUMMARY TAB (admin only) ── */}
        {isAdminOrSuper && (
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="medium">Per-Branch Summary</Typography>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchSummary} disabled={summaryLoading}>
                Refresh
              </Button>
            </Box>

            {summaryLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Branch</strong></TableCell>
                      <TableCell align="right"><strong>Total Given</strong></TableCell>
                      <TableCell align="right"><strong>Total Utilized</strong></TableCell>
                      <TableCell align="right"><strong>Remaining Balance</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No petty cash data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {summaryData.map(row => (
                          <TableRow key={row.branchId} hover>
                            <TableCell>{row.branchName}</TableCell>
                            <TableCell align="right">
                              <Typography color="success.main">{formatCurrency(row.totalGiven)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="error.main">{formatCurrency(row.totalUtilized)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={formatCurrency(row.remaining)}
                                color={row.remaining >= 0 ? 'success' : 'error'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right">
                            <Typography color="success.main" fontWeight="bold">
                              {formatCurrency(summaryData.reduce((s, r) => s + r.totalGiven, 0))}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error.main" fontWeight="bold">
                              {formatCurrency(summaryData.reduce((s, r) => s + r.totalUtilized, 0))}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">
                              {formatCurrency(summaryData.reduce((s, r) => s + r.remaining, 0))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        )}

        {/* ── ADD EXPENSE DIALOG ── */}
        <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Petty Cash Expense</DialogTitle>
          <DialogContent>
            {expenseError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{expenseError}</Alert>}

            <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
              Available Balance: <strong>{formatCurrency(balance)}</strong>
            </Alert>

            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={expenseForm.category}
                    onChange={e => handleExpenseChange('category', e.target.value)}
                    label="Category"
                  >
                    {DAYBOOK_EXPENSE_CATEGORY_GROUPS.map(group => [
                      <ListSubheader key={group.group}>{group.group}</ListSubheader>,
                      ...group.items.map(item => (
                        <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                      )),
                    ])}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount"
                  type="number"
                  fullWidth
                  required
                  value={expenseForm.amount}
                  onChange={e => handleExpenseChange('amount', e.target.value)}
                  inputProps={{ min: 0, max: balance }}
                  helperText={`Max: ${formatCurrency(balance)}`}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={expenseForm.date}
                  onChange={val => handleExpenseChange('date', val)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Transaction Reference"
                  fullWidth
                  value={expenseForm.transactionRef}
                  onChange={e => handleExpenseChange('transactionRef', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  value={expenseForm.description}
                  onChange={e => handleExpenseChange('description', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  fullWidth
                  multiline
                  rows={2}
                  value={expenseForm.remarks}
                  onChange={e => handleExpenseChange('remarks', e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setExpenseOpen(false); setExpenseError(''); }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleExpenseSubmit}
              disabled={expenseLoading}
            >
              {expenseLoading ? 'Saving...' : 'Add Expense'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default PettyCashPage;
