import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Grid, Typography, Chip, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Edit, Add, Print } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import StatusChip from '../components/common/StatusChip';
import { admissionService, paymentService, agentPaymentService, branchService, agentService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PAYER_TYPES, RECEIVER_TYPES, PAYMENT_MODES } from '../utils/constants';

const AdmissionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff, isSuperAdmin, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [agentPaymentDialog, setAgentPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState(getInitialPaymentForm());
  const [agentPaymentForm, setAgentPaymentForm] = useState(getInitialAgentPaymentForm());
  const [agents, setAgents] = useState([]);
  const [transactionRefError, setTransactionRefError] = useState('');

  // Initial form states
  function getInitialPaymentForm() {
    return {
      payerType: 'Student',
      receiverType: 'Consultancy',
      paymentDate: new Date(),
      amount: 0,
      paymentMode: 'Cash',
      transactionRef: '',
      notes: '',
      isServiceChargePayment: false,
      serviceChargeDeducted: 0,
      deductServiceCharge: false,
      // Agent collection flow
      isAgentCollection: false,
      collectingAgentId: '',
      agentFeeDeducted: 0,
      deductAgentFee: false,
      // Agent fee payment
      isAgentFeePayment: false,
      agentIdForFeePayment: '',
    };
  }

  function getInitialAgentPaymentForm() {
    return {
      paymentDate: new Date(),
      amount: 0,
      paymentMode: 'Cash',
      transactionRef: '',
      notes: '',
    };
  }

  // Reset form when opening dialog
  const openPaymentDialog = async () => {
    setPaymentForm(getInitialPaymentForm());
    setTransactionRefError('');
    // Fetch all agents for agent flow
    try {
      const res = await agentService.getActive();
      setAgents(res.data.data);
    } catch (e) { console.error(e); }
    setPaymentDialog(true);
  };

  const openAgentPaymentDialog = () => {
    setAgentPaymentForm(getInitialAgentPaymentForm());
    setAgentPaymentDialog(true);
  };

  const closePaymentDialog = () => {
    setPaymentDialog(false);
    setPaymentForm(getInitialPaymentForm());
    setTransactionRefError('');
  };

  const closeAgentPaymentDialog = () => {
    setAgentPaymentDialog(false);
    setAgentPaymentForm(getInitialAgentPaymentForm());
  };

  useEffect(() => { fetchAdmissionDetails(); }, [id]);

  const fetchAdmissionDetails = async () => {
    try {
      const res = await admissionService.getDetails(id);
      setData(res.data.data);
    } catch (e) { console.error(e); navigate('/admissions'); }
    finally { setLoading(false); }
  };

  // Check transaction reference uniqueness
  const checkTransactionRef = async (ref) => {
    if (!ref || ref.trim() === '') {
      setTransactionRefError('');
      return true;
    }
    try {
      const res = await paymentService.checkTransactionRef(ref);
      if (res.data.data.exists) {
        setTransactionRefError(`Transaction reference already used for ${res.data.data.payment.studentName} (${res.data.data.payment.admissionNo})`);
        return false;
      }
      setTransactionRefError('');
      return true;
    } catch (e) {
      console.error(e);
      return true;
    }
  };

  const handleAddPayment = async () => {
    // Validate transaction reference
    if (paymentForm.transactionRef) {
      const isValid = await checkTransactionRef(paymentForm.transactionRef);
      if (!isValid) return;
    }

    try {
      // Prepare payment data
      const paymentData = {
        admissionId: id,
        branchId: data.admission.branchId._id,
        payerType: paymentForm.payerType,
        receiverType: paymentForm.receiverType,
        paymentDate: paymentForm.paymentDate,
        amount: paymentForm.amount,
        paymentMode: paymentForm.paymentMode,
        transactionRef: paymentForm.transactionRef,
        notes: paymentForm.notes,
        isServiceChargePayment: paymentForm.isServiceChargePayment === true,
        deductServiceCharge: paymentForm.deductServiceCharge === true,
        serviceChargeDeducted: paymentForm.deductServiceCharge === true ? (paymentForm.serviceChargeDeducted || 0) : 0,
        // Agent collection flow
        isAgentCollection: paymentForm.isAgentCollection === true,
        collectingAgentId: paymentForm.collectingAgentId || null,
        agentFeeDeducted: paymentForm.deductAgentFee === true ? (paymentForm.agentFeeDeducted || 0) : 0,
        deductAgentFee: paymentForm.deductAgentFee === true,
        // Agent fee payment
        isAgentFeePayment: paymentForm.isAgentFeePayment === true,
        agentIdForFeePayment: paymentForm.agentIdForFeePayment || null,
      };

      console.log('Sending payment data:', paymentData);

      // Use FormData if there's an attachment
      if (paymentForm.attachmentFile) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(paymentData));
        formData.append('attachment', paymentForm.attachmentFile);
        await paymentService.createWithAttachment(formData);
      } else {
        await paymentService.create(paymentData);
      }
      
      closePaymentDialog();
      fetchAdmissionDetails();
    } catch (e) { console.error(e); }
  };

  const handleAddAgentPayment = async () => {
    try {
      await agentPaymentService.create({ ...agentPaymentForm, admissionId: id, agentId: data.admission.agent.agentId._id, branchId: data.admission.branchId._id });
      closeAgentPaymentDialog();
      fetchAdmissionDetails();
    } catch (e) { console.error(e); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!data) return null;

  const { admission, payments, agentPayments, vouchers } = data;

  const handleRecalculate = async () => {
    try {
      await admissionService.recalculate(id);
      fetchAdmissionDetails();
    } catch (e) {
      console.error('Recalculate error:', e);
    }
  };

  return (
    <Box>
      <PageHeader 
        title={`Admission: ${admission.admissionNo}`} 
        subtitle={`${admission.student.firstName} ${admission.student.lastName}`} 
        breadcrumbs={[{ label: 'Admissions', path: '/admissions' }, { label: admission.admissionNo }]}
      >
        {(isSuperAdmin || isAdmin) && (
          <Button variant="text" size="small" onClick={handleRecalculate} sx={{ mr: 1 }}>Recalculate</Button>
        )}
        <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/admissions/${id}/edit`)}>Edit</Button>
      </PageHeader>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Student Details</Typography>
                <StatusChip status={admission.admissionStatus} />
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Name</Typography><Typography>{admission.student.firstName} {admission.student.lastName}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Phone</Typography><Typography>{admission.student.phone}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Email</Typography><Typography>{admission.student.email || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">DOB</Typography><Typography>{formatDate(admission.student.dob)}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">College</Typography><Typography>{admission.collegeId?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Course</Typography><Typography>{admission.courseId?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Branch</Typography><Typography>{admission.branchId?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Academic Year</Typography><Typography>{admission.academicYear}</Typography></Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Fee Summary</Typography>
              <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
                <div><span>Total Fee:</span><strong>{formatCurrency(admission.fees?.totalFee)}</strong></div>
                <div><span>Student Paid:</span><Typography color="success.main">{formatCurrency(admission.paymentSummary?.studentPaid)}</Typography></div>
                <div><span>Student Due:</span><Typography color="error.main">{formatCurrency(admission.paymentSummary?.studentDue)}</Typography></div>
              </Box>
            </CardContent>
          </Card>
          {!isStaff && admission.serviceCharge && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Service Charge</Typography>
                <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
                  <div><span>Agreed:</span><strong>{formatCurrency(admission.serviceCharge?.agreed)}</strong></div>
                  <div><span>From College:</span><Typography color="success.main">{formatCurrency(admission.serviceCharge?.receivedFromCollege)}</Typography></div>
                  <div><span>Deducted from Student:</span><Typography color="success.main">{formatCurrency(admission.serviceCharge?.deductedFromStudent)}</Typography></div>
                  <div><span>Deducted by Agent:</span><Typography color="success.main">{formatCurrency(admission.serviceCharge?.deductedByAgent)}</Typography></div>
                  {admission.serviceCharge?.paidBackToCollege > 0 && (
                    <div><span>Paid Back to College:</span><Typography color="warning.main">-{formatCurrency(admission.serviceCharge?.paidBackToCollege)}</Typography></div>
                  )}
                  <div><span>Net Received:</span><Typography color="success.main">{formatCurrency(admission.serviceCharge?.received)}</Typography></div>
                  <div><span>Due:</span><Typography color="error.main">{formatCurrency(admission.serviceCharge?.due)}</Typography></div>
                </Box>
              </CardContent>
            </Card>
          )}
          {!isStaff && admission.collegePayment && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>College Payment</Typography>
                <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
                  <div><span>Due to College:</span><strong>{formatCurrency(admission.collegePayment?.totalDueToCollege)}</strong></div>
                  <div><span>Paid to College:</span><Typography color="success.main">{formatCurrency(admission.collegePayment?.paidToCollege)}</Typography></div>
                  <div><span>Balance Due:</span><Typography color="error.main">{formatCurrency(admission.collegePayment?.balanceDueToCollege)}</Typography></div>
                </Box>
              </CardContent>
            </Card>
          )}
          
          {/* Multiple Agents Section */}
          {!isStaff && (admission.agents?.mainAgent?.agentId || admission.agents?.collegeAgent?.agentId || admission.agents?.subAgent?.agentId) && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Agents</Typography>
                <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
                  {admission.agents?.mainAgent?.agentId && (
                    <>
                      <div><span>Main Agent:</span><strong>{admission.agents.mainAgent.agentId.name || admission.agents.mainAgent.agentId}</strong></div>
                      <div><span>Main Agent Fee:</span><strong>{formatCurrency(admission.agents.mainAgent.agentFee)}</strong></div>
                      <div><span>Paid:</span><Typography color="success.main">{formatCurrency(admission.agents.mainAgent.feePaid || 0)}</Typography></div>
                      <div><span>Due:</span><Typography color="error.main">{formatCurrency(admission.agents.mainAgent.feeDue || admission.agents.mainAgent.agentFee)}</Typography></div>
                    </>
                  )}
                  {admission.agents?.collegeAgent?.agentId && (
                    <>
                      <div><span>College Agent:</span><strong>{admission.agents.collegeAgent.agentId.name || admission.agents.collegeAgent.agentId}</strong></div>
                      <div><span>College Agent Fee:</span><strong>{formatCurrency(admission.agents.collegeAgent.agentFee)}</strong></div>
                      <div><span>Paid:</span><Typography color="success.main">{formatCurrency(admission.agents.collegeAgent.feePaid || 0)}</Typography></div>
                      <div><span>Due:</span><Typography color="error.main">{formatCurrency(admission.agents.collegeAgent.feeDue || admission.agents.collegeAgent.agentFee)}</Typography></div>
                    </>
                  )}
                  {admission.agents?.subAgent?.agentId && (
                    <>
                      <div><span>Sub Agent:</span><strong>{admission.agents.subAgent.agentId.name || admission.agents.subAgent.agentId}</strong></div>
                      <div><span>Sub Agent Fee:</span><strong>{formatCurrency(admission.agents.subAgent.agentFee)}</strong></div>
                      <div><span>Paid:</span><Typography color="success.main">{formatCurrency(admission.agents.subAgent.feePaid || 0)}</Typography></div>
                      <div><span>Due:</span><Typography color="error.main">{formatCurrency(admission.agents.subAgent.feeDue || admission.agents.subAgent.agentFee)}</Typography></div>
                    </>
                  )}
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', marginTop: '8px' }}>
                    <span><strong>Total Agent Fee:</strong></span>
                    <strong>{formatCurrency(admission.agents?.totalAgentFee || 0)}</strong>
                  </div>
                  <div><span>Total Paid:</span><Typography color="success.main">{formatCurrency(admission.agents?.totalAgentFeePaid || 0)}</Typography></div>
                  <div><span>Total Due:</span><Typography color="error.main">{formatCurrency(admission.agents?.totalAgentFeeDue || 0)}</Typography></div>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Legacy Single Agent Section */}
          {admission.agent?.agentId && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Agent Details</Typography>
                <Box sx={{ '& > div': { display: 'flex', justifyContent: 'space-between', mb: 1 } }}>
                  <div><span>Agent:</span><strong>{admission.agent.agentId.name || admission.agent.agentId}</strong></div>
                  <div><span>Type:</span><Chip label={admission.agent.agentType} size="small" /></div>
                  <div><span>Agent Fee:</span><strong>{formatCurrency(admission.agent?.agentFee)}</strong></div>
                  <div><span>Paid:</span><Typography color="success.main">{formatCurrency(admission.paymentSummary?.agentPaid)}</Typography></div>
                  <div><span>Due:</span><Typography color="error.main">{formatCurrency(admission.paymentSummary?.agentDue)}</Typography></div>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Payments" />
          <Tab label="Agent Payments" />
          <Tab label="Vouchers" />
        </Tabs>
        <CardContent>
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<Add />} onClick={openPaymentDialog}>Add Payment</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Payer</TableCell><TableCell>Receiver</TableCell><TableCell>Mode</TableCell><TableCell>Reference</TableCell><TableCell>Voucher</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">SC Deducted</TableCell><TableCell align="right">Agent Fee</TableCell><TableCell>Attachment</TableCell></TableRow></TableHead>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p._id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>{p.payerType}</TableCell>
                        <TableCell>{p.receiverType}</TableCell>
                        <TableCell>{p.paymentMode}</TableCell>
                        <TableCell>{p.transactionRef || '-'}</TableCell>
                        <TableCell>{p.voucherId?.voucherNo}</TableCell>
                        <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                        <TableCell align="right">{p.serviceChargeDeducted > 0 ? formatCurrency(p.serviceChargeDeducted) : '-'}</TableCell>
                        <TableCell align="right">{p.agentFeeDeducted > 0 ? formatCurrency(p.agentFeeDeducted) : '-'}</TableCell>
                        <TableCell>
                          {p.attachment?.filename ? (
                            <Button size="small" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/${p._id}/attachment`, '_blank')}>View</Button>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                {(isSuperAdmin || isAdmin) && <Button variant="contained" startIcon={<Add />} onClick={openAgentPaymentDialog}>Add Agent Payment</Button>}
              </Box>
              {agentPayments.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Agent</TableCell><TableCell>Mode</TableCell><TableCell>Reference</TableCell><TableCell>Voucher</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                    <TableBody>
                      {agentPayments.map(p => (
                        <TableRow key={p._id}>
                          <TableCell>{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>{p.agentId?.name || '-'}</TableCell>
                          <TableCell>{p.paymentMode}</TableCell>
                          <TableCell>{p.transactionRef || '-'}</TableCell>
                          <TableCell>{p.voucherId?.voucherNo}</TableCell>
                          <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No agent payments recorded yet</Typography>
              )}
            </Box>
          )}
          {activeTab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Voucher No</TableCell><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Description</TableCell><TableCell align="right">Amount</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                <TableBody>
                  {vouchers.map(v => (
                    <TableRow key={v._id}>
                      <TableCell>{v.voucherNo}</TableCell>
                      <TableCell>{formatDate(v.voucherDate)}</TableCell>
                      <TableCell><Chip label={v.voucherType} size="small" /></TableCell>
                      <TableCell>{v.description}</TableCell>
                      <TableCell align="right">{formatCurrency(v.amount)}</TableCell>
                      <TableCell><Button size="small" startIcon={<Print />} onClick={() => window.open(`/vouchers/${v._id}/print`, '_blank')}>Print</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialog} onClose={closePaymentDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {transactionRefError && (
              <Grid item xs={12}>
                <Alert severity="error">{transactionRefError}</Alert>
              </Grid>
            )}
            <Grid item xs={6} md={3}>
              <DatePicker 
                label="Payment Date" 
                value={paymentForm.paymentDate} 
                onChange={(d) => setPaymentForm({ ...paymentForm, paymentDate: d })} 
                slotProps={{ textField: { fullWidth: true } }} 
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Payer</InputLabel>
                <Select 
                  value={paymentForm.payerType} 
                  onChange={(e) => setPaymentForm({ 
                    ...paymentForm, 
                    payerType: e.target.value, 
                    isServiceChargePayment: false, 
                    deductServiceCharge: false, 
                    serviceChargeDeducted: 0,
                    isAgentCollection: false,
                    collectingAgentId: '',
                    agentFeeDeducted: 0,
                    deductAgentFee: false,
                    isAgentFeePayment: false,
                    agentIdForFeePayment: '',
                  })} 
                  label="Payer"
                >
                  {PAYER_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Receiver</InputLabel>
                <Select 
                  value={paymentForm.receiverType} 
                  onChange={(e) => setPaymentForm({ 
                    ...paymentForm, 
                    receiverType: e.target.value, 
                    isServiceChargePayment: false, 
                    deductServiceCharge: false, 
                    serviceChargeDeducted: 0,
                    isAgentCollection: false,
                    isAgentFeePayment: false,
                  })} 
                  label="Receiver"
                >
                  {RECEIVER_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField 
                fullWidth 
                label="Amount" 
                type="number" 
                value={paymentForm.amount} 
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0, serviceChargeDeducted: 0, agentFeeDeducted: 0 })} 
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })} label="Mode">
                  {PAYMENT_MODES.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField 
                fullWidth 
                label="Transaction Ref" 
                value={paymentForm.transactionRef} 
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                onBlur={(e) => checkTransactionRef(e.target.value)}
                error={!!transactionRefError}
              />
            </Grid>
            
            {/* Agent -> Consultancy: Agent Collection Flow */}
            {paymentForm.payerType === 'Agent' && paymentForm.receiverType === 'Consultancy' && !isStaff && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      <strong>Agent Collection Flow:</strong> Agent collected payment from student and transferring to consultancy
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Collecting Agent</InputLabel>
                    <Select 
                      value={paymentForm.collectingAgentId} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, collectingAgentId: e.target.value, isAgentCollection: true })} 
                      label="Collecting Agent"
                    >
                      <MenuItem value="">Select Agent</MenuItem>
                      {agents.map(a => <MenuItem key={a._id} value={a._id}>{a.name} ({a.agentType})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Deduct Agent Fee?</InputLabel>
                    <Select 
                      value={paymentForm.deductAgentFee ? 'yes' : 'no'} 
                      onChange={(e) => {
                        const deduct = e.target.value === 'yes';
                        setPaymentForm({ 
                          ...paymentForm, 
                          deductAgentFee: deduct,
                          agentFeeDeducted: 0
                        });
                      }} 
                      label="Deduct Agent Fee?"
                    >
                      <MenuItem value="no">No - Full amount transferred, pay agent later</MenuItem>
                      <MenuItem value="yes">Yes - Agent already deducted fee</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {paymentForm.deductAgentFee && (
                  <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      label="Agent Fee Deducted" 
                      type="number" 
                      value={paymentForm.agentFeeDeducted} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, agentFeeDeducted: parseFloat(e.target.value) || 0 })}
                      helperText="Amount agent kept as fee"
                    />
                  </Grid>
                )}
                {paymentForm.deductAgentFee && paymentForm.agentFeeDeducted > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Original Student Payment:</strong> {formatCurrency(paymentForm.amount + paymentForm.agentFeeDeducted)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Agent Fee Deducted:</strong> {formatCurrency(paymentForm.agentFeeDeducted)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Amount Received by Consultancy:</strong> {formatCurrency(paymentForm.amount)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}

            {/* Consultancy -> Agent: Agent Fee Payment */}
            {paymentForm.payerType === 'Consultancy' && paymentForm.receiverType === 'Agent' && !isStaff && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      <strong>Agent Fee Payment:</strong> Paying agent fee from consultancy
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Pay to Agent</InputLabel>
                    <Select 
                      value={paymentForm.agentIdForFeePayment} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, agentIdForFeePayment: e.target.value, isAgentFeePayment: true })} 
                      label="Pay to Agent"
                    >
                      <MenuItem value="">Select Agent</MenuItem>
                      {agents.map(a => <MenuItem key={a._id} value={a._id}>{a.name} ({a.agentType})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            {/* Service Charge Options - Only for Student -> Consultancy payments */}
            {paymentForm.payerType === 'Student' && paymentForm.receiverType === 'Consultancy' && !isStaff && admission.serviceCharge?.due > 0 && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText">
                      <strong>Service Charge Due:</strong> {formatCurrency(admission.serviceCharge?.due)}
                    </Typography>
                    <Typography variant="caption" color="info.contrastText">
                      Choose whether to deduct service charge from this payment or transfer full amount to college
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Deduct Service Charge?</InputLabel>
                    <Select 
                      value={paymentForm.deductServiceCharge ? 'yes' : 'no'} 
                      onChange={(e) => {
                        const deduct = e.target.value === 'yes';
                        setPaymentForm({ 
                          ...paymentForm, 
                          deductServiceCharge: deduct,
                          serviceChargeDeducted: deduct ? Math.min(admission.serviceCharge?.due || 0, paymentForm.amount) : 0
                        });
                      }} 
                      label="Deduct Service Charge?"
                    >
                      <MenuItem value="no">No - Transfer full amount to college (College will pay service charge later)</MenuItem>
                      <MenuItem value="yes">Yes - Deduct service charge from this payment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {paymentForm.deductServiceCharge && (
                  <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      label="Service Charge to Deduct" 
                      type="number" 
                      value={paymentForm.serviceChargeDeducted} 
                      onChange={(e) => setPaymentForm({ 
                        ...paymentForm, 
                        serviceChargeDeducted: Math.min(parseFloat(e.target.value) || 0, admission.serviceCharge?.due || 0, paymentForm.amount) 
                      })}
                      helperText={`Max deductible: ${formatCurrency(Math.min(admission.serviceCharge?.due || 0, paymentForm.amount))}`}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: paymentForm.deductServiceCharge ? 'warning.light' : 'success.light', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Service Charge Deducted:</strong> {formatCurrency(paymentForm.deductServiceCharge ? paymentForm.serviceChargeDeducted : 0)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Amount Due to College:</strong> {formatCurrency(paymentForm.amount - (paymentForm.deductServiceCharge ? paymentForm.serviceChargeDeducted : 0))}
                    </Typography>
                  </Box>
                </Grid>
              </>
            )}

            {/* College paying service charge to Consultancy */}
            {paymentForm.payerType === 'College' && paymentForm.receiverType === 'Consultancy' && !isStaff && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Type</InputLabel>
                  <Select 
                    value={paymentForm.isServiceChargePayment ? 'service_charge' : 'other'} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, isServiceChargePayment: e.target.value === 'service_charge' })} 
                    label="Payment Type"
                  >
                    <MenuItem value="service_charge">Service Charge Payment</MenuItem>
                    <MenuItem value="other">Other Payment</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
            </Grid>
            
            {/* Attachment Upload */}
            <Grid item xs={12}>
              <Box sx={{ border: '1px dashed #ccc', borderRadius: 1, p: 2 }}>
                <Typography variant="body2" gutterBottom>Attachment (Optional - Image or PDF)</Typography>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setPaymentForm({ ...paymentForm, attachmentFile: e.target.files[0] })}
                />
                {paymentForm.attachmentFile && (
                  <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                    Selected: {paymentForm.attachmentFile.name}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPayment} disabled={paymentForm.amount <= 0 || !!transactionRefError}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={agentPaymentDialog} onClose={closeAgentPaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Agent Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><DatePicker label="Payment Date" value={agentPaymentForm.paymentDate} onChange={(d) => setAgentPaymentForm({ ...agentPaymentForm, paymentDate: d })} slotProps={{ textField: { fullWidth: true } }} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Amount" type="number" value={agentPaymentForm.amount} onChange={(e) => setAgentPaymentForm({ ...agentPaymentForm, amount: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Mode</InputLabel><Select value={agentPaymentForm.paymentMode} onChange={(e) => setAgentPaymentForm({ ...agentPaymentForm, paymentMode: e.target.value })} label="Mode">{PAYMENT_MODES.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Transaction Ref" value={agentPaymentForm.transactionRef} onChange={(e) => setAgentPaymentForm({ ...agentPaymentForm, transactionRef: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={agentPaymentForm.notes} onChange={(e) => setAgentPaymentForm({ ...agentPaymentForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAgentPaymentDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAgentPayment} disabled={agentPaymentForm.amount <= 0}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdmissionDetailsPage;
