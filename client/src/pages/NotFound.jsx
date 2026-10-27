import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', textAlign: 'center', padding: '20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'var(--primary-50)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        <AlertCircle size={40} />
      </div>

      <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1, margin: '0 0 10px 0' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '10px' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
        The page you are looking for doesn't exist or has been moved to another section.
      </p>

      <Link
        to="/"
        className="btn btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
      >
        <Home size={18} /> Return to Dashboard
      </Link>
    </div>
  );
}
