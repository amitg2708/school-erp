import { useState, useEffect } from 'react';
import { feesAPI, academicAPI, studentsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  CreditCard, Search, Plus, Filter, DollarSign,
  Calendar, CheckCircle, AlertCircle, Printer, X, User, ArrowRight
} from 'lucide-react';
import StudentFeesView from '../components/student/StudentFeesView';

function CreateStructureModal({ onClose, onSuccess, categories, classes, years }) {
  const [form, setForm] = useState({
    academicYearId: years.find(y => y.is_current)?.id || years[0]?.id || '',
    classId: classes[0]?.id || '',
    feeCategoryId: categories[0]?.id || '',
    amount: '',
    frequency: 'Annually',
    dueDate: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.classId || !form.feeCategoryId) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      await feesAPI.createStructure(form);
      toast.success('Fee structure created!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Add Fee Structure</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <select className="form-control" value={form.academicYearId} onChange={e => setForm(f => ({ ...f, academicYearId: e.target.value }))} required>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Class *</label>
                <select className="form-control" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} required>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fee Category *</label>
                <select className="form-control" value={form.feeCategoryId} onChange={e => setForm(f => ({ ...f, feeCategoryId: e.target.value }))} required>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-control" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                  <option value="Annually">Annually</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="One-Time">One-Time</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecordPaymentModal({ student, studentFee, onClose, onSuccess }) {
  const remaining = studentFee.net_amount - studentFee.paid_amount;
  const [amount, setAmount] = useState(remaining);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(amount) <= 0 || Number(amount) > remaining) {
      toast.error(`Enter amount between ₹1 and ₹${remaining}`);
      return;
    }
    setSaving(true);
    try {
      const res = await feesAPI.recordPayment({
        studentFeeId: studentFee.id,
        studentId: student.id,
        amount: Number(amount),
        paymentMode,
        transactionReference: transactionRef || null,
        remarks: remarks || null
      });
      toast.success(`Payment recorded! Receipt: ${res.data.receiptNumber}`);
      onSuccess(res.data.receiptNumber, Number(amount), paymentMode);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Record Fee Payment</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'var(--primary-50)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <strong>{student.first_name} {student.last_name}</strong> &bull; {student.student_id}
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '4px' }}>
                Fee Category: <strong>{studentFee.category_name}</strong> | Pending: <strong style={{ color: 'var(--danger)' }}>₹{remaining.toLocaleString()}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                className="form-control"
                style={{ fontSize: '1.2rem', fontWeight: '700' }}
                value={amount}
                max={remaining}
                min="1"
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select className="form-control" value={paymentMode} onChange={e => setPaymentMode(e.target.value)} required>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Debit Card">Debit / Credit Card</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction / Cheque #</label>
                <input
                  className="form-control"
                  placeholder="e.g. UPI Ref / Cheque No."
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <input
                className="form-control"
                placeholder="Optional notes"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Processing...' : 'Confirm & Generate Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StaffFeesManagement() {
  const [activeTab, setActiveTab] = useState('collect'); // 'collect' | 'structures' | 'pending' | 'reports'

  // Reference data
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [structures, setStructures] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [collectionReport, setCollectionReport] = useState({ payments: [], total: 0 });

  // Student search for collect
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsFound, setStudentsFound] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeData, setStudentFeeData] = useState({ fees: [], payments: [], summary: {} });
  const [feeLoading, setFeeLoading] = useState(false);

  // Modals
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [paymentModalFee, setPaymentModalFee] = useState(null);
  const [latestReceipt, setLatestReceipt] = useState(null);

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    if (activeTab === 'structures') loadStructures();
    if (activeTab === 'pending') loadPendingFees();
    if (activeTab === 'reports') loadCollectionReport();
  }, [activeTab]);

  const loadBaseData = async () => {
    try {
      const [catRes, classRes, yrRes] = await Promise.all([
        feesAPI.getCategories(),
        academicAPI.getClasses(),
        academicAPI.getYears(),
      ]);
      setCategories(catRes.data.categories || []);
      setClasses(classRes.data.classes || []);
      setYears(yrRes.data.years || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStructures = async () => {
    try {
      const res = await feesAPI.getStructures();
      setStructures(res.data.structures || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPendingFees = async () => {
    try {
      const res = await feesAPI.getPendingReport();
      setPendingList(res.data.pending || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCollectionReport = async () => {
    try {
      const res = await feesAPI.getCollectionReport({});
      setCollectionReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStudentSearch = async (e) => {
    e.preventDefault();
    if (!studentSearch.trim()) return;
    try {
      const res = await studentsAPI.getAll({ search: studentSearch.trim() });
      setStudentsFound(res.data.students || []);
      if (res.data.students?.length === 1) {
        selectStudent(res.data.students[0]);
      }
    } catch (err) {
      toast.error('Search failed');
    }
  };

  const selectStudent = async (st) => {
    setSelectedStudent(st);
    setFeeLoading(true);
    try {
      const res = await feesAPI.getStudentFees(st.id);
      setStudentFeeData(res.data);
    } catch (err) {
      toast.error('Failed to load student fees');
    } finally {
      setFeeLoading(false);
    }
  };

  const handlePaymentSuccess = (receiptNumber, amount, mode) => {
    setLatestReceipt({
      receiptNumber,
      amount,
      mode,
      student: selectedStudent,
      date: new Date().toLocaleDateString()
    });
    if (selectedStudent) selectStudent(selectedStudent);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Fees & Payments</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Fee collection, structures, receipts, and outstanding dues tracking
          </p>
        </div>
        {activeTab === 'structures' && (
          <button
            onClick={() => setShowStructureModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Fee Structure
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', overflowX: 'auto' }}>
          {[
            { id: 'collect', label: 'Collect Payment', icon: CreditCard },
            { id: 'structures', label: 'Fee Structures', icon: DollarSign },
            { id: 'pending', label: 'Pending Dues & Defaulters', icon: AlertCircle },
            { id: 'reports', label: 'Collection Reports', icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  background: active ? 'var(--primary-50)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '3px solid var(--primary)' : '3px solid transparent',
                  color: active ? 'var(--primary)' : 'var(--gray-600)',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: COLLECT PAYMENT */}
      {activeTab === 'collect' && (
        <div>
          {/* Search Bar */}
          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <form onSubmit={handleStudentSearch} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="Search student by name, student ID, or roll number..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Find Student</button>
            </form>

            {/* Found list if multiple */}
            {studentsFound.length > 1 && (
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', alignSelf: 'center' }}>Matching:</span>
                {studentsFound.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className={`btn ${selectedStudent?.id === s.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                  >
                    {s.first_name} {s.last_name} ({s.student_id})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student Fee Ledger */}
          {feeLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : selectedStudent ? (
            <div>
              {/* Student Summary Card */}
              <div className="card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {selectedStudent.first_name[0]}{selectedStudent.last_name ? selectedStudent.last_name[0] : ''}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                      ID: {selectedStudent.student_id} &bull; Class: {selectedStudent.class_name || 'Enrolled'} &bull; Roll: {selectedStudent.roll_number || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>TOTAL FEES</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>₹{(studentFeeData.summary?.totalFees || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>PAID</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--success)' }}>₹{(studentFeeData.summary?.paidAmount || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: '600' }}>PENDING</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--danger)' }}>₹{(studentFeeData.summary?.pendingAmount || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Fee Heads Table */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>Applicable Fee Heads</h3>
                {studentFeeData.fees.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No fee heads assigned to this student.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Frequency</th>
                          <th>Total Amount</th>
                          <th>Paid Amount</th>
                          <th>Pending Due</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentFeeData.fees.map(f => {
                          const due = f.net_amount - f.paid_amount;
                          const isPaid = f.status === 'Paid';
                          return (
                            <tr key={f.id}>
                              <td><strong>{f.category_name}</strong></td>
                              <td>{f.frequency}</td>
                              <td>₹{f.net_amount.toLocaleString()}</td>
                              <td style={{ color: 'var(--success)' }}>₹{f.paid_amount.toLocaleString()}</td>
                              <td style={{ color: due > 0 ? 'var(--danger)' : 'inherit', fontWeight: '700' }}>
                                ₹{due.toLocaleString()}
                              </td>
                              <td>
                                <span className={`badge ${isPaid ? 'badge-success' : f.status === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                                  {f.status}
                                </span>
                              </td>
                              <td>
                                {!isPaid && (
                                  <button
                                    onClick={() => setPaymentModalFee(f)}
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                  >
                                    Pay Fee
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Transaction Receipts */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>Receipt History</h3>
                {studentFeeData.payments.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No payment history recorded.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Payment Mode</th>
                          <th>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentFeeData.payments.map(p => (
                          <tr key={p.id}>
                            <td><span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{p.receipt_number}</span></td>
                            <td>{p.payment_date}</td>
                            <td>{p.category_name}</td>
                            <td style={{ fontWeight: '700', color: 'var(--success)' }}>₹{p.amount.toLocaleString()}</td>
                            <td><span className="badge badge-info">{p.payment_mode}</span></td>
                            <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>{p.transaction_reference || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center" style={{ padding: '48px', color: 'var(--gray-400)' }}>
              <CreditCard size={48} style={{ margin: '0 auto 12px' }} />
              <h3>Search a Student</h3>
              <p>Enter a student name or ID above to collect fees and print receipts.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FEE STRUCTURES */}
      {activeTab === 'structures' && (
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Class-wise Fee Structures</h3>
            {structures.length === 0 ? (
              <p style={{ color: 'var(--gray-400)' }}>No fee structures configured. Add one using the button above.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Fee Category</th>
                      <th>Academic Year</th>
                      <th>Frequency</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structures.map(st => (
                      <tr key={st.id}>
                        <td><strong>{st.class_name}</strong></td>
                        <td>{st.category_name}</td>
                        <td>{st.academic_year}</td>
                        <td><span className="badge badge-info">{st.frequency}</span></td>
                        <td style={{ fontWeight: '700', color: 'var(--primary)' }}>₹{st.amount.toLocaleString()}</td>
                        <td style={{ color: 'var(--gray-500)' }}>{st.due_date || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PENDING DEFAULTERS */}
      {activeTab === 'pending' && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Outstanding Fees / Defaulters</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>Students with pending or overdue fee balances</p>
              </div>
            </div>

            {pendingList.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--success)' }}>
                <CheckCircle size={36} style={{ margin: '0 auto 8px' }} />
                <p>Great! No pending fees recorded.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Class</th>
                      <th>Category</th>
                      <th>Net Fee</th>
                      <th>Paid</th>
                      <th>Pending Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((p, i) => (
                      <tr key={i}>
                        <td><strong>{p.student_name}</strong></td>
                        <td>{p.std_id}</td>
                        <td>{p.class_name} - {p.section_name}</td>
                        <td>{p.fee_category}</td>
                        <td>₹{p.net_amount.toLocaleString()}</td>
                        <td style={{ color: 'var(--success)' }}>₹{p.paid_amount.toLocaleString()}</td>
                        <td style={{ fontWeight: '800', color: 'var(--danger)' }}>₹{p.pending_amount.toLocaleString()}</td>
                        <td><span className="badge badge-danger">{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'reports' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: '600' }}>TOTAL AMOUNT COLLECTED</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--success)' }}>
                  ₹{(collectionReport.total || 0).toLocaleString()}
                </div>
              </div>
              <button onClick={() => window.print()} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print Collection Report
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>Collection Log</h3>
            {collectionReport.payments?.length === 0 ? (
              <p style={{ color: 'var(--gray-400)' }}>No payment transactions recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Category</th>
                      <th>Mode</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionReport.payments?.map((pay, i) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>{pay.receipt_number}</span></td>
                        <td>{pay.payment_date}</td>
                        <td><strong>{pay.student_name}</strong> ({pay.std_id})</td>
                        <td>{pay.class_name}</td>
                        <td>{pay.category}</td>
                        <td><span className="badge badge-info">{pay.payment_mode}</span></td>
                        <td style={{ fontWeight: '700', color: 'var(--success)' }}>₹{pay.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Structure Modal */}
      {showStructureModal && (
        <CreateStructureModal
          categories={categories}
          classes={classes}
          years={years}
          onClose={() => setShowStructureModal(false)}
          onSuccess={() => loadStructures()}
        />
      )}

      {/* Record Payment Modal */}
      {paymentModalFee && selectedStudent && (
        <RecordPaymentModal
          student={selectedStudent}
          studentFee={paymentModalFee}
          onClose={() => setPaymentModalFee(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Printable Receipt Modal */}
      {latestReceipt && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '450px', background: '#ffffff', border: '2px solid var(--primary)' }}>
            <div className="modal-header">
              <h3 className="modal-title">Official Fee Receipt</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setLatestReceipt(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ color: 'var(--success)', marginBottom: '8px' }}>
                <CheckCircle size={48} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-dark)' }}>PAYMENT SUCCESSFUL</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>
                Receipt No: <strong style={{ color: 'var(--gray-800)' }}>{latestReceipt.receiptNumber}</strong>
              </div>

              <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px', margin: '20px 0', textAlign: 'left', fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--gray-500)' }}>Student:</span> <strong>{latestReceipt.student?.first_name} {latestReceipt.student?.last_name}</strong></div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--gray-500)' }}>Student ID:</span> <strong>{latestReceipt.student?.student_id}</strong></div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--gray-500)' }}>Date:</span> <strong>{latestReceipt.date}</strong></div>
                <div style={{ marginBottom: '8px' }}><span style={{ color: 'var(--gray-500)' }}>Payment Mode:</span> <strong>{latestReceipt.mode}</strong></div>
                <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '8px', marginTop: '8px' }}>
                  <span style={{ color: 'var(--gray-500)' }}>Amount Paid:</span> <strong style={{ fontSize: '1.1rem', color: 'var(--success)', float: 'right' }}>₹{latestReceipt.amount?.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Printer size={16} /> Print Receipt
                </button>
                <button onClick={() => setLatestReceipt(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Fees() {
  const { user } = useAuth();
  if (user?.role === 'student' || user?.role === 'parent') {
    return <StudentFeesView />;
  }
  return <StaffFeesManagement />;
}
