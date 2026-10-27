import { useState } from 'react';
import { Award, Printer, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export const REPORT_THEMES = {
  sapphire: {
    id: 'sapphire',
    name: 'Royal Sapphire',
    tag: 'CBSE Executive',
    icon: '📘',
    accentColor: '#1d4ed8',
    containerStyle: {
      background: '#ffffff',
      border: '2px solid #3b82f6',
      borderRadius: '16px',
      boxShadow: '0 12px 30px -8px rgba(37, 99, 235, 0.15)'
    },
    headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    headerTitleColor: '#ffffff',
    headerSubColor: '#bfdbfe',
    badgeBg: 'rgba(255, 255, 255, 0.18)',
    badgeColor: '#ffffff',
    metaBg: '#f0f9ff',
    metaBorder: '1px solid #bae6fd',
    tableHeadBg: '#eff6ff',
    tableHeadColor: '#1e3a8a',
    totalRowBg: '#dbeafe',
    totalRowColor: '#1e40af',
    summaryCardsBg: '#f8fafc',
    sealBorder: '#d97706',
    sealText: '#d97706'
  },
  emerald: {
    id: 'emerald',
    name: 'Classic Heritage',
    tag: 'Ivy League Oxford',
    icon: '🌲',
    accentColor: '#059669',
    containerStyle: {
      background: '#fffdfa',
      border: '4px double #047857',
      borderRadius: '12px',
      boxShadow: '0 12px 30px -8px rgba(6, 95, 70, 0.15)'
    },
    headerBg: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
    headerTitleColor: '#fef3c7',
    headerSubColor: '#d1fae5',
    badgeBg: 'rgba(254, 243, 199, 0.2)',
    badgeColor: '#fef3c7',
    metaBg: '#fefce8',
    metaBorder: '1px solid #fef08a',
    tableHeadBg: '#ecfdf5',
    tableHeadColor: '#064e3b',
    totalRowBg: '#d1fae5',
    totalRowColor: '#064e3b',
    summaryCardsBg: '#fcfbf7',
    sealBorder: '#b45309',
    sealText: '#b45309'
  },
  modernDark: {
    id: 'modernDark',
    name: 'Modernist Slate',
    tag: 'Cyber Contrast',
    icon: '🌌',
    accentColor: '#818cf8',
    containerStyle: {
      background: '#0f172a',
      color: '#f8fafc',
      border: '1.5px solid #334155',
      borderRadius: '16px',
      boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.6)'
    },
    headerBg: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
    headerTitleColor: '#ffffff',
    headerSubColor: '#c7d2fe',
    badgeBg: 'rgba(255, 255, 255, 0.15)',
    badgeColor: '#e0e7ff',
    metaBg: '#1e293b',
    metaBorder: '1px solid #334155',
    tableHeadBg: '#1e293b',
    tableHeadColor: '#cbd5e1',
    totalRowBg: '#312e81',
    totalRowColor: '#ffffff',
    summaryCardsBg: '#1e293b',
    sealBorder: '#38bdf8',
    sealText: '#38bdf8'
  },
  monochrome: {
    id: 'monochrome',
    name: 'Board Monochrome',
    tag: 'Official Print',
    icon: '📄',
    accentColor: '#111827',
    containerStyle: {
      background: '#ffffff',
      color: '#111827',
      border: '2px solid #111827',
      borderRadius: '4px',
      boxShadow: 'none'
    },
    headerBg: '#f9fafb',
    headerTitleColor: '#111827',
    headerSubColor: '#4b5563',
    badgeBg: '#e5e7eb',
    badgeColor: '#111827',
    metaBg: '#f9fafb',
    metaBorder: '1px solid #e5e7eb',
    tableHeadBg: '#f3f4f6',
    tableHeadColor: '#111827',
    totalRowBg: '#e5e7eb',
    totalRowColor: '#111827',
    summaryCardsBg: '#ffffff',
    sealBorder: '#111827',
    sealText: '#111827'
  }
};

export default function ReportCardDocument({
  reportData,
  onClose,
  showCloseButton = false,
  defaultTheme = 'sapphire'
}) {
  const [selectedThemeKey, setSelectedThemeKey] = useState(defaultTheme);

  if (!reportData) return null;

  const {
    exam,
    student,
    marks = [],
    totalMax = 0,
    totalObtained = 0,
    percentage = 0,
    grade = 'A',
    result = 'PASS',
    attendanceSummary
  } = reportData;

  const currentTheme = REPORT_THEMES[selectedThemeKey] || REPORT_THEMES.sapphire;
  const isDark = selectedThemeKey === 'modernDark';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Theme Selector Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--gray-50)',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--gray-200)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-700)' }}>
            Select Report Card Theme:
          </span>
        </div>

        {/* Theme Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Object.entries(REPORT_THEMES).map(([key, t]) => {
            const active = selectedThemeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedThemeKey(key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: active ? `2px solid ${t.accentColor}` : '1px solid var(--gray-300)',
                  background: active ? (key === 'modernDark' ? '#1e293b' : '#ffffff') : 'transparent',
                  color: active ? t.accentColor : 'var(--gray-600)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{t.icon}</span>
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Report
          </button>
          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* The Printable Report Card Container */}
      <div
        id="printable-report-card"
        style={{
          ...currentTheme.containerStyle,
          overflow: 'hidden',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Header Ribbon */}
        <div style={{
          background: currentTheme.headerBg,
          color: currentTheme.headerTitleColor,
          padding: '24px 20px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                background: 'none',
                border: 'none',
                color: currentTheme.headerTitleColor,
                cursor: 'pointer',
                opacity: 0.8
              }}
              title="Close"
            >
              <X size={20} />
            </button>
          )}

          <div style={{
            fontSize: '1.35rem',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            margin: '0 0 4px 0',
            lineHeight: 1.2
          }}>
            Delhi Public Model Senior Secondary School
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: currentTheme.headerSubColor,
            marginBottom: '10px'
          }}>
            Affiliated to Central Board of Secondary Education (CBSE) · School Affiliation Code: 54102
          </div>

          <div style={{
            display: 'inline-block',
            padding: '4px 16px',
            background: currentTheme.badgeBg,
            color: currentTheme.badgeColor,
            borderRadius: '99px',
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '0.03em'
          }}>
            {exam?.name || 'Comprehensive Academic Evaluation'} · {exam?.academic_year || 'Academic Session 2025–2026'}
          </div>
        </div>

        {/* Card Body with anti-overlapping responsive layout */}
        <div style={{ padding: '24px' }}>
          {/* Student Info Grid (Fully Responsive, minmax prevents overlap) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: currentTheme.metaBg,
            border: currentTheme.metaBorder,
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: isDark ? '#94a3b8' : 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Student Name
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isDark ? '#ffffff' : 'var(--gray-900)' }}>
                {student?.first_name} {student?.last_name || ''}
              </div>
            </div>

            <div>
              <span style={{ color: isDark ? '#94a3b8' : 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Roll Number
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isDark ? '#ffffff' : 'var(--gray-900)' }}>
                #{student?.roll_number || '1'}
              </div>
            </div>

            <div>
              <span style={{ color: isDark ? '#94a3b8' : 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Class & Section
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isDark ? '#ffffff' : 'var(--gray-900)' }}>
                {student?.class_name || exam?.class_name || 'Class 10'} · Sec {student?.section_name || 'A'}
              </div>
            </div>

            <div>
              <span style={{ color: isDark ? '#94a3b8' : 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Permanent Student ID
              </span>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isDark ? '#ffffff' : 'var(--gray-900)' }}>
                {student?.student_id || 'STU0001'}
              </div>
            </div>
          </div>

          {/* Subject Scores Table wrapped in responsive container */}
          <div className="table-responsive" style={{
            marginBottom: '20px',
            border: isDark ? '1px solid #334155' : '1px solid var(--gray-200)',
            borderRadius: '10px'
          }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: currentTheme.tableHeadBg, color: currentTheme.tableHeadColor }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700 }}>Subject Code & Name</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Max Marks</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Passing Marks</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Marks Scored</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Grade</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m, idx) => {
                  const pass = (m.obtained_marks || 0) >= (m.passing_marks || 33);
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: isDark ? '1px solid #1e293b' : '1px solid var(--gray-100)',
                        background: isDark ? (idx % 2 === 0 ? '#0f172a' : '#1e293b') : (idx % 2 === 0 ? '#ffffff' : '#fafafa')
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: isDark ? '#f8fafc' : 'var(--gray-900)' }}>
                        {m.subject_name}
                        <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '6px' }}>
                          ({m.code || m.subject_code || 'SUB'})
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: isDark ? '#cbd5e1' : 'var(--gray-600)' }}>
                        {m.max_marks}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: isDark ? '#cbd5e1' : 'var(--gray-600)' }}>
                        {m.passing_marks}
                      </td>
                      <td style={{
                        padding: '12px 14px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: m.is_absent ? 'var(--danger)' : isDark ? '#ffffff' : 'var(--gray-900)'
                      }}>
                        {m.is_absent ? 'ABSENT' : m.obtained_marks}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          background: pass ? 'var(--success-light)' : 'var(--danger-light)',
                          color: pass ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {m.is_absent ? 'F' : (m.grade || 'A')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {m.is_absent ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.8rem' }}>Absent</span>
                        ) : pass ? (
                          <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>PASSED</span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.8rem' }}>NEEDS IMP.</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{
                  background: currentTheme.totalRowBg,
                  color: currentTheme.totalRowColor,
                  fontWeight: 900
                }}>
                  <td style={{ padding: '12px 16px', letterSpacing: '0.04em' }}>AGGREGATE TOTAL</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{totalMax}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>—</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontSize: '1.05rem' }}>{totalObtained}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>{grade}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      background: result === 'PASS' ? 'var(--success)' : 'var(--danger)',
                      color: '#ffffff'
                    }}>
                      {result}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* KPI Performance Summary (Wrap-safe cards without text collision) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: currentTheme.summaryCardsBg,
              border: isDark ? '1px solid #334155' : '1px solid var(--gray-200)',
              padding: '14px 12px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Percentage
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: currentTheme.accentColor, marginTop: '2px' }}>
                {percentage}%
              </div>
            </div>

            <div style={{
              background: currentTheme.summaryCardsBg,
              border: isDark ? '1px solid #334155' : '1px solid var(--gray-200)',
              padding: '14px 12px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Overall Grade
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success)', marginTop: '2px' }}>
                {grade}
              </div>
            </div>

            <div style={{
              background: currentTheme.summaryCardsBg,
              border: isDark ? '1px solid #334155' : '1px solid var(--gray-200)',
              padding: '14px 12px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Academic Result
              </div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                color: result === 'PASS' ? 'var(--success)' : 'var(--danger)',
                marginTop: '2px'
              }}>
                {result}
              </div>
            </div>

            <div style={{
              background: currentTheme.summaryCardsBg,
              border: isDark ? '1px solid #334155' : '1px solid var(--gray-200)',
              padding: '14px 12px',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Term Attendance
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#ffffff' : 'var(--gray-800)', marginTop: '2px' }}>
                {attendanceSummary?.total ? `${attendanceSummary.present}/${attendanceSummary.total}` : '100%'}
              </div>
            </div>
          </div>

          {/* Remarks & Signatures Footer with generous spacing to prevent overlap */}
          <div style={{
            borderTop: isDark ? '1px solid #334155' : '1px solid var(--gray-200)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
              <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : 'var(--gray-500)', textTransform: 'uppercase', fontWeight: 700 }}>
                Class Teacher Remarks & Evaluation:
              </div>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: isDark ? '#f8fafc' : 'var(--gray-800)',
                marginTop: '4px',
                lineHeight: 1.4
              }}>
                {percentage >= 85
                  ? 'Outstanding intellectual capability, discipline, and exemplary academic performance.'
                  : percentage >= 60
                  ? 'Good performance with steady academic diligence. Continued consistency encouraged.'
                  : 'Needs targeted academic revision and regular practice sessions.'}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '32px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              minWidth: '260px'
            }}>
              <div style={{ textAlign: 'center', minWidth: '110px' }}>
                <div style={{ borderBottom: isDark ? '1px solid #94a3b8' : '1px solid #1e293b', width: '100px', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#ffffff' : 'var(--gray-900)' }}>
                  Class Teacher
                </div>
                <div style={{ fontSize: '0.65rem', color: isDark ? '#94a3b8' : 'var(--gray-500)' }}>
                  Signature
                </div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ borderBottom: isDark ? '1px solid #94a3b8' : '1px solid #1e293b', width: '110px', margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#ffffff' : 'var(--gray-900)' }}>
                  Principal & Director
                </div>
                <div style={{ fontSize: '0.65rem', color: currentTheme.sealText, fontWeight: 700 }}>
                  Institutional Seal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
