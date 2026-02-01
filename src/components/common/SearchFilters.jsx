import { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  IconButton,
  Collapse,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const SearchFilters = ({
  searchPlaceholder = 'Search...',
  filters = [],
  values = {},
  onChange,
  onSearch,
  onClear,
  showDateRange = false,
  collapsible = false,
}) => {
  const [expanded, setExpanded] = useState(!collapsible);

  const handleChange = (field, value) => {
    onChange({ ...values, [field]: value });
  };

  const handleSearch = () => {
    onSearch?.(values);
  };

  const handleClear = () => {
    const clearedValues = { search: '' };
    filters.forEach((f) => {
      clearedValues[f.field] = '';
    });
    if (showDateRange) {
      clearedValues.startDate = null;
      clearedValues.endDate = null;
    }
    onChange(clearedValues);
    onClear?.(clearedValues);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder={searchPlaceholder}
          value={values.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          onKeyPress={handleKeyPress}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: values.search && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleChange('search', '')}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {collapsible && (
          <Button
            size="small"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Less Filters' : 'More Filters'}
          </Button>
        )}

        {!collapsible && (
          <>
            {filters.map((filter) => (
              <FormControl key={filter.field} size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={values[filter.field] || ''}
                  onChange={(e) => handleChange(filter.field, e.target.value)}
                  label={filter.label}
                >
                  <MenuItem value="">All</MenuItem>
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            {showDateRange && (
              <>
                <DatePicker
                  label="Start Date"
                  value={values.startDate || null}
                  onChange={(date) => handleChange('startDate', date)}
                  slotProps={{
                    textField: { size: 'small', sx: { width: 150 } },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={values.endDate || null}
                  onChange={(date) => handleChange('endDate', date)}
                  slotProps={{
                    textField: { size: 'small', sx: { width: 150 } },
                  }}
                />
              </>
            )}
          </>
        )}

        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outlined" onClick={handleClear}>
          Clear
        </Button>
      </Box>

      {collapsible && (
        <Collapse in={expanded}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            {filters.map((filter) => (
              <FormControl key={filter.field} size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{filter.label}</InputLabel>
                <Select
                  value={values[filter.field] || ''}
                  onChange={(e) => handleChange(filter.field, e.target.value)}
                  label={filter.label}
                >
                  <MenuItem value="">All</MenuItem>
                  {filter.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}

            {showDateRange && (
              <>
                <DatePicker
                  label="Start Date"
                  value={values.startDate || null}
                  onChange={(date) => handleChange('startDate', date)}
                  slotProps={{
                    textField: { size: 'small', sx: { width: 150 } },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={values.endDate || null}
                  onChange={(date) => handleChange('endDate', date)}
                  slotProps={{
                    textField: { size: 'small', sx: { width: 150 } },
                  }}
                />
              </>
            )}
          </Box>
        </Collapse>
      )}
    </Paper>
  );
};

export default SearchFilters;
