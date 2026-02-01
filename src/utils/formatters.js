import { format, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, formatStr);
  } catch {
    return '-';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  return phone;
};

export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatCategoryLabel = (category) => {
  if (!category) return '-';
  return category
    .split('_')
    .map(word => capitalizeFirst(word))
    .join(' ');
};
