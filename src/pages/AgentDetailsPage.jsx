import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Grid, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import { agentService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/formatters';

const AgentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => { fetchAgentDetails(); }, [id]);

  const fetchAgentDetails = async () => {
    try {
      const res = await agentService.getDetails(id);
      setData(res.data.data);
    } catch (e) { console.error(e); navigate('/agents'); }
    finally { setLoading(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!data) return null;

  const { agent, admissions, payments, totals } = data;

  return (
    <Box>
      <PageHeader title={agent.name} subtitle={`${agent.agentType} Agent`} breadcrumbs={[{ label: 'Agents', path: '/agents' }, { label: agent.name }]} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Agent Information</Typography>
              <Box sx={{ '& > div': { mb: 1 } }}>
                <div><strong>Type:</strong> <Chip label={agent.agentType} size="small" /></div>
                <div><strong>Phone:</strong> {agent.phone || '-'}</div>
                <div><strong>Email:</strong> {agent.email || '-'}</div>
                <div><strong>Commission Rate:</strong> {agent.commissionRate}%</div>
                <div><strong>Status:</strong> <Chip label={agent.isActive ? 'Active' : 'Inactive'} color={agent.isActive ? 'success' : 'default'} size="small" /></div>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Agent Fee</Typography><Typography variant="h5">{formatCurrency(totals.totalAgentFee)}</Typography></CardContent></Card></Grid>
            <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Paid</Typography><Typography variant="h5" color="success.main">{formatCurrency(totals.totalPaid)}</Typography></CardContent></Card></Grid>
            <Grid item xs={4}><Card><CardContent><Typography variant="body2" color="text.secondary">Total Due</Typography><Typography variant="h5" color="error.main">{formatCurrency(totals.totalDue)}</Typography></CardContent></Card></Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Linked Admissions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Admission No</TableCell><TableCell>Date</TableCell><TableCell>Student</TableCell><TableCell>Status</TableCell><TableCell align="right">Agent Fee</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Due</TableCell></TableRow></TableHead>
                  <TableBody>
                    {admissions.map(adm => (
                      <TableRow key={adm._id} hover onClick={() => navigate(`/admissions/${adm._id}`)} sx={{ cursor: 'pointer' }}>
                        <TableCell>{adm.admissionNo}</TableCell>
                        <TableCell>{formatDate(adm.admissionDate)}</TableCell>
                        <TableCell>{adm.student?.firstName} {adm.student?.lastName}</TableCell>
                        <TableCell><Chip label={adm.admissionStatus} size="small" color={adm.admissionStatus === 'Confirmed' ? 'success' : adm.admissionStatus === 'Pending' ? 'warning' : 'error'} /></TableCell>
                        <TableCell align="right">{formatCurrency(adm.agent?.agentFee)}</TableCell>
                        <TableCell align="right">{formatCurrency(adm.paymentSummary?.agentPaid)}</TableCell>
                        <TableCell align="right">{formatCurrency(adm.paymentSummary?.agentDue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Payments</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Admission</TableCell><TableCell>Mode</TableCell><TableCell>Reference</TableCell><TableCell>Voucher</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p._id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>{p.admissionId?.admissionNo}</TableCell>
                        <TableCell>{p.paymentMode}</TableCell>
                        <TableCell>{p.transactionRef || '-'}</TableCell>
                        <TableCell>{p.voucherId?.voucherNo || '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AgentDetailsPage;
