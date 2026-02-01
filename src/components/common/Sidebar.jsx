import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Book as BookIcon,
  AccountBalance as AccountBalanceIcon,
  ReceiptLong as VoucherIcon,
  SupportAgent as AgentIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/Logo.png";

const Sidebar = ({ drawerWidth, mobileOpen, onDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Admissions", icon: <AssignmentIcon />, path: "/admissions" },
    { text: "Payments", icon: <PaymentIcon />, path: "/payments" },
    {
      text: "Agent Payments",
      icon: <ReceiptIcon />,
      path: "/agent-payments",
      adminOnly: true,
    },
    { divider: true },
    { text: "Agents", icon: <AgentIcon />, path: "/agents" },
    { text: "Colleges", icon: <SchoolIcon />, path: "/colleges" },
    { text: "Courses", icon: <MenuBookIcon />, path: "/courses" },
    { divider: true },
    { text: "Daybook", icon: <BookIcon />, path: "/daybook" },
    { text: "Cashbook", icon: <AccountBalanceIcon />, path: "/cashbook" },
    { text: "Vouchers", icon: <VoucherIcon />, path: "/vouchers" },
    { divider: true },
    { text: "Users", icon: <PeopleIcon />, path: "/users", adminOnly: true },
    {
      text: "Branches",
      icon: <BusinessIcon />,
      path: "/branches",
      superAdminOnly: true,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.divider) return true;
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isSuperAdmin && !isAdmin) return false;
    return true;
  });

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onDrawerToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "center",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <img src={Logo} width="150px" height="40p" />
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 1 }}>
        {filteredMenuItems.map((item, index) => {
          if (item.divider) {
            return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
          }

          const isActive =
            location.pathname === item.path ||
            (item.path !== "/dashboard" &&
              location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? "primary.main" : "transparent",
                  color: isActive ? "white" : "text.primary",
                  "&:hover": {
                    backgroundColor: isActive ? "primary.dark" : "action.hover",
                  },
                  "& .MuiListItemIcon-root": {
                    color: isActive ? "white" : "text.secondary",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User info */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          {user?.fullName || `${user?.firstName} ${user?.lastName}`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.role?.replace("_", " ")?.toUpperCase()}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
