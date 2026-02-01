import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../../utils/constants';

const StatusChip = ({ status, size = 'small' }) => {
  const color = STATUS_COLORS[status] || 'default';

  return (
    <Chip
      label={status}
      color={color}
      size={size}
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusChip;
