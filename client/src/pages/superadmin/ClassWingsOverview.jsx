import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { School, Layers, Users, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClassWingsOverview() {
  const [wingsData, setWingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWings();
  }, []);

  const fetchWings = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getWingsOverview();
      setWingsData(res.data.wings || []);
    } catch (err) {
      toast.error('Failed to load wings overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--gray-500)' }}>Loading class wings & admin mappings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: 'var(--gray-900)' }}>
            Class Wings & Institutional Governance
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--gray-500)' }}>
            Classes 1 to 12 architectural division across different administrators within this shared application
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/superadmin/admins')}
        >
          Manage Administrators
        </button>
      </div>

      {/* Wings Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {wingsData.map(wing => {
          const totalWingStudents = wing.classes.reduce((sum, c) => sum + (c.student_count || 0), 0);
          const totalWingSections = wing.classes.reduce((sum, c) => sum + (c.section_count || 0), 0);

          return (
            <div key={wing.id} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-50)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
                    <Layers size={14} /> {wing.classRange}
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--gray-900)' }}>
                    {wing.name}
                  </h2>
                </div>

                {wing.assignedAdmin && (
                  <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--gray-200)', minWidth: '260px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Overseeing School Administrator
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.95rem' }}>
                      {wing.assignedAdmin.first_name} {wing.assignedAdmin.last_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {wing.assignedAdmin.designation || 'School Administrator'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                      @{wing.assignedAdmin.username} · {wing.assignedAdmin.campus_name || 'Main Campus'}
                    </div>
                  </div>
                )}
              </div>

              {/* Wing Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Classes Range</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-800)' }}>
                    Class {wing.minClass} – Class {wing.maxClass} ({wing.classes.length} Grades)
                  </div>
                </div>

                <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Total Sections</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-800)' }}>
                    {totalWingSections} Active Sections
                  </div>
                </div>

                <div style={{ background: 'var(--gray-50)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Total Enrolled Students</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {totalWingStudents} Students
                  </div>
                </div>
              </div>

              {/* Class Cards in this Wing */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Covered Classes in this Wing:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {wing.classes.map(c => (
                    <div key={c.id} style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '10px 12px', background: '#ffffff' }}>
                      <div style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: '0.95rem' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                        {c.section_count} Sections · {c.student_count} Students
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
