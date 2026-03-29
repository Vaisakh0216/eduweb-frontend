import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Book as BookIcon,
  AccountBalance as AccountBalanceIcon,
  ReceiptLong as VoucherIcon,
  SupportAgent as AgentIcon,
  Wallet as WalletIcon,
  ExpandLess,
  ExpandMore,
  SpaceDashboard as OverviewIcon,
  WorkOutline as OperationsIcon,
  LibraryBooks as MastersIcon,
  AccountBalanceWallet as AccountsIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/Logo.png";

const Sidebar = ({ drawerWidth, mobileOpen, onDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isStaff } = useAuth();

  const groups = [
    {
      key: "overview",
      label: "Overview",
      icon: <OverviewIcon fontSize="small" />,
      items: [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard", superAdminOnly: true },
      ],
    },
    {
      key: "operations",
      label: "Operations",
      icon: <OperationsIcon fontSize="small" />,
      items: [
        { text: "Admissions", icon: <AssignmentIcon />, path: "/admissions", staffVisible: true },
        { text: "Payments", icon: <PaymentIcon />, path: "/payments" },
        { text: "Agent Payments", icon: <ReceiptIcon />, path: "/agent-payments", superAdminOnly: true },
      ],
    },
    {
      key: "masters",
      label: "Masters",
      icon: <MastersIcon fontSize="small" />,
      superAdminOnly: true,
      items: [
        { text: "Agents", icon: <AgentIcon />, path: "/agents", superAdminOnly: true },
        { text: "Colleges", icon: <SchoolIcon />, path: "/colleges", superAdminOnly: true },
        { text: "Courses", icon: <MenuBookIcon />, path: "/courses", superAdminOnly: true },
      ],
    },
    {
      key: "accounts",
      label: "Accounts",
      icon: <AccountsIcon fontSize="small" />,
      items: [
        { text: "Daybook", icon: <BookIcon />, path: "/daybook" },
        { text: "Cashbook", icon: <AccountBalanceIcon />, path: "/cashbook" },
        { text: "Petty Cash", icon: <WalletIcon />, path: "/petty-cash", staffVisible: true },
        { text: "Vouchers", icon: <VoucherIcon />, path: "/vouchers" },
      ],
    },
    {
      key: "administration",
      label: "Administration",
      icon: <AdminIcon fontSize="small" />,
      superAdminOnly: true,
      items: [
        { text: "Users", icon: <PeopleIcon />, path: "/users", superAdminOnly: true },
        { text: "Branches", icon: <BusinessIcon />, path: "/branches", superAdminOnly: true },
      ],
    },
  ];

  const isItemVisible = (item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.adminOnly && !isSuperAdmin && !isAdmin) return false;
    if (isStaff && !isSuperAdmin && !isAdmin && !item.staffVisible) return false;
    return true;
  };

  const visibleGroups = groups
    .filter((g) => {
      if (g.superAdminOnly && !isSuperAdmin) return false;
      return g.items.some(isItemVisible);
    })
    .map((g) => ({ ...g, items: g.items.filter(isItemVisible) }));

  // Determine which group contains the active route
  const activeGroupKey = visibleGroups.find((g) =>
    g.items.some(
      (item) =>
        location.pathname === item.path ||
        (item.path !== "/dashboard" && location.pathname.startsWith(item.path))
    )
  )?.key;

  const [openGroups, setOpenGroups] = useState({});

  // Auto-expand the group that contains the active route
  useEffect(() => {
    if (activeGroupKey) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupKey]: true }));
    }
  }, [activeGroupKey]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) onDrawerToggle();
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "center",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <img src={Logo} width="150px" height="40px" />
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 1, overflowY: "auto" }}>
        {visibleGroups.map((group) => {
          const isOpen = !!openGroups[group.key];
          const isGroupActive = group.key === activeGroupKey;

          return (
            <Box key={group.key}>
              {/* Group header */}
              <ListItem disablePadding sx={{ px: 1 }}>
                <ListItemButton
                  onClick={() => toggleGroup(group.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: isGroupActive && !isOpen ? "primary.50" : "transparent",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isGroupActive ? "primary.main" : "text.secondary",
                    }}
                  >
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={group.label}
                    primaryTypographyProps={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: isGroupActive ? "primary.main" : "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  />
                  {isOpen ? (
                    <ExpandLess sx={{ fontSize: 18, color: "text.secondary" }} />
                  ) : (
                    <ExpandMore sx={{ fontSize: 18, color: "text.secondary" }} />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Sub-items */}
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {group.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== "/dashboard" &&
                        location.pathname.startsWith(item.path));

                    return (
                      <ListItem key={item.text} disablePadding sx={{ pl: 2, pr: 1 }}>
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            pl: 1.5,
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
                          <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
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
              </Collapse>
            </Box>
          );
        })}
      </List>

      {/* User info */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
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
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
