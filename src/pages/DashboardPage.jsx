import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  TrendingUp,
  TrendingDown,
  People,
  Payment,
  AccountBalance,
  AssignmentTurnedIn,
  Pending,
  Cancel,
} from '@mui/icons-material';
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
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { dashboardService, branchService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#4caf50', '#ff9800', '#f44336'];

const DashboardPage = () => {
  const { user, isSuperAdmin, isStaff } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [admissionTrend, setAdmissionTrend] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branchId: '',
    startDate: null,
    endDate: null,
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchBranches = async () => {
    try {
      const response = await branchService.getActive();
      setBranches(response.data.data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
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
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const admissionPieData = stats ? [
    { name: 'Confirmed', value: stats.admissions?.confirmed || 0 },
    { name: 'Pending', value: stats.admissions?.pending || 0 },
    { name: 'Cancelled', value: stats.admissions?.cancelled || 0 },
  ] : [];

  if (loading && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.firstName}!`} />

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {(isSuperAdmin || user?.branches?.length > 1) && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={filters.branchId}
                  onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
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
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
              slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Financial Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Income"
            value={formatCurrency(stats?.financial?.totalIncome || 0)}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Expense"
            value={formatCurrency(stats?.financial?.totalExpense || 0)}
            icon={<TrendingDown />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Net Profit"
            value={formatCurrency(stats?.financial?.netProfit || 0)}
            icon={<AccountBalance />}
            color={(stats?.financial?.netProfit || 0) >= 0 ? 'primary' : 'error'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Cash in Hand"
            value={formatCurrency(stats?.cashInHand || 0)}
            icon={<Payment />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Cash in Bank"
            value={formatCurrency(stats?.cashInBank || 0)}
            icon={<AccountBalance />}
            color="secondary"
          />
        </Grid>
      </Grid>

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
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Monthly Income vs Expense */}
        <Grid item xs={12} md={8}>
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

        {/* Admission Status Pie */}
        <Grid item xs={12} md={4}>
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
                      {admissionPieData.map((entry, index) => (
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
