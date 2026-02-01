import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  trendLabel,
}) => {
  const colorMap = {
    primary: { bg: '#e3f2fd', main: '#1976d2' },
    success: { bg: '#e8f5e9', main: '#2e7d32' },
    warning: { bg: '#fff3e0', main: '#ed6c02' },
    error: { bg: '#ffebee', main: '#d32f2f' },
    info: { bg: '#e1f5fe', main: '#0288d1' },
    secondary: { bg: '#f3e5f5', main: '#9c27b0' },
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: trend >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 500,
                  }}
                >
                  {trend >= 0 ? '+' : ''}{trend}%
                </Typography>
                {trendLabel && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    {trendLabel}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
          {icon && (
            <Avatar
              sx={{
                bgcolor: colors.bg,
                color: colors.main,
                width: 48,
                height: 48,
              }}
            >
              {icon}
            </Avatar>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
