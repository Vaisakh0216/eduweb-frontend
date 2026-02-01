import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actionLabel,
  actionIcon = <AddIcon />,
  onActionClick,
  actionDisabled = false,
  children,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={crumb.label} color="text.primary" variant="body2">
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.label}
                component={RouterLink}
                to={crumb.path}
                underline="hover"
                color="inherit"
                variant="body2"
              >
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom={!!subtitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {children}
          {actionLabel && (
            <Button
              variant="contained"
              startIcon={actionIcon}
              onClick={onActionClick}
              disabled={actionDisabled}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
