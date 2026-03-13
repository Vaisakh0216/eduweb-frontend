import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  School,
  TrendingUp,
  People,
  AccountBalance,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";

const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

const features = [
  { icon: <People sx={{ fontSize: 20 }} />, text: "Manage student admissions end-to-end" },
  { icon: <AccountBalance sx={{ fontSize: 20 }} />, text: "Track payments, cashbook & petty cash" },
  { icon: <TrendingUp sx={{ fontSize: 20 }} />, text: "Real-time reports across branches" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* ── Left panel ── */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          px: 8,
          background: "linear-gradient(160deg, #0d47a1 0%, #1565c0 40%, #1976d2 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 6 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, p: 1, display: "flex" }}>
              <School sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="#fff" letterSpacing={0.5}>
              EduConsult ERP
            </Typography>
          </Box>

          <Typography variant="h3" fontWeight={800} color="#fff" lineHeight={1.2} sx={{ mb: 2 }}>
            Your complete
            <br />
            education CRM
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.75)", mb: 6, maxWidth: 360 }}>
            Streamline admissions, finances, and branch operations — all in one place.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {features.map((f, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ bgcolor: "rgba(255,255,255,0.15)", borderRadius: 1.5, p: 0.75, display: "flex", color: "#fff" }}>
                  {f.icon}
                </Box>
                <Typography variant="body2" color="rgba(255,255,255,0.85)">{f.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Right panel ── */}
      <Box
        sx={{
          flex: { xs: 1, md: "0 0 440px" },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: { xs: 3, sm: 6 },
          py: 6,
          bgcolor: "#fafafa",
        }}
      >
        {/* Mobile logo */}
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 5 }}>
          <School sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography variant="h6" fontWeight={700}>EduConsult ERP</Typography>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 360 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to continue to your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Email address
            </Typography>
            <TextField
              fullWidth
              placeholder="you@example.com"
              type="email"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 2, bgcolor: "#fff" } }}
            />

            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Password
            </Typography>
            <TextField
              fullWidth
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 4 }}
              InputProps={{
                sx: { borderRadius: 2, bgcolor: "#fff" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                borderRadius: 2,
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(25,118,210,0.4)",
                "&:hover": { boxShadow: "0 6px 20px rgba(25,118,210,0.5)" },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={18} color="inherit" />
                  Signing in...
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ mt: "auto", pt: 6 }}>
          © {new Date().getFullYear()} EduConsult ERP. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
