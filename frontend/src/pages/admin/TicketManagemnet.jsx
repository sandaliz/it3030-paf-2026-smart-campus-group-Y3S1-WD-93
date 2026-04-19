import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/ticketService';
import { commentService } from '../../services/ticketService';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AssignTechnicianModal from '../incidents/AssignTechnicianModal';

// ── Icon helper ───────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const icons = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  ticket:   'M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9zm9 3h.01',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  user:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  x:        'M18 6L6 18M6 6l12 12',
  check:    'M20 6L9 17l-5-5',
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  warning:  'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  clock:    'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2',
  filter:   'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  chart:    'M18 20V10M12 20V4M6 20v-6',
  download: 'M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3',
  print:    'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
};

// ── Reusable badges ───────────────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const map = {
    LOW:      { cls: 'badge-success', dot: 'bg-success' },
    MEDIUM:   { cls: 'badge-warning', dot: 'bg-warning' },
    HIGH:     { cls: 'badge-error',   dot: 'bg-error' },
    CRITICAL: { cls: 'badge-error',   dot: 'bg-error animate-pulse' },
  };
  const { cls, dot } = map[priority] || { cls: 'badge-neutral', dot: 'bg-neutral' };
  return (
    <span className={`badge badge-sm gap-1.5 font-semibold ${cls} badge-outline`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    OPEN:                 'badge-warning',
    IN_PROGRESS:          'badge-info',
    RESOLVED:             'badge-success',
    CLOSED:               'badge-neutral',
    PENDING_CONFIRMATION: 'badge-accent',
    REJECTED:             'badge-error',
  };
  return (
    <span className={`badge badge-sm font-semibold ${map[status] || 'badge-neutral'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, colorClass, bgAccent, desc }) => (
  <div className="relative overflow-hidden rounded-2xl bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 p-5">
    <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${bgAccent}`} />
    <p className="text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-1">{label}</p>
    <p className={`text-4xl font-black tabular-nums ${colorClass}`}>{value}</p>
    {desc && <p className="text-xs text-base-content/40 mt-1">{desc}</p>}
  </div>
);

// ── Modal shell ───────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, footer }) => (
  <div className="modal modal-open modal-bottom sm:modal-middle">
    <div className="modal-box w-11/12 max-w-lg rounded-2xl shadow-2xl border border-base-300 p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-200/50">
        <h3 className="font-bold text-lg">{title}</h3>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
          <Icon d={icons.x} size={16} />
        </button>
      </div>
      <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-base-300 bg-base-200/30 flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
    <div className="modal-backdrop bg-black/30 backdrop-blur-sm" onClick={onClose} />
  </div>
);

// ── Animated progress bar row ─────────────────────────────────────────────────
const ProgressRow = ({ label, count, percentage, barClass = 'bg-primary', labelClass = '' }) => (
  <div className="flex items-center gap-3">
    <span className={`text-sm font-medium w-36 shrink-0 truncate ${labelClass}`}>{label}</span>
    <div className="flex-1 bg-base-200 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 rounded-full transition-all duration-700 ${barClass}`}
        style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
      />
    </div>
    <span className="text-xs text-base-content/50 w-28 text-right shrink-0">
      {count} <span className="text-base-content/30">({percentage}%)</span>
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
const TicketManagementPage = () => {
  const { user } = useAuth();

  // ── Active tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('tickets');

  // ── Shared data ─────────────────────────────────────────────────────────────
  const [allTickets, setAllTickets]   = useState([]);
  const [tickets, setTickets]         = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading]         = useState(true);

  // ── Tickets tab ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0, open: 0, inProgress: 0,
    resolved: 0, pendingConfirmation: 0, closed: 0, rejected: 0,
  });
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedTicket, setSelectedTicket]         = useState(null);
  const [showDetailsModal, setShowDetailsModal]     = useState(false);
  const [showAssignModal, setShowAssignModal]       = useState(false);
  const [showRejectModal, setShowRejectModal]       = useState(false);
  const [showStatusModal, setShowStatusModal]       = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [recommendedTechnicians, setRecommendedTechnicians] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [rejectionReason, setRejectionReason]       = useState('');
  const [resolutionNotes, setResolutionNotes]       = useState('');
  const [newStatus, setNewStatus]                   = useState('');

  // ── Analytics tab ────────────────────────────────────────────────────────────
  const [timeRange, setTimeRange]               = useState('30');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [analyticsStats, setAnalyticsStats]     = useState({ total:0, open:0, inProgress:0, resolved:0, closed:0, rejected:0 });
  const [categoryStats, setCategoryStats]       = useState([]);
  const [priorityStats, setPriorityStats]       = useState([]);
  const [statusTrend, setStatusTrend]           = useState([]);
  const [technicianStats, setTechnicianStats]   = useState([]);
  const [resolutionTime, setResolutionTime]     = useState({ avg: 0, min: 0, max: 0 });

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketAPI.getAllTickets(0, 10);
      setTickets(res.data.content || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchStatsAndAll = async () => {
    try {
      const res = await ticketAPI.getAllTickets(0, 1000);
      const all = res.data.content || res.data;
      setAllTickets(all);
      const s = all.reduce((acc, t) => {
        acc.total++;
        if (t.status === 'OPEN')                 acc.open++;
        else if (t.status === 'IN_PROGRESS')     acc.inProgress++;
        else if (t.status === 'RESOLVED')        acc.resolved++;
        else if (t.status === 'CLOSED')          acc.closed++;
        else if (t.status === 'REJECTED')        acc.rejected++;
        else if (t.status === 'PENDING_CONFIRMATION') acc.pendingConfirmation++;
        return acc;
      }, { total:0, open:0, inProgress:0, resolved:0, pendingConfirmation:0, closed:0, rejected:0 });
      setStats(s);
      return; // Added return statement
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTechnicians = async () => {
    try { setTechnicians(await userService.getTechnicians()); }
    catch (e) { console.error(e); }
  };

  const fetchRecommendedTechnicians = async (ticketId) => {
    try {
      setLoadingRecommendations(true);
      const recommendations = await ticketAPI.getRecommendedTechnicians(ticketId);
      setRecommendedTechnicians(recommendations);
    } catch (e) {
      console.error(e);
      setRecommendedTechnicians([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // ── Analytics recalc ─────────────────────────────────────────────────────────
  const runAnalytics = (source) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
    const filtered = source.filter(t => new Date(t.createdAt) >= cutoff);

    // Summary stats
    setAnalyticsStats(filtered.reduce((acc, t) => {
      acc.total++;
      if (t.status==='OPEN') acc.open++;
      else if (t.status==='IN_PROGRESS') acc.inProgress++;
      else if (t.status==='RESOLVED') acc.resolved++;
      else if (t.status==='CLOSED') acc.closed++;
      else if (t.status==='REJECTED') acc.rejected++;
      return acc;
    }, { total:0, open:0, inProgress:0, resolved:0, closed:0, rejected:0 }));

    // Category
    const catMap = filtered.reduce((acc,t) => { acc[t.category]=(acc[t.category]||0)+1; return acc; }, {});
    setCategoryStats(Object.entries(catMap).map(([category, count]) => ({
      category, count,
      percentage: filtered.length ? ((count/filtered.length)*100).toFixed(1) : '0.0',
    })));

    // Priority
    const priMap = filtered.reduce((acc,t) => { acc[t.priority]=(acc[t.priority]||0)+1; return acc; }, {});
    setPriorityStats(Object.entries(priMap).map(([priority, count]) => ({
      priority, count,
      percentage: filtered.length ? ((count/filtered.length)*100).toFixed(1) : '0.0',
    })));

    // Trend (last 7 days)
    const dateGroups = filtered.reduce((acc, t) => {
      const d = new Date(t.createdAt).toLocaleDateString();
      if (!acc[d]) acc[d] = { open:0, in_progress:0, resolved:0, closed:0 };
      if (t.status==='OPEN')        acc[d].open++;
      else if (t.status==='IN_PROGRESS') acc[d].in_progress++;
      else if (t.status==='RESOLVED')    acc[d].resolved++;
      else if (t.status==='CLOSED')      acc[d].closed++;
      return acc;
    }, {});
    setStatusTrend(
      Object.entries(dateGroups)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a,b) => new Date(a.date)-new Date(b.date))
        .slice(-7)
    );

    // Technician load
    const assigned = filtered.filter(t => t.assignedTo);
    const techMap = assigned.reduce((acc,t) => { acc[t.assignedTo]=(acc[t.assignedTo]||0)+1; return acc; }, {});
    setTechnicianStats(Object.entries(techMap).map(([technician, count]) => ({
      technician, count,
      percentage: assigned.length ? ((count/assigned.length)*100).toFixed(1) : '0.0',
    })));

    // Resolution time
    const resolved = filtered.filter(t => t.status==='RESOLVED'||t.status==='CLOSED');
    if (resolved.length) {
      const times = resolved.map(t => (new Date(t.updatedAt)-new Date(t.createdAt))/(1000*60*60));
      setResolutionTime({
        avg: (times.reduce((s,x)=>s+x,0)/times.length).toFixed(1),
        min: Math.min(...times).toFixed(1),
        max: Math.max(...times).toFixed(1),
      });
    } else {
      setResolutionTime({ avg:0, min:0, max:0 });
    }
  };

  useEffect(() => { fetchTickets(); fetchStatsAndAll(); fetchTechnicians(); }, []);
  useEffect(() => { if (allTickets.length) runAnalytics(allTickets); }, [timeRange, allTickets]);
  useEffect(() => {
    if (showAssignModal && selectedTicket?.id) {
      fetchRecommendedTechnicians(selectedTicket.id);
    } else {
      setRecommendedTechnicians([]);
      setSelectedTechnician('');
    }
  }, [showAssignModal, selectedTicket?.id]);

  const refresh = () => { fetchTickets(); fetchStatsAndAll(); };

  // ── Ticket actions ───────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedTechnician) return;
    try {
      await ticketAPI.assignTicket(selectedTicket.id, selectedTechnician);
      const tech = recommendedTechnicians.find(t => t.id === selectedTechnician)
        || technicians.find(t => t.id === selectedTechnician);
      alert(`Ticket #${selectedTicket.id} assigned to ${tech?.name || selectedTechnician}. Email sent.`);
      setShowAssignModal(false);
      setSelectedTechnician('');
      setRecommendedTechnicians([]);
      refresh();
    } catch { alert('Error assigning ticket.'); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    try {
      await ticketAPI.rejectTicket(selectedTicket.id, rejectionReason);
      setShowRejectModal(false); setRejectionReason(''); refresh();
    } catch { alert('Error rejecting ticket.'); }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      await ticketAPI.updateTicketStatus(selectedTicket.id, newStatus, resolutionNotes);
      setShowStatusModal(false); setNewStatus(''); setResolutionNotes(''); refresh();
    } catch { alert('Error updating status.'); }
  };

  // ── Report generation ────────────────────────────────────────────────────────
  const analyticsTickets = allTickets.filter(t => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
    return new Date(t.createdAt) >= cutoff;
  });

  const generateCSV = () => {
    setGeneratingReport(true);
    try {
      const headers = ['Ticket ID','Title','Category','Priority','Status','Created By','Assigned To','Created Date','Updated Date','Location'];
      const rows = analyticsTickets.map(t => [
        t.id, `"${(t.title||'').replace(/"/g,'""')}"`, t.category, t.priority, t.status,
        `"${t.userName||'N/A'}"`, `"${t.assignedTo||'N/A'}"`,
        new Date(t.createdAt).toLocaleDateString(), new Date(t.updatedAt).toLocaleDateString(),
        `"${t.location||'N/A'}"`,
      ].join(','));
      const csv = [
        `Ticket Analytics Report - ${new Date().toLocaleDateString()}`,
        `Time Range: Last ${timeRange} days`,
        `Total: ${analyticsStats.total}`, `Open: ${analyticsStats.open}`,
        `Resolved: ${analyticsStats.resolved}`, `Avg Resolution: ${resolutionTime.avg}h`,
        '', headers.join(','), ...rows,
      ].join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
      a.download = `ticket-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch { alert('Error generating CSV.'); }
    finally { setGeneratingReport(false); }
  };

  const generatePDF = () => {
    setGeneratingReport(true);
    try {
      const html = `<!DOCTYPE html><html><head><title>Ticket Report</title>
      <style>
        body{font-family:Arial,sans-serif;margin:30px;color:#333}
        h1{text-align:center} h2{color:#444;border-bottom:1px solid #ddd;padding-bottom:6px;margin-top:24px}
        .grid{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}
        .card{flex:1;min-width:120px;border:1px solid #ddd;border-radius:8px;padding:16px;text-align:center}
        .val{font-size:28px;font-weight:bold}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#f5f5f5}
        .bar{background:#e0e0e0;border-radius:4px;height:10px}
        .fill{background:#5e81ac;border-radius:4px;height:10px}
      </style></head><body>
      <h1>Ticket Analytics Report</h1>
      <p style="text-align:center;color:#888">Generated ${new Date().toLocaleDateString()} · Last ${timeRange} days</p>
      <div class="grid">
        <div class="card"><div class="val">${analyticsStats.total}</div><div>Total</div></div>
        <div class="card"><div class="val" style="color:#d08770">${analyticsStats.open}</div><div>Open</div></div>
        <div class="card"><div class="val" style="color:#a3be8c">${analyticsStats.resolved}</div><div>Resolved</div></div>
        <div class="card"><div class="val" style="color:#5e81ac">${resolutionTime.avg}h</div><div>Avg Resolution</div></div>
      </div>
      <h2>Category Distribution</h2>
      <table><tr><th>Category</th><th>Count</th><th>%</th><th>Bar</th></tr>
      ${categoryStats.map(r=>`<tr><td>${r.category}</td><td>${r.count}</td><td>${r.percentage}%</td><td><div class="bar"><div class="fill" style="width:${r.percentage}%"></div></div></td></tr>`).join('')}
      </table>
      <h2>Priority Distribution</h2>
      <table><tr><th>Priority</th><th>Count</th><th>%</th><th>Bar</th></tr>
      ${priorityStats.map(r=>`<tr><td>${r.priority}</td><td>${r.count}</td><td>${r.percentage}%</td><td><div class="bar"><div class="fill" style="width:${r.percentage}%"></div></div></td></tr>`).join('')}
      </table>
      <h2>Status Trend (Last 7 Days)</h2>
      <table><tr><th>Date</th><th>Open</th><th>In Progress</th><th>Resolved</th><th>Closed</th></tr>
      ${statusTrend.map(d=>`<tr><td>${d.date}</td><td>${d.open||0}</td><td>${d.in_progress||0}</td><td>${d.resolved||0}</td><td>${d.closed||0}</td></tr>`).join('')}
      </table>
      ${technicianStats.length?`<h2>Technician Load</h2><table><tr><th>Technician</th><th>Tickets</th><th>%</th></tr>${technicianStats.map(r=>`<tr><td>${r.technician}</td><td>${r.count}</td><td>${r.percentage}%</td></tr>`).join('')}</table>`:''}
      <h2>Ticket Detail</h2>
      <table><tr><th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Created</th></tr>
      ${analyticsTickets.map(t=>`<tr><td>${t.id}</td><td>${t.title}</td><td>${t.category}</td><td>${t.priority}</td><td>${t.status}</td><td>${t.assignedTo||'—'}</td><td>${new Date(t.createdAt).toLocaleDateString()}</td></tr>`).join('')}
      </table>
      </body></html>`;
      const w = window.open('','_blank');
      w.document.write(html); w.document.close();
      w.onload = () => { w.print(); w.close(); };
    } catch { alert('Error generating PDF.'); }
    finally { setGeneratingReport(false); }
  };

  // ── Filtered rows ────────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter(t => {
    const q = searchTerm.toLowerCase();
    return (
      (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) &&
      (statusFilter === 'ALL' || t.status === statusFilter)
    );
  });

  const STATUS_OPTIONS = ['ALL','OPEN','IN_PROGRESS','RESOLVED','PENDING_CONFIRMATION','CLOSED','REJECTED'];

  const ticketStatCards = [
    { label:'Total',       value:stats.total,               colorClass:'text-primary',        bgAccent:'bg-primary' },
    { label:'Open',        value:stats.open,                colorClass:'text-warning',         bgAccent:'bg-warning' },
    { label:'In Progress', value:stats.inProgress,          colorClass:'text-info',            bgAccent:'bg-info' },
    { label:'Resolved',    value:stats.resolved,            colorClass:'text-success',         bgAccent:'bg-success' },
    { label:'Pending',     value:stats.pendingConfirmation, colorClass:'text-accent',          bgAccent:'bg-accent' },
    { label:'Closed',      value:stats.closed,              colorClass:'text-base-content/60', bgAccent:'bg-neutral' },
  ];

  const priorityBarClass   = { LOW:'bg-success', MEDIUM:'bg-warning', HIGH:'bg-error', CRITICAL:'bg-error' };
  const priorityLabelClass = { LOW:'text-success', MEDIUM:'text-warning', HIGH:'text-error', CRITICAL:'text-error font-bold' };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-base-200 font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <header className="bg-base-100 border-b border-base-300 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">
              {activeTab === 'tickets' ? 'Ticket Management' : 'Analytics & Reports'}
            </h1>
            <p className="text-sm text-base-content/50 mt-0.5">
              {activeTab === 'tickets'
                ? 'Manage, assign, and track all support tickets'
                : 'Insights and exportable reports across all tickets'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switcher */}
            <div className="tabs tabs-boxed bg-base-200 p-1 rounded-xl">
              <button
                className={`tab tab-sm gap-1.5 rounded-lg transition-all font-semibold ${activeTab==='tickets' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('tickets')}
              >
                <Icon d={icons.ticket} size={13} /> Tickets
              </button>
              <button
                className={`tab tab-sm gap-1.5 rounded-lg transition-all font-semibold ${activeTab==='analytics' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <Icon d={icons.chart} size={13} /> Analytics
              </button>
            </div>
            <button className="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-base-content" onClick={refresh}>
              <Icon d={icons.refresh} size={14} /> Refresh
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TICKETS TAB                                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tickets' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {ticketStatCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>

            {/* Table card */}
            <div className="card bg-base-100 shadow-sm border border-base-300 rounded-2xl overflow-hidden">
              {/* Card toolbar */}
              <div className="px-6 py-4 border-b border-base-300 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Icon d={icons.ticket} size={18} className="text-primary" />
                  All Tickets
                  <span className="badge badge-primary badge-sm ml-1">{filteredTickets.length}</span>
                </h2>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="input input-sm input-bordered flex items-center gap-2 min-w-[200px]">
                    <Icon d={icons.search} size={14} className="opacity-50" />
                    <input
                      type="text" placeholder="Search tickets…"
                      className="grow bg-transparent outline-none text-sm"
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                  </label>
                  <div className="flex items-center gap-1">
                    <Icon d={icons.filter} size={13} className="text-base-content/40" />
                    <select
                      className="select select-sm select-bordered text-sm"
                      value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Table body */}
              {loading ? (
                <div className="flex justify-center items-center py-24">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-base-content/30 gap-3">
                  <Icon d={icons.ticket} size={40} />
                  <p className="font-semibold">No tickets found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead className="bg-base-200/60">
                      <tr className="text-xs uppercase tracking-widest text-base-content/50">
                        <th className="py-3">ID</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover border-b border-base-200 group transition-colors">
                          <td>
                            <span className="font-mono text-xs text-base-content/50 bg-base-200 px-2 py-0.5 rounded">
                              #{ticket.id}
                            </span>
                          </td>
                          <td className="max-w-[220px]">
                            <p className="font-semibold text-sm truncate">{ticket.title}</p>
                            <p className="text-xs text-base-content/40 truncate">{ticket.category}</p>
                          </td>
                          <td><PriorityBadge priority={ticket.priority} /></td>
                          <td><StatusBadge status={ticket.status} /></td>
                          <td>
                            {ticket.assignedTo ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                  {ticket.assignedTo[0].toUpperCase()}
                                </span>
                                <span className="text-xs truncate max-w-[90px]">{ticket.assignedTo}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-base-content/30 italic">Unassigned</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-xs text-base-content/50">
                              <Icon d={icons.clock} size={11} />
                              {new Date(ticket.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                            </div>
                          </td>
                          <td>
                            <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                className="btn btn-xs btn-ghost btn-square tooltip" data-tip="View details"
                                onClick={() => { setSelectedTicket(ticket); setShowDetailsModal(true); }}
                              >
                                <Icon d={icons.eye} size={13} />
                              </button>
                              {ticket.status === 'OPEN' && (
                                <>
                                  <button className="btn btn-xs btn-warning gap-1"
                                    onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true); }}>
                                    <Icon d={icons.user} size={11} /> Assign
                                  </button>
                                  <button className="btn btn-xs btn-error btn-outline gap-1"
                                    onClick={() => { setSelectedTicket(ticket); setShowRejectModal(true); }}>
                                    <Icon d={icons.x} size={11} /> Reject
                                  </button>
                                </>
                              )}
                              {ticket.status === 'IN_PROGRESS' && (
                                <button className="btn btn-xs btn-success gap-1"
                                  onClick={() => { setSelectedTicket(ticket); setShowStatusModal(true); }}>
                                  <Icon d={icons.refresh} size={11} /> Update
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ANALYTICS TAB                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">

            {/* Controls row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon d={icons.filter} size={14} className="text-base-content/40" />
                <select
                  className="select select-sm select-bordered"
                  value={timeRange} onChange={e => setTimeRange(e.target.value)}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                <span className="text-xs text-base-content/40 ml-1">
                  {analyticsTickets.length} tickets in range
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-success gap-2"
                  onClick={generateCSV}
                  disabled={generatingReport || !analyticsTickets.length}
                >
                  {generatingReport
                    ? <span className="loading loading-spinner loading-xs" />
                    : <Icon d={icons.download} size={14} />}
                  Export CSV
                </button>
                <button
                  className="btn btn-sm btn-primary gap-2"
                  onClick={generatePDF}
                  disabled={generatingReport || !analyticsTickets.length}
                >
                  {generatingReport
                    ? <span className="loading loading-spinner loading-xs" />
                    : <Icon d={icons.print} size={14} />}
                  Generate PDF
                </button>
              </div>
            </div>

            {/* Overview stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Tickets"    value={analyticsStats.total}     colorClass="text-primary" bgAccent="bg-primary" desc="In selected period" />
              <StatCard label="Open Tickets"     value={analyticsStats.open}      colorClass="text-warning" bgAccent="bg-warning" desc="Awaiting action" />
              <StatCard label="Resolved"         value={analyticsStats.resolved}  colorClass="text-success" bgAccent="bg-success" desc="Successfully closed" />
              <StatCard label="Avg Resolution"   value={`${resolutionTime.avg}h`} colorClass="text-info"    bgAccent="bg-info"    desc={`Min ${resolutionTime.min}h · Max ${resolutionTime.max}h`} />
            </div>

            {/* Category + Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category distribution */}
              <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
                <div className="card-body gap-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Icon d={icons.chart} size={16} className="text-primary" />
                    Category Distribution
                  </h3>
                  {categoryStats.length === 0
                    ? <p className="text-base-content/30 text-sm italic py-4 text-center">No data for this period</p>
                    : <div className="space-y-3">
                        {categoryStats.sort((a,b)=>b.count-a.count).map(item => (
                          <ProgressRow
                            key={item.category}
                            label={item.category}
                            count={item.count}
                            percentage={item.percentage}
                            barClass="bg-primary"
                          />
                        ))}
                      </div>
                  }
                </div>
              </div>

              {/* Priority distribution */}
              <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
                <div className="card-body gap-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Icon d={icons.warning} size={16} className="text-warning" />
                    Priority Distribution
                  </h3>
                  {priorityStats.length === 0
                    ? <p className="text-base-content/30 text-sm italic py-4 text-center">No data for this period</p>
                    : <div className="space-y-3">
                        {['CRITICAL','HIGH','MEDIUM','LOW'].map(pri => {
                          const item = priorityStats.find(p => p.priority === pri);
                          if (!item) return null;
                          return (
                            <ProgressRow
                              key={item.priority}
                              label={item.priority}
                              count={item.count}
                              percentage={item.percentage}
                              barClass={priorityBarClass[item.priority] || 'bg-neutral'}
                              labelClass={priorityLabelClass[item.priority] || ''}
                            />
                          );
                        })}
                      </div>
                  }
                </div>
              </div>
            </div>

            {/* Status trend */}
            <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
              <div className="card-body gap-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Icon d={icons.clock} size={16} className="text-info" />
                  Status Trend — Last 7 Days
                </h3>
                {statusTrend.length === 0
                  ? <p className="text-base-content/30 text-sm italic py-4 text-center">No trend data available</p>
                  : (
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead className="bg-base-200/60">
                          <tr className="text-xs uppercase tracking-widest text-base-content/50">
                            <th>Date</th>
                            <th className="text-warning">Open</th>
                            <th className="text-info">In Progress</th>
                            <th className="text-success">Resolved</th>
                            <th>Closed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusTrend.map(day => (
                            <tr key={day.date} className="hover border-b border-base-200">
                              <td className="font-mono text-xs">{day.date}</td>
                              <td><span className="font-semibold text-warning">{day.open||0}</span></td>
                              <td><span className="font-semibold text-info">{day.in_progress||0}</span></td>
                              <td><span className="font-semibold text-success">{day.resolved||0}</span></td>
                              <td><span className="font-semibold text-base-content/40">{day.closed||0}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </div>
            </div>

            {/* Technician performance */}
            {technicianStats.length > 0 && (
              <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl">
                <div className="card-body gap-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Icon d={icons.user} size={16} className="text-accent" />
                    Technician Load
                  </h3>
                  <div className="space-y-3">
                    {technicianStats.sort((a,b)=>b.count-a.count).map(tech => (
                      <div key={tech.technician} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                          {tech.technician[0].toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <ProgressRow
                            label={tech.technician}
                            count={tech.count}
                            percentage={tech.percentage}
                            barClass="bg-accent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {showDetailsModal && selectedTicket && (
        <Modal title="Ticket Details" onClose={() => setShowDetailsModal(false)}
          footer={<button className="btn btn-sm" onClick={() => setShowDetailsModal(false)}>Close</button>}
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ['Ticket ID',   `#${selectedTicket.id}`],
              ['Status',      <StatusBadge status={selectedTicket.status} />],
              ['Priority',    <PriorityBadge priority={selectedTicket.priority} />],
              ['Category',    selectedTicket.category],
              ['Assigned To', selectedTicket.assignedTo || '—'],
              ['Created',     new Date(selectedTicket.createdAt).toLocaleString()],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs uppercase tracking-wider text-base-content/40 mb-0.5">{k}</p>
                <p className="font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-base-content/40 mb-1">Title</p>
            <p className="font-semibold">{selectedTicket.title}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-base-content/40 mb-1">Description</p>
            <p className="text-sm text-base-content/80 leading-relaxed bg-base-200 rounded-xl p-3">
              {selectedTicket.description}
            </p>
          </div>
        </Modal>
      )}

      <AssignTechnicianModal
        isOpen={showAssignModal && !!selectedTicket}
        ticket={selectedTicket}
        loading={false}
        onClose={() => setShowAssignModal(false)}
        onAssign={async (technicianId, technician) => {
          setSelectedTechnician(technicianId);
          try {
            await ticketAPI.assignTicket(selectedTicket.id, technicianId);
            alert(`Ticket #${selectedTicket.id} assigned to ${technician?.name || technicianId}. Email sent.`);
            setShowAssignModal(false);
            setSelectedTechnician('');
            setRecommendedTechnicians([]);
            refresh();
          } catch (error) {
            console.error(error);
            alert('Error assigning ticket.');
          }
        }}
      />

      {false && showAssignModal && selectedTicket && (
        <Modal title="Assign Ticket" onClose={() => setShowAssignModal(false)}
          footer={
            <>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handleAssign} disabled={!selectedTechnician}>
                <Icon d={icons.check} size={13} /> Assign
              </button>
            </>
          }
        >
          <div className="alert alert-info alert-soft text-sm rounded-xl py-2">
            Assigning <strong>#{selectedTicket.id}</strong> — {selectedTicket.title}
          </div>
          <div className="form-control gap-1.5">
            <label className="label py-0">
              <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Select Technician</span>
            </label>
            <select className="select select-bordered w-full" value={selectedTechnician} onChange={e => setSelectedTechnician(e.target.value)}>
              <option value="">Choose a technician…</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
            </select>
          </div>
        </Modal>
      )}

      {showRejectModal && selectedTicket && (
        <Modal title="Reject Ticket" onClose={() => setShowRejectModal(false)}
          footer={
            <>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-sm btn-error" onClick={handleReject} disabled={!rejectionReason.trim()}>
                <Icon d={icons.x} size={13} /> Reject
              </button>
            </>
          }
        >
          <div className="alert alert-warning alert-soft text-sm rounded-xl py-2">
            <Icon d={icons.warning} size={14} />
            This will permanently reject ticket <strong>#{selectedTicket.id}</strong>.
          </div>
          <div className="form-control gap-1.5">
            <label className="label py-0">
              <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">Reason for Rejection</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 resize-none"
              placeholder="Describe why this ticket is being rejected…"
              value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {showStatusModal && selectedTicket && (
        <Modal title="Update Status" onClose={() => setShowStatusModal(false)}
          footer={
            <>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button className="btn btn-sm btn-success" onClick={handleUpdateStatus} disabled={!newStatus}>
                <Icon d={icons.check} size={13} /> Save
              </button>
            </>
          }
        >
          <div className="alert alert-info alert-soft text-sm rounded-xl py-2">
            Updating status for <strong>#{selectedTicket.id}</strong>
          </div>
          <div className="form-control gap-1.5">
            <label className="label py-0">
              <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">New Status</span>
            </label>
            <select className="select select-bordered w-full" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="">Select new status…</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="form-control gap-1.5">
            <label className="label py-0">
              <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Resolution Notes <span className="text-base-content/30">(optional)</span>
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered h-24 resize-none"
              placeholder="Add any resolution notes…"
              value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TicketManagementPage;
