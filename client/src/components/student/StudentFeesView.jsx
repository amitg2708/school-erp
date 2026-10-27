import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  CreditCard, DollarSign, CheckCircle, AlertCircle,
  Printer, X, User, ArrowRight, ShieldCheck, Download
} from 'lucide-react';

function PrintableReceiptModal({ receipt, student, onClose }) {
  if (!receipt) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '580px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--gray-900)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: '#86efac' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Official Fee Payment Receipt</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px' }} id="printable-fee-receipt">
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--gray-800)', paddingBottom: '14px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', margin: '0 0 2px' }}>
              Delhi Public Model Senior Secondary School
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              Main Campus, Institutional Area, Sector 4 · Fee Division
            </div>
            <div style={{ display: 'inline-block', padding: '3px 12px', background: 'var(--gray-100)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginTop: '6px' }}>
              Receipt No: {receipt.receipt_number}
            </div>
          </div>

          {/* Student Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--gray-50)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.8rem' }}>
            <div><span style={{ color: 'var(--gray-500)' }}>Student Name:</span> <strong>{student?.first_name} {student?.last_name}</strong></div>
            <div><span style={{ color: 'var(--gray-500)' }}>Permanent ID:</span> <strong>{student?.student_id || 'STU0001'}</strong></div>
            <div><span style={{ color: 'var(--gray-500)' }}>Class & Section:</span> <strong>{student?.class_name} - {student?.section_name}</strong></div>
            <div><span style={{ color: 'var(--gray-500)' }}>Payment Date:</span> <strong>{receipt.payment_date}</strong></div>
          </div>

          {/* Payment Detail */}
          <table className="table" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
            <thead>
              <tr style={{ background: 'var(--gray-100)' }}>
                <th>Fee Head / Description</th>
                <th>Payment Mode</th>
                <th style={{ textAlign: 'right' }}>Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>{receipt.category_name || 'Academic Tuition & Facility Fee'}</td>
                <td>
                  <span className="badge badge-primary">{receipt.payment_mode || 'Online UPI'}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: 'var(--success)' }}>
                  ₹{Number(receipt.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {receipt.transaction_reference && (
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '16px' }}>
              Transaction Ref / UPI UTR: <span style={{ fontFamily: 'monospace' }}>{receipt.transaction_reference}</span>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={16} /> Verified School Accounts Digital Stamp
            </div>
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ borderBottom: '1px solid var(--gray-400)', width: '100px', margin: '0 auto 4px' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Accounts Officer</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', background: 'var(--gray-100)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={15} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function OnlinePaymentModal({ pendingFees, student, onClose, onSuccess }) {
  const [selectedFeeId, setSelectedFeeId] = useState(pendingFees[0]?.id || '');
  const selectedFee = pendingFees.find(f => f.id === Number(selectedFeeId)) || pendingFees[0];
  const pendingAmount = selectedFee ? (selectedFee.net_amount - selectedFee.paid_amount) : 0;

  const [amount, setAmount] = useState(String(pendingAmount));
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [upiId, setUpiId] = useState('parent@okaxis');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (selectedFee) {
      setAmount(String(selectedFee.net_amount - selectedFee.paid_amount));
    }
  }, [selectedFeeId]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post('/fees/payment', {
        studentFeeId: selectedFee.id,
        studentId: student.id,
        amount: parseFloat(amount),
        paymentMode,
        transactionReference: `TXN_${Date.now().toString().slice(-8)}`,
        remarks: 'Online portal payment'
      });
      toast.success(`Payment of ₹${amount} completed! Receipt: ${res.data.receiptNumber}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Pay School Fees Online</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handlePay}>
          <div className="modal-body">
            <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Paying for Student:</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{student?.first_name} {student?.last_name} ({student?.class_name})</div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Fee Category *</label>
              <select
                className="form-control"
                value={selectedFeeId}
                onChange={e => setSelectedFeeId(e.target.value)}
                required
              >
                {pendingFees.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.category_name} (Due: ₹{f.net_amount - f.paid_amount})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                max={pendingAmount}
                className="form-control"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                Maximum payable balance: ₹{pendingAmount.toFixed(2)}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {['UPI', 'Card', 'Net Banking'].map(mode => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`btn btn-sm ${paymentMode === mode ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '8px 4px' }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {paymentMode === 'UPI' && (
              <div className="form-group">
                <label className="form-label">Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. mobile@upi or name@okaxis"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={processing} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} />
              {processing ? 'Processing...' : `Pay ₹${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentFeesView() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    if (user?.role === 'parent') {
      api.get('/portal/children').then(res => {
        const list = res.data.children || [];
        setChildren(list);
        if (list.length > 0) setSelectedStudentId(String(list[0].id));
      }).catch(() => {});
    } else {
      loadFees();
    }
  }, [user]);

  useEffect(() => {
    if (selectedStudentId || user?.role === 'student') {
      loadFees(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadFees = async (studId) => {
    setLoading(true);
    try {
      const url = studId ? `/fees/my-fees?student_id=${studId}` : '/fees/my-fees';
      const res = await api.get(url);
      setFeeData(res.data);
    } catch (err) {
      toast.error('Failed to load fee statement');
    } finally {
      setLoading(false);
    }
  };

  const student = feeData?.student;
  const summary = feeData?.summary || { total: 0, paid: 0, pending: 0 };
  const feesList = feeData?.fees || [];
  const payments = feeData?.payments || [];

  const pendingItems = feesList.filter(f => f.net_amount > f.paid_amount);

  if (loading && !feeData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '12px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '12px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Parent Child Switcher */}
      {user?.role === 'parent' && children.length > 1 && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Viewing Fees For:</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedStudentId(String(child.id))}
                className={`btn btn-sm ${selectedStudentId === String(child.id) ? 'btn-primary' : 'btn-outline'}`}
              >
                {child.first_name} ({child.class_name || 'Class'})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
              <CreditCard size={13} /> Student Fee Account
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {student ? `${student.first_name} ${student.last_name || ''} - Fee Statement` : 'School Fee Account'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              {student?.class_name ? `${student.class_name} · Section ${student.section_name || 'A'}` : 'Enrolled Student'}
              {student?.student_id && ` · Student ID: ${student.student_id}`}
            </p>
          </div>

          {summary.pending > 0 && (
            <button
              onClick={() => setShowPayModal(true)}
              className="btn btn-success"
              style={{ padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <CreditCard size={16} /> Pay Online (₹{summary.pending.toLocaleString('en-IN')})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Total Fee Assessed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gray-900)', marginTop: '4px' }}>
            ₹{summary.total.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', textAlign: 'center', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Total Amount Paid</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>
            ₹{summary.paid.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '16px', textAlign: 'center', borderLeft: summary.pending > 0 ? '4px solid var(--danger)' : '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.8rem', color: summary.pending > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>Outstanding Balance</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: summary.pending > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px' }}>
            ₹{summary.pending.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Fee Structure Breakdown Table */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Annual Fee Structure & Installment Dues</h2>
        {feesList.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>No fee structure records assigned yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Fee Head / Category</th>
                  <th>Frequency</th>
                  <th>Total Fee</th>
                  <th>Amount Paid</th>
                  <th>Remaining Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feesList.map(item => {
                  const remaining = item.net_amount - item.paid_amount;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.category_name}</td>
                      <td style={{ color: 'var(--gray-500)' }}>{item.frequency || 'Annual'}</td>
                      <td>₹{item.net_amount.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{item.paid_amount.toLocaleString('en-IN')}</td>
                      <td style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 700 }}>
                        ₹{remaining.toLocaleString('en-IN')}
                      </td>
                      <td>
                        {item.status === 'Paid' ? (
                          <span className="badge badge-success">Fully Paid</span>
                        ) : item.status === 'Partial' ? (
                          <span className="badge badge-primary">Partially Paid</span>
                        ) : (
                          <span className="badge badge-danger">Payment Due</span>
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

      {/* Payment History & Receipts Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>Payment Receipts & Transaction Ledger</h2>
        {payments.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <CreditCard size={40} style={{ color: 'var(--gray-400)' }} />
            <h3>No payment transactions recorded yet</h3>
            <p>Receipts will be generated here once school payments are processed</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Payment Date</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                      {p.receipt_number}
                    </td>
                    <td>{p.payment_date}</td>
                    <td>{p.category_name || 'Tuition Fee'}</td>
                    <td>
                      <span className="badge badge-primary">{p.payment_mode}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={13} /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Online Payment Modal */}
      {showPayModal && pendingItems.length > 0 && (
        <OnlinePaymentModal
          pendingFees={pendingItems}
          student={student}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => loadFees(selectedStudentId)}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <PrintableReceiptModal
          receipt={selectedReceipt}
          student={student}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
