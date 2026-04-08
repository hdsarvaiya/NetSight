import React from 'react';

// Explicitly defining the type to share with the main page
export interface AuditLog {
  _id: string;
  userName: string;
  action: string;
  target: string;
  result: string;
  ip: string;
  createdAt: string;
}

interface AuditPdfReportProps {
  logs: AuditLog[];
  reportDate: string;
}

// A hidden, beautifully styled component specifically designed for PDF generation
export const AuditPdfReport: React.FC<AuditPdfReportProps> = ({ logs, reportDate }) => {
  return (
    <div id="audit-pdf-report" style={{ 
      display: 'none', // Hidden from active UI
      backgroundColor: '#0a0a0a', 
      color: '#ffffff', 
      width: '900px', // Fixed width for consistent PDF landscape/high fidelity rendering
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ paddingBottom: '24px', borderBottom: '2px solid #d4af37', marginBottom: '32px' }}>
        <h1 style={{ color: '#d4af37', margin: 0, fontSize: '32px', fontWeight: 'bold' }}>NetSight</h1>
        <h2 style={{ color: '#ffffff', marginTop: '8px', marginBottom: '4px', fontSize: '24px' }}>Security & Audit Report</h2>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '14px' }}>Generated on: {reportDate}</p>
      </div>

      {/* Explainer for non-technical users */}
      <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '20px', border: '1px solid #2a2a2a', marginBottom: '32px' }}>
        <h3 style={{ color: '#d4af37', marginTop: 0, fontSize: '18px', marginBottom: '12px' }}>Report Overview</h3>
        <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          This document serves as a chronological record of all significant interactions within the NetSight platform. 
          It tracks authentication events (logging in and out), system scans, profile modifications, and other critical activities. 
          <strong>"Success"</strong> implies the action was completed normally. <strong>"Failed"</strong> implies the action was blocked or could not be completed, often due to security measures.
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px', border: '1px solid #2a2a2a', textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Assessed Events</div>
          <div style={{ fontSize: '28px', color: '#ffffff', fontWeight: 'bold' }}>{logs.length}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px', border: '1px solid #2a2a2a', textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Unique Active Users</div>
          <div style={{ fontSize: '28px', color: '#ffffff', fontWeight: 'bold' }}>{new Set(logs.map(l => l.userName)).size}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '16px', border: '1px solid #2a2a2a', textAlign: 'center' }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Blocked / Failed Actions</div>
          <div style={{ fontSize: '28px', color: '#ef4444', fontWeight: 'bold' }}>{logs.filter(l => l.result !== 'Success').length}</div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #2a2a2a' }}>
            <th style={{ padding: '12px 16px', color: '#d4af37', fontWeight: '600' }}>Date & Time</th>
            <th style={{ padding: '12px 16px', color: '#d4af37', fontWeight: '600' }}>User / Profile</th>
            <th style={{ padding: '12px 16px', color: '#d4af37', fontWeight: '600' }}>Activity Description</th>
            <th style={{ padding: '12px 16px', color: '#d4af37', fontWeight: '600' }}>Target Affected</th>
            <th style={{ padding: '12px 16px', color: '#d4af37', fontWeight: '600' }}>Network IP</th>
            <th style={{ padding: '12px 16px', color: '#d4af37', fontWeight: '600' }}>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={log._id || idx} style={{ borderBottom: '1px solid #2a2a2a' }}>
              <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{new Date(log.createdAt).toLocaleString()}</td>
              <td style={{ padding: '12px 16px', color: '#ffffff', fontWeight: '500' }}>{log.userName}</td>
              <td style={{ padding: '12px 16px', color: '#d1d5db' }}>{log.action}</td>
              <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{log.target}</td>
              <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '11px' }}>{log.ip}</td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ 
                  backgroundColor: log.result === 'Success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: log.result === 'Success' ? '#4ade80' : '#f87171',
                  border: `1px solid ${log.result === 'Success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  padding: '4px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {log.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #2a2a2a', textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>
        End of Report. Confidential and Proprietary information of NetSight Systems.
      </div>
    </div>
  );
};
