import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import PageHeader from "../components/common/PageHeader";
import { agentService } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { AGENT_TYPES } from "../utils/constants";

const AgentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    agentType: "Main",
    phone: "",
    email: "",
    commissionRate: 0,
    address: { addressLine: "", city: "", state: "", pincode: "" },
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
    },
  });

  useEffect(() => {
    fetchAgentDetails();
  }, [id]);

  const fetchAgentDetails = async () => {
    try {
      const res = await agentService.getDetails(id);
      setData(res.data.data);
    } catch (e) {
      console.error(e);
      navigate("/agents");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    const agent = data.agent;
    setFormData({
      name: agent.name || "",
      agentType: agent.agentType || "Main",
      phone: agent.phone || "",
      email: agent.email || "",
      commissionRate: agent.commissionRate || 0,
      address: {
        addressLine: agent.address?.addressLine || "",
        city: agent.address?.city || "",
        state: agent.address?.state || "",
        pincode: agent.address?.pincode || "",
      },
      bankDetails: {
        bankName: agent.bankDetails?.bankName || "",
        accountNumber: agent.bankDetails?.accountNumber || "",
        ifscCode: agent.bankDetails?.ifscCode || "",
        accountHolderName: agent.bankDetails?.accountHolderName || "",
      },
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await agentService.update(id, formData);
      setDialogOpen(false);
      fetchAgentDetails();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Error updating agent");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (!data) return null;

  const { agent, admissions, payments, totals } = data;

  return (
    <Box>
      <PageHeader
        title={agent.name}
        subtitle={`${agent.agentType} Agent`}
        breadcrumbs={[
          { label: "Agents", path: "/agents" },
          { label: agent.name },
        ]}
      >
        {(isSuperAdmin || isAdmin) && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleOpenEdit}
          >
            Edit
          </Button>
        )}
      </PageHeader>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Information
              </Typography>
              <Box sx={{ "& > div": { mb: 1 } }}>
                <div>
                  <strong>Type:</strong>{" "}
                  <Chip label={agent.agentType} size="small" />
                </div>
                <div>
                  <strong>Phone:</strong> {agent.phone || "-"}
                </div>
                <div>
                  <strong>Email:</strong> {agent.email || "-"}
                </div>
                <div>
                  <strong>Commission Rate:</strong> {agent.commissionRate}%
                </div>
                <div>
                  <strong>Address:</strong> {agent.address?.addressLine || "-"}
                </div>
                <div>
                  <strong>City:</strong> {agent.address?.city || "-"}
                </div>
                <div>
                  <strong>State:</strong> {agent.address?.state || "-"}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={agent.isActive ? "Active" : "Inactive"}
                    color={agent.isActive ? "success" : "default"}
                    size="small"
                  />
                </div>
              </Box>
            </CardContent>
          </Card>

          {agent.bankDetails &&
            (agent.bankDetails.bankName || agent.bankDetails.accountNumber) && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Bank Details
                  </Typography>
                  <Box sx={{ "& > div": { mb: 1 } }}>
                    <div>
                      <strong>Bank Name:</strong>{" "}
                      {agent.bankDetails.bankName || "-"}
                    </div>
                    <div>
                      <strong>Account Number:</strong>{" "}
                      {agent.bankDetails.accountNumber || "-"}
                    </div>
                    <div>
                      <strong>IFSC Code:</strong>{" "}
                      {agent.bankDetails.ifscCode || "-"}
                    </div>
                    <div>
                      <strong>Account Holder:</strong>{" "}
                      {agent.bankDetails.accountHolderName || "-"}
                    </div>
                  </Box>
                </CardContent>
              </Card>
            )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Agent Fee
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(totals.totalAgentFee)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Paid
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(totals.totalPaid)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Due
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {formatCurrency(totals.totalDue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Linked Admissions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Admission No</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Agent Fee</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admissions.map((adm) => (
                      <TableRow
                        key={adm._id}
                        hover
                        onClick={() => navigate(`/admissions/${adm._id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>{adm.admissionNo}</TableCell>
                        <TableCell>{formatDate(adm.admissionDate)}</TableCell>
                        <TableCell>
                          {adm.student?.firstName} {adm.student?.lastName}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={adm.admissionStatus}
                            size="small"
                            color={
                              adm.admissionStatus === "Confirmed"
                                ? "success"
                                : adm.admissionStatus === "Pending"
                                ? "warning"
                                : "error"
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(adm.agent?.agentFee)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(adm.paymentSummary?.agentPaid)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(adm.paymentSummary?.agentDue)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!admissions || admissions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No admissions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Payments
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Admission</TableCell>
                      <TableCell>Mode</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell>Voucher</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>{p.admissionId?.admissionNo}</TableCell>
                        <TableCell>{p.paymentMode}</TableCell>
                        <TableCell>{p.transactionRef || "-"}</TableCell>
                        <TableCell>{p.voucherId?.voucherNo || "-"}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!payments || payments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Same form dialog as AgentsPage */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Agent Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.agentType}
                  onChange={(e) =>
                    setFormData({ ...formData, agentType: e.target.value })
                  }
                  label="Type"
                >
                  {AGENT_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Commission %"
                type="number"
                value={formData.commissionRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commissionRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address?.addressLine}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      addressLine: e.target.value,
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address?.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address?.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.address?.pincode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, pincode: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2, mt: 1 }}>
                <strong>Bank Details</strong>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Bank Name"
                value={formData.bankDetails?.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      bankName: e.target.value,
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Account Holder"
                value={formData.bankDetails?.accountHolderName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      accountHolderName: e.target.value,
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Account Number"
                value={formData.bankDetails?.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      accountNumber: e.target.value,
                    },
                  })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="IFSC Code"
                value={formData.bankDetails?.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: {
                      ...formData.bankDetails,
                      ifscCode: e.target.value,
                    },
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentDetailsPage;
