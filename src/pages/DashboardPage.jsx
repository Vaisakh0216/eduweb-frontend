import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  TrendingUp,
  TrendingDown,
  People,
  Payment,
  AccountBalance,
  AssignmentTurnedIn,
  Pending,
  Cancel,
  LocationOn,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import { dashboardService, branchService } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatters";

const COLORS = ["#4caf50", "#ff9800", "#f44336"];

const DashboardPage = () => {
  const { user, isSuperAdmin, isStaff } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [admissionTrend, setAdmissionTrend] = useState([]);
  const [branches, setBranches] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [filters, setFilters] = useState({
    branchId: isStaff && user?.branches?.length > 0 ? user.branches[0]._id : "",
    startDate: null,
    endDate: null,
    year: new Date().getFullYear(),
    academicYear: "",
  });

  useEffect(() => {
    fetchBranches();
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchBranches = async () => {
    try {
      const response = await branchService.getActive();
      setBranches(response.data.data);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await dashboardService.getAcademicYears();
      setAcademicYears(response.data.data);
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = {
        branchId: filters.branchId || undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        year: filters.year,
        academicYear: filters.academicYear || undefined,
      };

      const [statsRes, monthlyRes, admissionRes] = await Promise.all([
        dashboardService.getStats(params),
        dashboardService.getMonthlyTrend(params),
        dashboardService.getAdmissionTrend(params),
      ]);

      setStats(statsRes.data.data);
      setMonthlyTrend(monthlyRes.data.data);
      setAdmissionTrend(admissionRes.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const admissionPieData = stats
    ? [
        { name: "Confirmed", value: stats.admissions?.confirmed || 0 },
        { name: "Pending", value: stats.admissions?.pending || 0 },
        { name: "Cancelled", value: stats.admissions?.cancelled || 0 },
      ]
    : [];

  if (loading && !stats) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.firstName}!`}
      >
        {isStaff &&
          user?.branches?.length > 0 &&
          user.branches.map((b) => (
            <Chip
              key={b._id}
              icon={<LocationOn fontSize="small" />}
              label={b.name}
              size="small"
              color="primary"
              variant="outlined"
            />
          ))}
      </PageHeader>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {(isSuperAdmin || user?.branches?.length > 1) && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={filters.branchId}
                  onChange={(e) =>
                    setFilters({ ...filters, branchId: e.target.value })
                  }
                  label="Branch"
                >
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={filters.academicYear}
                onChange={(e) =>
                  setFilters({ ...filters, academicYear: e.target.value })
                }
                label="Academic Year"
              >
                <MenuItem value="">All Years</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              format="dd/MM/yyyy"
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              format="dd/MM/yyyy"
              slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Financial Stats - hidden for staff */}
      {!isStaff && (
        <>
          {/* Business Performance (Projected) */}
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight="bold"
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Business Performance (Projected)
            </Typography>
          </Box>
          <Card sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              {/* <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                Total Service Revenue − Total Commission = Projected Gross Profit
              </Typography> */}
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "success.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "success.200",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Total Service Revenue
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {formatCurrency(stats?.serviceRevenue?.total || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor: "warning.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "warning.200",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Total Commission
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="warning.main"
                    >
                      {formatCurrency(stats?.consultantCommission?.total || 0)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 1.5,
                      bgcolor:
                        (stats?.serviceRevenue?.total || 0) -
                          (stats?.consultantCommission?.total || 0) >=
                        0
                          ? "primary.50"
                          : "error.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor:
                        (stats?.serviceRevenue?.total || 0) -
                          (stats?.consultantCommission?.total || 0) >=
                        0
                          ? "primary.200"
                          : "error.200",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      gutterBottom
                    >
                      Projected Gross Profit
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={
                        (stats?.serviceRevenue?.total || 0) -
                          (stats?.consultantCommission?.total || 0) >=
                        0
                          ? "primary.main"
                          : "error.main"
                      }
                    >
                      {formatCurrency(
                        (stats?.serviceRevenue?.total || 0) -
                          (stats?.consultantCommission?.total || 0)
                      )}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Business Profit */}
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight="bold"
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Business Profit(ACTUAL)
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Row 1: Service Revenue → Gross Profit */}
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Service Revenue"
                value={formatCurrency(
                  stats?.financial?.businessProfit?.serviceRevenue || 0
                )}
                icon={<TrendingUp />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Consultant Commission"
                value={formatCurrency(
                  stats?.financial?.businessProfit?.consultantCommission || 0
                )}
                icon={<TrendingDown />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Actual Gross Profit"
                value={formatCurrency(
                  stats?.financial?.businessProfit?.grossProfit || 0
                )}
                icon={<AccountBalance />}
                color={
                  (stats?.financial?.businessProfit?.grossProfit || 0) >= 0
                    ? "info"
                    : "error"
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Gross Profit – Operating Expenses = Net Profit
                </Typography>
              </Divider>
            </Grid>

            {/* Row 2: Gross Profit → Net Profit */}
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Actual Gross Profit"
                value={formatCurrency(
                  stats?.financial?.businessProfit?.grossProfit || 0
                )}
                icon={<TrendingUp />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Operating Expenses"
                value={formatCurrency(
                  stats?.financial?.businessProfit?.operatingExpenses || 0
                )}
                icon={<TrendingDown />}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Net Profit"
                value={formatCurrency(
                  stats?.financial?.businessProfit?.netProfit || 0
                )}
                icon={<AccountBalance />}
                color={
                  (stats?.financial?.businessProfit?.netProfit || 0) >= 0
                    ? "primary"
                    : "error"
                }
              />
            </Grid>
          </Grid>

          {/* Fee Management */}
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight="bold"
              sx={{ textTransform: "uppercase", letterSpacing: 1 }}
            >
              Fee Management
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Fee Collected from Students"
                value={formatCurrency(
                  stats?.financial?.feeManagement?.feeIncome || 0
                )}
                icon={<TrendingUp />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Fee Paid to College"
                value={formatCurrency(
                  stats?.financial?.feeManagement?.feePaidToCollege || 0
                )}
                icon={<TrendingDown />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Balance Payable to College"
                value={formatCurrency(
                  stats?.financial?.feeManagement?.balancePayableToCollege || 0
                )}
                icon={<AccountBalance />}
                color={
                  (stats?.financial?.feeManagement?.balancePayableToCollege ||
                    0) <= 0
                    ? "success"
                    : "error"
                }
              />
            </Grid>
          </Grid>

          {/* Service Revenue & Consultant Commission */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight="bold"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      mb: 1.5,
                    }}
                  >
                    Service Revenue
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(stats?.serviceRevenue?.total || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="success.main">
                      Received
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {formatCurrency(stats?.serviceRevenue?.received || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="error.main">
                      Pending
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="error.main"
                    >
                      {formatCurrency(stats?.serviceRevenue?.pending || 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card>
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    fontWeight="bold"
                    sx={{
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      mb: 1.5,
                    }}
                  >
                    Consultant Commission
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(stats?.consultantCommission?.total || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="success.main">
                      Paid to Consultants
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      {formatCurrency(stats?.consultantCommission?.paid || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="error.main">
                      Consultant Payable
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="error.main"
                    >
                      {formatCurrency(
                        stats?.consultantCommission?.payable || 0
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Cash positions */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Cash in Hand"
                value={formatCurrency(stats?.cashInHand || 0)}
                icon={<Payment />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Cash in Bank"
                value={formatCurrency(stats?.cashInBank || 0)}
                icon={<AccountBalance />}
                color="secondary"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Admission Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Admissions"
            value={stats?.admissions?.total || 0}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Confirmed"
            value={stats?.admissions?.confirmed || 0}
            icon={<AssignmentTurnedIn />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats?.admissions?.pending || 0}
            icon={<Pending />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cancelled"
            value={stats?.admissions?.cancelled || 0}
            icon={<Cancel />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Pending Payments */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Student Payments Pending
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(stats?.pending?.studentPayments?.amount || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.pending?.studentPayments?.count || 0} students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {!isStaff && stats?.pending?.serviceCharge && (
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Service Charge Pending
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(stats?.pending?.serviceCharge?.amount || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats?.pending?.serviceCharge?.count || 0} admissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {!isStaff && (
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Agent Payments Pending
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(stats?.pending?.agentPayments?.amount || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats?.pending?.agentPayments?.count || 0} admissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Monthly Income vs Expense - hidden for staff */}
        {!isStaff && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Income vs Expense
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="Income"
                        stroke="#4caf50"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#f44336"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Admission Status Pie */}
        <Grid item xs={12} md={isStaff ? 12 : 6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Admission Status
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={admissionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {admissionPieData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Admission Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Admissions
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={admissionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="confirmed" name="Confirmed" fill="#4caf50" />
                    <Bar dataKey="pending" name="Pending" fill="#ff9800" />
                    <Bar dataKey="cancelled" name="Cancelled" fill="#f44336" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
