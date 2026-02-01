import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Divider, Button, CircularProgress } from '@mui/material';
import { Print } from '@mui/icons-material';
import { voucherService } from '../api/services';
import { formatCurrency, formatDate } from '../utils/formatters';

const VoucherPrintPage = () => {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchVoucher(); }, [id]);

  const fetchVoucher = async () => {
    try {
      const res = await voucherService.getById(id);
      setVoucher(res.data.data);
      await voucherService.recordPrint(id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePrint = () => { window.print(); };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!voucher) return <Box sx={{ textAlign: 'center', py: 8 }}><Typography>Voucher not found</Typography></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }} className="no-print">
        <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>Print</Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" color="primary">Educational Consultancy</Typography>
          <Typography variant="body2" color="text.secondary">{voucher.branchId?.address?.addressLine}, {voucher.branchId?.address?.city}</Typography>
          <Typography variant="body2" color="text.secondary">Phone: {voucher.branchId?.phone} | Email: {voucher.branchId?.email}</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Voucher Details */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">{voucher.voucherType === 'payment' || voucher.voucherType === 'receipt' ? 'RECEIPT' : 'PAYMENT VOUCHER'}</Typography>
            <Typography variant="h6" color="primary">{voucher.voucherNo}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">Date</Typography>
            <Typography variant="body1" fontWeight="medium">{formatDate(voucher.voucherDate)}</Typography>
          </Box>
        </Box>

        {/* Party Details */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Received From / Paid To</Typography>
              <Typography variant="body1" fontWeight="medium">{voucher.partyName}</Typography>
              {voucher.partyType && <Typography variant="caption" color="text.secondary">{voucher.partyType}</Typography>}
            </Grid>
            {voucher.admissionId && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Admission No</Typography>
                <Typography variant="body1" fontWeight="medium">{voucher.admissionId.admissionNo}</Typography>
                {voucher.admissionId.student && (
                  <Typography variant="caption" color="text.secondary">
                    {voucher.admissionId.student.firstName} {voucher.admissionId.student.lastName}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Amount */}
        <Box sx={{ textAlign: 'center', py: 3, bgcolor: 'primary.light', color: 'white', borderRadius: 2, mb: 3 }}>
          <Typography variant="body2">Amount</Typography>
          <Typography variant="h3" fontWeight="bold">{formatCurrency(voucher.amount)}</Typography>
          {voucher.paymentMode && <Typography variant="body2">Mode: {voucher.paymentMode}</Typography>}
          {voucher.transactionRef && <Typography variant="body2">Ref: {voucher.transactionRef}</Typography>}
        </Box>

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">Description</Typography>
          <Typography variant="body1">{voucher.description}</Typography>
          {voucher.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{voucher.notes}</Typography>}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Signatures */}
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ borderTop: '1px solid black', pt: 1, mx: 2 }}>
              <Typography variant="body2">Received By</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ borderTop: '1px solid black', pt: 1, mx: 2 }}>
              <Typography variant="body2">Authorized By</Typography>
            </Box>
          </Grid>
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ borderTop: '1px solid black', pt: 1, mx: 2 }}>
              <Typography variant="body2">Customer Signature</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            This is a computer generated voucher. Print count: {voucher.printCount}
          </Typography>
        </Box>
      </Paper>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </Box>
  );
};

export default VoucherPrintPage;
