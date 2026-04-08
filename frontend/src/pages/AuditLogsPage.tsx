//import API_BASE from "../config/api";
const API_BASE = "http://localhost:5000/api/v1";
import { useState, useEffect } from "react";
import { Search, Download, Calendar, Filter, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface AuditLog {
  _id: string;
  userName: string;
  action: string;
  target: string;
  result: string;
  ip: string;
  createdAt: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const limit = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const userSession = localStorage.getItem('user');
      const token = userSession ? JSON.parse(userSession).token : null;

      const response = await axios.get(API_BASE + "/audit", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          searchQuery: searchQuery || undefined,
          userFilter: userFilter || undefined,
          resultFilter: resultFilter || undefined,
          page: currentPage,
          limit: limit
        }
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages);
        setTotalLogs(response.data.totalLogs);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const userSession = localStorage.getItem('user');
      const token = userSession ? JSON.parse(userSession).token : null;

      const params = new URLSearchParams();
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (userFilter !== 'all') params.append('userFilter', userFilter);
      if (resultFilter !== 'all') params.append('resultFilter', resultFilter);

      const response = await fetch(`${API_BASE}/audit/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to export logs");
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  const handlePdfExport = async () => {
    try {
      const userSession = localStorage.getItem('user');
      const token = userSession ? JSON.parse(userSession).token : null;

      const params = new URLSearchParams();
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (userFilter !== 'all') params.append('userFilter', userFilter);
      if (resultFilter !== 'all') params.append('resultFilter', resultFilter);
      params.append('format', 'json');

      const response = await fetch(`${API_BASE}/audit/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const logs = data.logs;

        const doc = new jsPDF('landscape');
        const goldColor = [212, 175, 55] as [number, number, number];

        // 1. Add NetSight Header
        doc.setTextColor(...goldColor);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("NetSight", 14, 22);

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(16);
        doc.text("Security & Audit Report", 14, 32);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

        // 2. Stats Summary
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text(`Total Events: ${logs.length}`, 14, 55);
        const uniqueUsers = new Set(logs.map((l: any) => l.userName)).size;
        doc.text(`Active Users: ${uniqueUsers}`, 80, 55);
        
        const failedCount = logs.filter((l: any) => l.result !== 'Success').length;
        if (failedCount > 0) {
            doc.setTextColor(220, 38, 38); // Red
        } else {
            doc.setTextColor(40, 40, 40);
        }
        doc.text(`Failed Actions: ${failedCount}`, 150, 55);

        // 3. AutoTable
        const tableColumn = ["Date & Time", "User / Profile", "Action", "Target", "IP Address", "Outcome"];
        const tableRows: any[] = [];

        logs.forEach((log: any) => {
          tableRows.push([
            new Date(log.createdAt).toLocaleString(),
            log.userName,
            log.action,
            log.target,
            log.ip,
            log.result
          ]);
        });

        // Use the imported autoTable plugin
        autoTable(doc, {
          startY: 65,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          styles: {
            textColor: [60, 60, 60],
            lineColor: [230, 230, 230],
            lineWidth: 0.1,
            cellPadding: 4,
            fontSize: 10
          },
          headStyles: {
            fillColor: [250, 250, 250],
            textColor: goldColor,
            fontStyle: 'bold',
            lineColor: [230, 230, 230],
            lineWidth: 0.1
          },
          alternateRowStyles: {
            fillColor: [252, 252, 252]
          },
          didParseCell: function(cellData: any) {
            if (cellData.section === 'body' && cellData.column.index === 5) {
              if (cellData.cell.raw === 'Success') {
                 cellData.cell.styles.textColor = [22, 163, 74];
              } else {
                 cellData.cell.styles.textColor = [220, 38, 38];
              }
            }
          }
        });

        doc.save(`audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);

      } else {
        console.error("Failed to fetch logs for PDF");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, searchQuery, userFilter, resultFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, userFilter, resultFilter]);

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userName)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white mb-1">Audit Logs</h1>
        <p className="text-gray-400">Track all system actions and user activities in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total Events" value={totalLogs} />
        <StatCard label="Recent Events" value={logs.filter(l => new Date(l.createdAt).getTime() > Date.now() - 24 * 3600000).length} />
        <StatCard label="Failed Actions" value={logs.filter(l => l.result === "Failed").length} />
        <StatCard label="Active Users" value={uniqueUsers.length} />
      </div>

      {/* Toolbar */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by action, target, or user..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm text-white"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm text-white"
            >
              <option value="all">All Results</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>

            <button onClick={fetchLogs} className="px-4 py-2 border border-[#2a2a2a] rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-sm font-medium text-gray-300">
              Refresh
            </button>

            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>

            <button 
              onClick={handlePdfExport}
              className="px-4 py-2 bg-[#1a1a1a] border border-[#d4af37] text-[#d4af37] rounded-lg hover:bg-[#d4af37]/10 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden min-h-[400px] relative">
        {loading && (
          <div className="absolute inset-0 bg-[#0a0a0a]/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Action</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Target</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Result</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-gray-500">
                    No audit logs found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a]/50">
                    <td className="py-3 px-4 text-sm text-gray-400 font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <UserBadge user={log.userName} />
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{log.action}</td>
                    <td className="py-3 px-4 text-sm text-gray-300 font-medium">{log.target}</td>
                    <td className="py-3 px-4">
                      <ResultBadge result={log.result} />
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400 font-mono text-xs">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        <div className="border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalLogs)} of {totalLogs} events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-[#2a2a2a] rounded text-sm hover:bg-[#2a2a2a] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === pageNum
                        ? 'bg-[#d4af37] text-black font-medium'
                        : 'border border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === 2 && currentPage > 3) ||
                  (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return <span key={pageNum} className="text-gray-500 px-1 text-sm">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border border-[#2a2a2a] rounded text-sm hover:bg-[#2a2a2a] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Retention Policy */}
      <div className="mt-6 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#d4af37]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Filter className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div>
            <h4 className="font-medium text-[#d4af37] mb-1">Live Audit Tracking</h4>
            <p className="text-sm text-gray-300">
              System logs are captured in real-time. Actions performed by administrators, engineers, and automated agents are recorded for security and compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function UserBadge({ user }: { user: string }) {
  if (!user) return null;
  const isSystem = user === "System";

  return (
    <div className="flex items-center gap-2">
      {isSystem ? (
        <div className="w-7 h-7 bg-[#2a2a2a] rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-400">⚙️</span>
        </div>
      ) : (
        <div className="w-7 h-7 bg-gradient-to-br from-[#d4af37] to-[#f59e0b] rounded-full flex items-center justify-center text-black text-xs font-medium">
          {user.split(' ').map(n => n[0]).join('')}
        </div>
      )}
      <span className="text-sm font-medium text-white">{user}</span>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  if (result === "Success") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
        Success
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
      Failed
    </span>
  );
}
