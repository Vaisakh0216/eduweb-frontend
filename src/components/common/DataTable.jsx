import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  Typography,
  CircularProgress,
  TableSortLabel,
} from '@mui/material';

const DataTable = ({
  columns,
  data,
  loading = false,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  emptyMessage = 'No data available',
  stickyHeader = true,
  maxHeight,
}) => {
  const handlePageChange = (event, newPage) => {
    onPageChange?.(newPage + 1);
  };

  const handleRowsPerPageChange = (event) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: maxHeight || 'calc(100vh - 350px)' }}>
        <Table stickyHeader={stickyHeader} size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    minWidth: column.minWidth,
                    width: column.width,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={row._id || row.id || rowIndex}
                  hover
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:last-child td': { border: 0 },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      align={column.align || 'left'}
                      sx={{
                        whiteSpace: column.wrap ? 'normal' : 'nowrap',
                        maxWidth: column.maxWidth,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {column.renderCell
                        ? column.renderCell(row)
                        : row[column.field] ?? '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total || 0}
          page={(pagination.page || 1) - 1}
          rowsPerPage={pagination.limit || 10}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      )}
    </Paper>
  );
};

export default DataTable;
