import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Grid, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Typography, Divider, CircularProgress, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../components/common/PageHeader';
import { admissionService, branchService, collegeService, courseService, agentService } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ADMISSION_STATUS_OPTIONS, REFERRAL_SOURCES, GENDERS, RELIGIONS, QUALIFICATIONS, AGENT_TYPES, ACADEMIC_YEARS } from '../utils/constants';

const AdmissionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff, user } = useAuth();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [agents, setAgents] = useState({ main: [], college: [], sub: [] });
  const [formData, setFormData] = useState({
    admissionDate: new Date(), branchId: '', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, admissionStatus: 'Pending', referralSource: '',
    student: { firstName: '', lastName: '', email: '', phone: '', dob: null, gender: '', religion: '', highestQualification: '', address: { state: '', district: '', city: '', pincode: '', addressLine: '' }, parentsPhone: '' },
    collegeId: '', courseId: '',
    agent: { agentType: '', agentId: '', agentFee: 0 }, // Legacy single agent
    agents: { // Multiple agents
      mainAgent: { agentId: '', agentFee: 0 },
      collegeAgent: { agentId: '', agentFee: 0 },
      subAgent: { agentId: '', agentFee: 0 },
    },
    fees: { offeredFee: 0, admissionFee: 0, tuitionFeeYear1: 0, tuitionFeeYear2: 0, tuitionFeeYear3: 0, tuitionFeeYear4: 0, hostelIncluded: false, hostelFeeYear1: 0, hostelFeeYear2: 0, hostelFeeYear3: 0, hostelFeeYear4: 0 },
    serviceCharge: { agreed: 0 }, notes: ''
  });

  useEffect(() => { fetchInitialData(); if (isEdit) fetchAdmission(); }, [id]);

  const fetchInitialData = async () => {
    try {
      const [branchRes, collegeRes, mainAgentRes, collegeAgentRes, subAgentRes] = await Promise.all([
        branchService.getActive(), 
        collegeService.getActive(),
        agentService.getActive('Main'),
        agentService.getActive('College'),
        agentService.getActive('Sub'),
      ]);
      setBranches(branchRes.data.data);
      setColleges(collegeRes.data.data);
      setAgents({
        main: mainAgentRes.data.data,
        college: collegeAgentRes.data.data,
        sub: subAgentRes.data.data,
      });
      if (!isEdit && branchRes.data.data.length === 1) setFormData(prev => ({ ...prev, branchId: branchRes.data.data[0]._id }));
    } catch (e) { console.error(e); }
  };

  const fetchAdmission = async () => {
    try {
      const res = await admissionService.getById(id);
      const adm = res.data.data;
      setFormData({
        ...adm, branchId: adm.branchId?._id, collegeId: adm.collegeId?._id, courseId: adm.courseId?._id,
        agent: { ...adm.agent, agentId: adm.agent?.agentId?._id || '' },
        agents: {
          mainAgent: { agentId: adm.agents?.mainAgent?.agentId?._id || '', agentFee: adm.agents?.mainAgent?.agentFee || 0 },
          collegeAgent: { agentId: adm.agents?.collegeAgent?.agentId?._id || '', agentFee: adm.agents?.collegeAgent?.agentFee || 0 },
          subAgent: { agentId: adm.agents?.subAgent?.agentId?._id || '', agentFee: adm.agents?.subAgent?.agentFee || 0 },
        }
      });
      if (adm.collegeId?._id) fetchCourses(adm.collegeId._id);
    } catch (e) { console.error(e); navigate('/admissions'); }
    finally { setLoading(false); }
  };

  const fetchCourses = async (collegeId) => {
    try {
      const res = await courseService.getByCollege(collegeId);
      setCourses(res.data.data);
    } catch (e) { console.error(e); }
  };

  const handleCollegeChange = (collegeId) => {
    setFormData(prev => ({ ...prev, collegeId, courseId: '' }));
    fetchCourses(collegeId);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await admissionService.update(id, formData);
      } else {
        await admissionService.create(formData);
      }
      navigate('/admissions');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save admission');
    } finally { setSaving(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const totalFee = (formData.fees?.offeredFee || 0) + (formData.fees?.admissionFee || 0) + 
    (formData.fees?.tuitionFeeYear1 || 0) + (formData.fees?.tuitionFeeYear2 || 0) + 
    (formData.fees?.tuitionFeeYear3 || 0) + (formData.fees?.tuitionFeeYear4 || 0) +
    (formData.fees?.hostelIncluded ? ((formData.fees?.hostelFeeYear1 || 0) + (formData.fees?.hostelFeeYear2 || 0) + 
    (formData.fees?.hostelFeeYear3 || 0) + (formData.fees?.hostelFeeYear4 || 0)) : 0);

  return (
    <Box>
      <PageHeader title={isEdit ? 'Edit Admission' : 'New Admission'} breadcrumbs={[{ label: 'Admissions', path: '/admissions' }, { label: isEdit ? 'Edit' : 'New' }]} />
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><DatePicker label="Admission Date" value={formData.admissionDate ? new Date(formData.admissionDate) : null} onChange={(d) => setFormData(prev => ({ ...prev, admissionDate: d }))} slotProps={{ textField: { fullWidth: true } }} /></Grid>
                <Grid item xs={6} md={3}><FormControl fullWidth><InputLabel>Branch</InputLabel><Select value={formData.branchId} onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))} label="Branch">{branches.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6} md={3}><FormControl fullWidth><InputLabel>Academic Year</InputLabel><Select value={formData.academicYear} onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))} label="Academic Year">{ACADEMIC_YEARS.map(y => <MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6} md={3}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={formData.admissionStatus} onChange={(e) => setFormData(prev => ({ ...prev, admissionStatus: e.target.value }))} label="Status">{ADMISSION_STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6} md={3}><FormControl fullWidth><InputLabel>Referral Source</InputLabel><Select value={formData.referralSource || ''} onChange={(e) => setFormData(prev => ({ ...prev, referralSource: e.target.value }))} label="Referral Source"><MenuItem value="">None</MenuItem>{REFERRAL_SOURCES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Student Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth label="First Name" value={formData.student?.firstName || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, firstName: e.target.value } }))} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Last Name" value={formData.student?.lastName || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, lastName: e.target.value } }))} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.student?.phone || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, phone: e.target.value } }))} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Email" value={formData.student?.email || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, email: e.target.value } }))} /></Grid>
                <Grid item xs={4}><DatePicker label="Date of Birth" value={formData.student?.dob ? new Date(formData.student.dob) : null} onChange={(d) => setFormData(prev => ({ ...prev, student: { ...prev.student, dob: d } }))} slotProps={{ textField: { fullWidth: true } }} /></Grid>
                <Grid item xs={4}><FormControl fullWidth><InputLabel>Gender</InputLabel><Select value={formData.student?.gender || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, gender: e.target.value } }))} label="Gender"><MenuItem value="">Select</MenuItem>{GENDERS.map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={4}><FormControl fullWidth><InputLabel>Religion</InputLabel><Select value={formData.student?.religion || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, religion: e.target.value } }))} label="Religion"><MenuItem value="">Select</MenuItem>{RELIGIONS.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={4}><FormControl fullWidth><InputLabel>Qualification</InputLabel><Select value={formData.student?.highestQualification || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, highestQualification: e.target.value } }))} label="Qualification"><MenuItem value="">Select</MenuItem>{QUALIFICATIONS.map(q => <MenuItem key={q.value} value={q.value}>{q.label}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={4}><TextField fullWidth label="Parents Phone" value={formData.student?.parentsPhone || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, parentsPhone: e.target.value } }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Address" value={formData.student?.address?.addressLine || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, address: { ...prev.student?.address, addressLine: e.target.value } } }))} /></Grid>
                <Grid item xs={3}><TextField fullWidth label="City" value={formData.student?.address?.city || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, address: { ...prev.student?.address, city: e.target.value } } }))} /></Grid>
                <Grid item xs={3}><TextField fullWidth label="District" value={formData.student?.address?.district || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, address: { ...prev.student?.address, district: e.target.value } } }))} /></Grid>
                <Grid item xs={3}><TextField fullWidth label="State" value={formData.student?.address?.state || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, address: { ...prev.student?.address, state: e.target.value } } }))} /></Grid>
                <Grid item xs={3}><TextField fullWidth label="Pincode" value={formData.student?.address?.pincode || ''} onChange={(e) => setFormData(prev => ({ ...prev, student: { ...prev.student, address: { ...prev.student?.address, pincode: e.target.value } } }))} /></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Course Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>College</InputLabel><Select value={formData.collegeId || ''} onChange={(e) => handleCollegeChange(e.target.value)} label="College"><MenuItem value="">Select College</MenuItem>{colleges.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>Course</InputLabel><Select value={formData.courseId || ''} onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))} label="Course" disabled={!formData.collegeId}><MenuItem value="">Select Course</MenuItem>{courses.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Agent Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Main Agent</Typography></Grid>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>Main Agent</InputLabel><Select value={formData.agents?.mainAgent?.agentId || ''} onChange={(e) => setFormData(prev => ({ ...prev, agents: { ...prev.agents, mainAgent: { ...prev.agents?.mainAgent, agentId: e.target.value } } }))} label="Main Agent"><MenuItem value="">None</MenuItem>{agents.main?.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6}><TextField fullWidth label="Main Agent Fee" type="number" value={formData.agents?.mainAgent?.agentFee || 0} onChange={(e) => setFormData(prev => ({ ...prev, agents: { ...prev.agents, mainAgent: { ...prev.agents?.mainAgent, agentFee: parseFloat(e.target.value) || 0 } } }))} /></Grid>
                
                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">College Agent</Typography></Grid>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>College Agent</InputLabel><Select value={formData.agents?.collegeAgent?.agentId || ''} onChange={(e) => setFormData(prev => ({ ...prev, agents: { ...prev.agents, collegeAgent: { ...prev.agents?.collegeAgent, agentId: e.target.value } } }))} label="College Agent"><MenuItem value="">None</MenuItem>{agents.college?.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6}><TextField fullWidth label="College Agent Fee" type="number" value={formData.agents?.collegeAgent?.agentFee || 0} onChange={(e) => setFormData(prev => ({ ...prev, agents: { ...prev.agents, collegeAgent: { ...prev.agents?.collegeAgent, agentFee: parseFloat(e.target.value) || 0 } } }))} /></Grid>
                
                <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Sub Agent</Typography></Grid>
                <Grid item xs={6}><FormControl fullWidth><InputLabel>Sub Agent</InputLabel><Select value={formData.agents?.subAgent?.agentId || ''} onChange={(e) => setFormData(prev => ({ ...prev, agents: { ...prev.agents, subAgent: { ...prev.agents?.subAgent, agentId: e.target.value } } }))} label="Sub Agent"><MenuItem value="">None</MenuItem>{agents.sub?.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}</Select></FormControl></Grid>
                <Grid item xs={6}><TextField fullWidth label="Sub Agent Fee" type="number" value={formData.agents?.subAgent?.agentFee || 0} onChange={(e) => setFormData(prev => ({ ...prev, agents: { ...prev.agents, subAgent: { ...prev.agents?.subAgent, agentFee: parseFloat(e.target.value) || 0 } } }))} /></Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Total Agent Fee:</strong> ₹{((formData.agents?.mainAgent?.agentFee || 0) + (formData.agents?.collegeAgent?.agentFee || 0) + (formData.agents?.subAgent?.agentFee || 0)).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Fees</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField fullWidth label="Offered Fee" type="number" value={formData.fees?.offeredFee} onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, offeredFee: parseFloat(e.target.value) || 0 } }))} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Admission Fee" type="number" value={formData.fees?.admissionFee} onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, admissionFee: parseFloat(e.target.value) || 0 } }))} /></Grid>
                <Grid item xs={12}><Divider><Typography variant="caption">Tuition Fees</Typography></Divider></Grid>
                {[1, 2, 3, 4].map(y => <Grid item xs={6} key={y}><TextField fullWidth label={`Year ${y}`} type="number" value={formData.fees?.[`tuitionFeeYear${y}`]} onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, [`tuitionFeeYear${y}`]: parseFloat(e.target.value) || 0 } }))} /></Grid>)}
                <Grid item xs={12}><FormControlLabel control={<Checkbox checked={formData.fees?.hostelIncluded} onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, hostelIncluded: e.target.checked } }))} />} label="Hostel Included" /></Grid>
                {formData.fees?.hostelIncluded && <>
                  <Grid item xs={12}><Divider><Typography variant="caption">Hostel Fees</Typography></Divider></Grid>
                  {[1, 2, 3, 4].map(y => <Grid item xs={6} key={y}><TextField fullWidth label={`Year ${y}`} type="number" value={formData.fees?.[`hostelFeeYear${y}`]} onChange={(e) => setFormData(prev => ({ ...prev, fees: { ...prev.fees, [`hostelFeeYear${y}`]: parseFloat(e.target.value) || 0 } }))} /></Grid>)}
                </>}
                <Grid item xs={12}><Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 1, textAlign: 'center' }}><Typography variant="body2">Total Fee</Typography><Typography variant="h5">₹{totalFee.toLocaleString()}</Typography></Box></Grid>
              </Grid>
            </CardContent>
          </Card>

          {!isStaff && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Service Charge</Typography>
                <TextField fullWidth label="Service Charge Agreed" type="number" value={formData.serviceCharge?.agreed} onChange={(e) => setFormData(prev => ({ ...prev, serviceCharge: { ...prev.serviceCharge, agreed: parseFloat(e.target.value) || 0 } }))} />
              </CardContent>
            </Card>
          )}

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField fullWidth label="Notes" multiline rows={3} value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/admissions')} fullWidth>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={saving} fullWidth>{saving ? 'Saving...' : 'Save'}</Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdmissionFormPage;
