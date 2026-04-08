import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import PageHeader from "../components/common/PageHeader";
import {
  admissionService,
  branchService,
  collegeService,
  courseService,
  agentService,
} from "../api/services";
import { useAuth } from "../context/AuthContext";
import {
  ADMISSION_STATUS_OPTIONS,
  REFERRAL_SOURCES,
  GENDERS,
  RELIGIONS,
  QUALIFICATIONS,
  ACADEMIC_YEARS,
} from "../utils/constants";
import indiaLocations from "../data/indiaLocations.json";

const AdmissionFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff, user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [agents, setAgents] = useState({ main: [], college: [], sub: [] });
  const [formData, setFormData] = useState({
    admissionDate: new Date(),
    branchId: "",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    admissionStatus: "Pending",
    referralSource: "",
    telecallerName: "",
    student: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: null,
      gender: "",
      religion: "",
      highestQualification: "",
      address: {
        state: "",
        district: "",
        city: "",
        pincode: "",
        addressLine: "",
      },
      parentsPhone: "",
    },
    collegeId: "",
    courseId: "",
    agent: { agentType: "", agentId: "", agentFee: 0 },
    agents: {
      mainAgent: { agentId: "", agentFee: "" },
      collegeAgent: { agentId: "", agentFee: "" },
      subAgent: { agentId: "", agentFee: "" },
    },
    fees: {
      offeredFee: 0,
      admissionFee: 0,
      tuitionFeeYear1: 0,
      tuitionFeeYear2: 0,
      tuitionFeeYear3: 0,
      tuitionFeeYear4: 0,
      hostelIncluded: false,
      hostelFeeYear1: 0,
      hostelFeeYear2: 0,
      hostelFeeYear3: 0,
      hostelFeeYear4: 0,
    },
    serviceCharge: { agreed: 0 },
    bonusAmount: 0,
    bonusNotes: "",
    notes: "",
  });

  useEffect(() => {
    fetchInitialData();
    if (isEdit) fetchAdmission();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [branchRes, collegeRes, mainAgentRes, collegeAgentRes, subAgentRes] =
        await Promise.all([
          branchService.getActive(),
          collegeService.getActive(),
          agentService.getActive("Main"),
          agentService.getActive("College"),
          agentService.getActive("Sub"),
        ]);
      const allBranches = branchRes.data.data;
      const staffBranchIds = user?.branches?.map((b) => b._id) || [];
      setBranches(
        isStaff
          ? allBranches.filter((b) => staffBranchIds.includes(b._id))
          : allBranches
      );
      setColleges(collegeRes.data.data);
      setAgents({
        main: mainAgentRes.data.data,
        college: collegeAgentRes.data.data,
        sub: subAgentRes.data.data,
      });
      const availableBranches = isStaff
        ? allBranches.filter((b) => staffBranchIds.includes(b._id))
        : allBranches;
      if (!isEdit && availableBranches.length === 1)
        setFormData((prev) => ({ ...prev, branchId: availableBranches[0]._id }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdmission = async () => {
    try {
      const res = await admissionService.getById(id);
      const adm = res.data.data;
      setFormData({
        ...adm,
        branchId: adm.branchId?._id,
        collegeId: adm.collegeId?._id,
        courseId: adm.courseId?._id,
        agent: { ...adm.agent, agentId: adm.agent?.agentId?._id || "" },
        agents: {
          mainAgent: {
            agentId: adm.agents?.mainAgent?.agentId?._id || "",
            agentFee: adm.agents?.mainAgent?.agentFee || 0,
          },
          collegeAgent: {
            agentId: adm.agents?.collegeAgent?.agentId?._id || "",
            agentFee: adm.agents?.collegeAgent?.agentFee || 0,
          },
          subAgent: {
            agentId: adm.agents?.subAgent?.agentId?._id || "",
            agentFee: adm.agents?.subAgent?.agentFee || 0,
          },
        },
        bonusAmount: adm.bonus?.amount || 0,
        bonusNotes: adm.bonus?.notes || "",
      });
      if (adm.collegeId?._id) fetchCourses(adm.collegeId._id);
    } catch (e) {
      console.error(e);
      navigate("/admissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (collegeId) => {
    try {
      const res = await courseService.getByCollege(collegeId);
      setCourses(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCollegeChange = (collegeId) => {
    setFormData((prev) => ({ ...prev, collegeId, courseId: "" }));
    fetchCourses(collegeId);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...formData,
        agents: {
          mainAgent: {
            ...formData.agents?.mainAgent,
            agentFee: parseFloat(formData.agents?.mainAgent?.agentFee) || 0,
          },
          collegeAgent: {
            ...formData.agents?.collegeAgent,
            agentFee: parseFloat(formData.agents?.collegeAgent?.agentFee) || 0,
          },
          subAgent: {
            ...formData.agents?.subAgent,
            agentFee: parseFloat(formData.agents?.subAgent?.agentFee) || 0,
          },
        },
      };
      let savedId = id;
      if (isEdit) {
        await admissionService.update(id, payload);
      } else {
        const res = await admissionService.create(payload);
        savedId = res.data.data._id;
      }
      // Save bonus separately (super admin only, via dedicated endpoint)
      if (isSuperAdmin && (formData.bonusAmount > 0 || formData.bonusNotes)) {
        await admissionService.updateBonus(savedId, {
          amount: parseFloat(formData.bonusAmount) || 0,
          notes: formData.bonusNotes || "",
        });
      }
      navigate("/admissions");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save admission");
    } finally {
      setSaving(false);
    }
  };

  const setStudent = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      student: { ...prev.student, [field]: value },
    }));

  const setAddress = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      student: {
        ...prev.student,
        address: { ...prev.student?.address, [field]: value },
      },
    }));

  const setAgent = (type, field, value) =>
    setFormData((prev) => ({
      ...prev,
      agents: {
        ...prev.agents,
        [type]: { ...prev.agents?.[type], [field]: value },
      },
    }));

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );

  const totalFee =
    (formData.fees?.admissionFee || 0) + (formData.fees?.tuitionFeeYear1 || 0);

  return (
    <Box>
      <PageHeader
        title={isEdit ? "Edit Admission" : "New Admission"}
        breadcrumbs={[
          { label: "Admissions", path: "/admissions" },
          { label: isEdit ? "Edit" : "New" },
        ]}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left column ── */}
        <Grid item xs={12} md={8}>

          {/* Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <DatePicker
                    label="Admission Date"
                    value={formData.admissionDate ? new Date(formData.admissionDate) : null}
                    onChange={(d) => setFormData((prev) => ({ ...prev, admissionDate: d }))}
                    format="dd/MM/yyyy"
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Branch</InputLabel>
                    <Select
                      value={formData.branchId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, branchId: e.target.value }))}
                      label="Branch"
                    >
                      {branches.map((b) => (
                        <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Academic Year</InputLabel>
                    <Select
                      value={formData.academicYear}
                      onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                      label="Academic Year"
                    >
                      {ACADEMIC_YEARS.map((y) => (
                        <MenuItem key={y.value} value={y.value}>{y.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.admissionStatus}
                      onChange={(e) => setFormData((prev) => ({ ...prev, admissionStatus: e.target.value }))}
                      label="Status"
                    >
                      {ADMISSION_STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Referral Source</InputLabel>
                    <Select
                      value={formData.referralSource || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          referralSource: e.target.value,
                          telecallerName: e.target.value !== "Telecaller" ? "" : prev.telecallerName,
                        }))
                      }
                      label="Referral Source"
                    >
                      <MenuItem value="">None</MenuItem>
                      {REFERRAL_SOURCES.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {formData.referralSource === "Telecaller" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Telecaller Name"
                      value={formData.telecallerName || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, telecallerName: e.target.value }))}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Student Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Student Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="First Name"
                    value={formData.student?.firstName || ""}
                    onChange={(e) => setStudent("firstName", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Last Name"
                    value={formData.student?.lastName || ""}
                    onChange={(e) => setStudent("lastName", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Phone"
                    value={formData.student?.phone || ""}
                    onChange={(e) => setStudent("phone", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Email"
                    value={formData.student?.email || ""}
                    onChange={(e) => setStudent("email", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Parents Phone"
                    value={formData.student?.parentsPhone || ""}
                    onChange={(e) => setStudent("parentsPhone", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <DatePicker
                    label="Date of Birth"
                    value={formData.student?.dob ? new Date(formData.student.dob) : null}
                    onChange={(d) => setStudent("dob", d)}
                    format="dd/MM/yyyy"
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={formData.student?.gender || ""}
                      onChange={(e) => setStudent("gender", e.target.value)}
                      label="Gender"
                    >
                      <MenuItem value="">Select</MenuItem>
                      {GENDERS.map((g) => (
                        <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Religion</InputLabel>
                    <Select
                      value={formData.student?.religion || ""}
                      onChange={(e) => setStudent("religion", e.target.value)}
                      label="Religion"
                    >
                      <MenuItem value="">Select</MenuItem>
                      {RELIGIONS.map((r) => (
                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Qualification</InputLabel>
                    <Select
                      value={formData.student?.highestQualification || ""}
                      onChange={(e) => setStudent("highestQualification", e.target.value)}
                      label="Qualification"
                    >
                      <MenuItem value="">Select</MenuItem>
                      {QUALIFICATIONS.map((q) => (
                        <MenuItem key={q.value} value={q.value}>{q.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Address */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="caption" color="text.secondary">Address</Typography>
                  </Divider>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Address Line"
                    value={formData.student?.address?.addressLine || ""}
                    onChange={(e) => setAddress("addressLine", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>State</InputLabel>
                    <Select
                      value={formData.student?.address?.state || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          student: {
                            ...prev.student,
                            address: { ...prev.student?.address, state: e.target.value, district: "" },
                          },
                        }));
                      }}
                      label="State"
                    >
                      <MenuItem value="">Select</MenuItem>
                      {indiaLocations.states.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>District</InputLabel>
                    <Select
                      value={formData.student?.address?.district || ""}
                      onChange={(e) => setAddress("district", e.target.value)}
                      label="District"
                      disabled={!formData.student?.address?.state}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {(indiaLocations.districts[formData.student?.address?.state] || []).map((d) => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    label="City"
                    value={formData.student?.address?.city || ""}
                    onChange={(e) => setAddress("city", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Pincode"
                    value={formData.student?.address?.pincode || ""}
                    onChange={(e) => setAddress("pincode", e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Course Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>College</InputLabel>
                    <Select
                      value={formData.collegeId || ""}
                      onChange={(e) => handleCollegeChange(e.target.value)}
                      label="College"
                    >
                      <MenuItem value="">Select College</MenuItem>
                      {colleges.map((c) => (
                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={formData.courseId || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                      label="Course"
                      disabled={!formData.collegeId}
                    >
                      <MenuItem value="">Select Course</MenuItem>
                      {courses.map((c) => (
                        <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Agent Details */}
          {!isStaff && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Agent Details
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { key: "mainAgent", label: "Main Agent", list: agents.main },
                    { key: "collegeAgent", label: "College Agent", list: agents.college },
                    { key: "subAgent", label: "Sub Agent", list: agents.sub },
                  ].map(({ key, label, list }, idx) => (
                    <>
                      {idx > 0 && (
                        <Grid item xs={12} key={`divider-${key}`}>
                          <Divider />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6} key={`agent-${key}`}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>{label}</InputLabel>
                          <Select
                            value={formData.agents?.[key]?.agentId || ""}
                            onChange={(e) => setAgent(key, "agentId", e.target.value)}
                            label={label}
                          >
                            <MenuItem value="">None</MenuItem>
                            {list?.map((a) => (
                              <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6} key={`fee-${key}`}>
                        <TextField
                          size="small"
                          fullWidth
                          label={`${label} Fee`}
                          type="number"
                          value={formData.agents?.[key]?.agentFee ?? ""}
                          onChange={(e) => setAgent(key, "agentFee", e.target.value)}
                        />
                      </Grid>
                    </>
                  ))}
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, bgcolor: "grey.100", borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Total Agent Fee:</strong>{" "}
                        ₹{(
                          (parseFloat(formData.agents?.mainAgent?.agentFee) || 0) +
                          (parseFloat(formData.agents?.collegeAgent?.agentFee) || 0) +
                          (parseFloat(formData.agents?.subAgent?.agentFee) || 0)
                        ).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} md={4}>

          {/* Fees */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fees
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Total Package"
                    type="number"
                    value={formData.fees?.offeredFee || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fees: { ...prev.fees, offeredFee: parseFloat(e.target.value) || 0 },
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Admission Fee"
                    type="number"
                    value={formData.fees?.admissionFee || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fees: { ...prev.fees, admissionFee: parseFloat(e.target.value) || 0 },
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider>
                    <Typography variant="caption">Tuition Fees</Typography>
                  </Divider>
                </Grid>
                {[1, 2, 3, 4].map((y) => (
                  <Grid item xs={6} key={y}>
                    <TextField
                      size="small"
                      fullWidth
                      label={`Year ${y}`}
                      type="number"
                      value={formData.fees?.[`tuitionFeeYear${y}`] || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fees: {
                            ...prev.fees,
                            [`tuitionFeeYear${y}`]: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.fees?.hostelIncluded}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fees: { ...prev.fees, hostelIncluded: e.target.checked },
                          }))
                        }
                      />
                    }
                    label="Hostel Excluded"
                  />
                </Grid>
                {formData.fees?.hostelIncluded && (
                  <>
                    <Grid item xs={12}>
                      <Divider>
                        <Typography variant="caption">Hostel Fees</Typography>
                      </Divider>
                    </Grid>
                    {[1, 2, 3, 4].map((y) => (
                      <Grid item xs={6} key={y}>
                        <TextField
                          size="small"
                          fullWidth
                          label={`Year ${y}`}
                          type="number"
                          value={formData.fees?.[`hostelFeeYear${y}`] || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              fees: {
                                ...prev.fees,
                                [`hostelFeeYear${y}`]: parseFloat(e.target.value) || 0,
                              },
                            }))
                          }
                        />
                      </Grid>
                    ))}
                  </>
                )}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 1,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      Total Fee (Year 1)
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{totalFee.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Service Charge */}
          {!isStaff && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Service Charge
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  label="Service Charge Agreed"
                  type="number"
                  value={formData.serviceCharge?.agreed || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serviceCharge: {
                        ...prev.serviceCharge,
                        agreed: parseFloat(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* College Bonus — super admin only */}
          {isSuperAdmin && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  College Bonus
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Bonus Amount"
                      type="number"
                      value={formData.bonusAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bonusAmount: parseFloat(e.target.value) || 0 }))
                      }
                      inputProps={{ min: 0 }}
                      helperText="Offsets balance due to college"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Bonus Notes"
                      value={formData.bonusNotes}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bonusNotes: e.target.value }))
                      }
                      placeholder="e.g. College offset / paid separately"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                size="small"
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/admissions")}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              fullWidth
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdmissionFormPage;
