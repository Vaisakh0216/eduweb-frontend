export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  STAFF: 'staff',
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
};

export const ADMISSION_STATUS = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
};

export const ADMISSION_STATUS_OPTIONS = [
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const REFERRAL_SOURCES = [
  { value: 'Website', label: 'Website' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'Agent', label: 'Agent' },
  { value: 'Walk-in', label: 'Walk-in' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Advertisement', label: 'Advertisement' },
  { value: 'Other', label: 'Other' },
];

export const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

export const RELIGIONS = [
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Muslim', label: 'Muslim' },
  { value: 'Christian', label: 'Christian' },
  { value: 'Sikh', label: 'Sikh' },
  { value: 'Buddhist', label: 'Buddhist' },
  { value: 'Jain', label: 'Jain' },
  { value: 'Other', label: 'Other' },
];

export const QUALIFICATIONS = [
  { value: '10th', label: '10th' },
  { value: '12th', label: '12th' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Post Graduate', label: 'Post Graduate' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Other', label: 'Other' },
];

export const AGENT_TYPES = [
  { value: 'Main', label: 'Main Agent' },
  { value: 'College', label: 'College Agent' },
  { value: 'Sub', label: 'Sub Agent' },
];

export const PAYER_TYPES = [
  { value: 'Student', label: 'Student' },
  { value: 'College', label: 'College' },
  { value: 'Consultancy', label: 'Consultancy' },
  { value: 'Agent', label: 'Agent' },
];

export const RECEIVER_TYPES = [
  { value: 'Consultancy', label: 'Consultancy' },
  { value: 'College', label: 'College' },
  { value: 'Agent', label: 'Agent' },
];

// Generate academic years from current year to 2030
const currentYear = new Date().getFullYear();
export const ACADEMIC_YEARS = [];
for (let year = currentYear - 2; year <= 2030; year++) {
  ACADEMIC_YEARS.push({ value: `${year}-${year + 1}`, label: `${year}-${year + 1}` });
}

export const PAYMENT_MODES = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Card', label: 'Card' },
  { value: 'BankTransfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
];

export const DAYBOOK_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export const DAYBOOK_CATEGORIES = [
  { value: 'electricity_bill', label: 'Electricity Bill' },
  { value: 'water_bill', label: 'Water Bill' },
  { value: 'office_rent', label: 'Office Rent' },
  { value: 'salary', label: 'Salary' },
  { value: 'paid_to_college', label: 'Paid to College' },
  { value: 'paid_to_agent', label: 'Paid to Agent' },
  { value: 'received_from_student', label: 'Received from Student' },
  { value: 'received_from_college_service_charge', label: 'Service Charge from College' },
  { value: 'service_charge_income', label: 'Service Charge (Deducted)' },
  { value: 'misc', label: 'Miscellaneous' },
];

export const STATUS_COLORS = {
  Confirmed: 'success',
  Pending: 'warning',
  Cancelled: 'error',
};
