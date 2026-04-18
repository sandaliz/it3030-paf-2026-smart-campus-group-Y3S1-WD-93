import React, { useState, useEffect } from 'react';
import { resourceService } from '../../services/resourceService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ResourceAnalyticsModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch all resources to calculate analytics
      const allResources = await resourceService.getAllResources();

      // Calculate analytics
      const totalShares = allResources.reduce((sum, r) => sum + (r.shareCount || 0), 0);
      const sharedResources = allResources.filter(r => r.shareCount > 0);
      const mostShared = [...allResources].sort((a, b) => (b.shareCount || 0) - (a.shareCount || 0)).slice(0, 5);

      // Group by type
      const sharesByType = {};
      allResources.forEach(r => {
        const type = r.type || 'Unknown';
        sharesByType[type] = (sharesByType[type] || 0) + (r.shareCount || 0);
      });

      // Group by status
      const sharesByStatus = {};
      allResources.forEach(r => {
        const status = r.status || 'Unknown';
        sharesByStatus[status] = (sharesByStatus[status] || 0) + (r.shareCount || 0);
      });

      // Resource overview by status
      const resourceByStatus = {};
      allResources.forEach(r => {
        const status = r.status || 'Unknown';
        resourceByStatus[status] = (resourceByStatus[status] || 0) + 1;
      });

      // Resource type distribution by status
      const typeByStatus = {};
      allResources.forEach(r => {
        const type = r.type || 'Unknown';
        const status = r.status || 'Unknown';
        if (!typeByStatus[type]) {
          typeByStatus[type] = {};
        }
        typeByStatus[type][status] = (typeByStatus[type][status] || 0) + 1;
      });

      // Extract staff information from resources
      let uniqueStaffCount = 0;
      const staffIds = new Set();
      allResources.forEach(r => {
        // Add creator
        if (r.createdBy) {
          const staffId = typeof r.createdBy === 'string' ? r.createdBy : r.createdBy.id;
          if (staffId && !staffIds.has(staffId)) {
            staffIds.add(staffId);
            uniqueStaffCount++;
          }
        }
        // Add assigned staff
        (r.assignedStaff || []).forEach(staff => {
          const staffId = typeof staff === 'string' ? staff : staff.id;
          if (staffId && !staffIds.has(staffId)) {
            staffIds.add(staffId);
            uniqueStaffCount++;
          }
        });
      });

      setAnalytics({
        totalResources: allResources.length,
        totalShares,
        sharedResourcesCount: sharedResources.length,
        mostShared,
        sharesByType,
        sharesByStatus,
        resourceByStatus,
        typeByStatus,
        avgSharesPerResource: totalShares / allResources.length || 0,
        uniqueStaffCount
      });
      setError(null);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'LECTURE_HALL':
        return '🏛️';
      case 'LAB':
        return '🔬';
      case 'MEETING_ROOM':
        return '🤝';
      case 'EQUIPMENT':
        return '📱';
      case 'OFFICE':
        return '🏢';
      case 'AUDITORIUM':
        return '🎭';
      default:
        return '📦';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'OUT_OF_SERVICE':
        return 'badge-error';
      case 'UNDER_MAINTENANCE':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  const exportToPDF = () => {
    try {
      if (!analytics) return;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resources Analytics Report', pageWidth / 2, 12, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 19, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      // Overview Stats - Compact Table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 14, 35);

      const overviewData = [
        ['Total Resources', analytics.totalResources.toString()],
        ['Total Staff', (analytics.uniqueStaffCount || 0).toString()],
        ['Total Shares', analytics.totalShares.toString()],
        ['Shared Resources', analytics.sharedResourcesCount.toString()],
        ['Avg Shares/Resource', analytics.avgSharesPerResource.toFixed(1)]
      ];

      autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Value']],
        body: overviewData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 } }
      });

      // Status Distribution - Table
      const statusY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Resource Status Distribution', 14, statusY);

      const statusTableData = Object.entries(analytics.resourceByStatus).map(([status, count]) => {
        const percentage = ((count / analytics.totalResources) * 100).toFixed(1);
        return [status.replace('_', ' '), count.toString(), percentage + '%'];
      });

      autoTable(doc, {
        startY: statusY + 5,
        head: [['Status', 'Count', '%']],
        body: statusTableData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 } }
      });

      // Type Distribution - Compact Table
      const typeY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Resource Type Distribution', 14, typeY);

      const resourceByType = {};
      Object.entries(analytics.typeByStatus).forEach(([type, statuses]) => {
        resourceByType[type] = Object.values(statuses).reduce((sum, count) => sum + count, 0);
      });

      const typeTableData = Object.entries(resourceByType).map(([type, count]) => {
        const percentage = ((count / analytics.totalResources) * 100).toFixed(1);
        return [type.replace('_', ' '), count.toString(), percentage + '%'];
      });

      autoTable(doc, {
        startY: typeY + 5,
        head: [['Type', 'Count', '%']],
        body: typeTableData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 } }
      });

      // Shares by Type - Compact Table
      const sharesY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Shares by Resource Type', 14, sharesY);

      const sharesTableData = Object.entries(analytics.sharesByType).map(([type, count]) => {
        const percentage = analytics.totalShares > 0 ? ((count / analytics.totalShares) * 100).toFixed(1) : '0.0';
        return [type.replace('_', ' '), count.toString(), percentage + '%'];
      });

      autoTable(doc, {
        startY: sharesY + 5,
        head: [['Type', 'Shares', '%']],
        body: sharesTableData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30 }, 2: { cellWidth: 20 } }
      });

      // PAGE 2
      doc.addPage();

      // Header for Page 2
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resource Share Analytics Report', pageWidth / 2, 12, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Page 2 of 3', pageWidth / 2, 19, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      // Top Shared Resources
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 5 Most Shared Resources', 14, 35);

      const mostSharedData = analytics.mostShared.slice(0, 5).map((resource, index) => [
        (index + 1).toString(),
        resource.name,
        resource.type.replace('_', ' '),
        resource.status.replace('_', ' '),
        (resource.shareCount || 0).toString()
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['#', 'Name', 'Type', 'Status', 'Shares']],
        body: mostSharedData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 60 }, 2: { cellWidth: 35 }, 3: { cellWidth: 35 }, 4: { cellWidth: 25 } }
      });

      // Detailed Type by Status Table
      const detailY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Resource Type by Status (Detailed)', 14, detailY);

      const typeByStatusData = [];
      Object.entries(analytics.typeByStatus).forEach(([type, statuses]) => {
        Object.entries(statuses).forEach(([status, count]) => {
          typeByStatusData.push([
            type.replace('_', ' '),
            status.replace('_', ' '),
            count.toString()
          ]);
        });
      });

      autoTable(doc, {
        startY: detailY + 5,
        head: [['Resource Type', 'Status', 'Count']],
        body: typeByStatusData,
        theme: 'plain',
        headStyles: { fillColor: [240, 240, 240], fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 50 }, 2: { cellWidth: 30 } }
      });

      // Footer
      const footerY = doc.lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Smart Campus Resource Management System', pageWidth / 2, footerY, { align: 'center' });

      // Save the PDF
      doc.save(`resource-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check console for details.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Resource Share Analytics</h3>
          {!loading && analytics && (
            <button
              onClick={exportToPDF}
              className="btn btn-sm btn-outline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure text-primary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div className="stat-title">Total Shares</div>
                <div className="stat-value text-2xl">{analytics.totalShares}</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure text-secondary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="stat-title">Total Resources</div>
                <div className="stat-value text-2xl">{analytics.totalResources}</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure text-accent">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-title">Shared Resources</div>
                <div className="stat-value text-2xl">{analytics.sharedResourcesCount}</div>
              </div>
              
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure text-info">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="stat-title">Avg Shares/Resource</div>
                <div className="stat-value text-2xl">{analytics.avgSharesPerResource.toFixed(1)}</div>
              </div>
            </div>

            {/* Resource Overview by Status */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Resource Overview by Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.resourceByStatus).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <div className={`badge ${getStatusBadgeColor(status)} badge-lg mb-2`}>
                        {status.replace('_', ' ')}
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-base-content/60">resources</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Shared Resources */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Most Shared Resources</h4>
                {analytics.mostShared.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.mostShared.map((resource, index) => (
                      <div key={resource.id} className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                        <div className="text-2xl font-bold text-primary w-8">{index + 1}</div>
                        <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                        <div className="flex-1">
                          <div className="font-semibold">{resource.name}</div>
                          <div className="text-sm text-base-content/70">
                            {resource.type.replace('_', ' ').toLowerCase()} • {resource.location}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`badge ${getStatusBadgeColor(resource.status)} badge-sm`}>
                            {resource.status.replace('_', ' ')}
                          </div>
                          <div className="text-lg font-bold text-primary">
                            {resource.shareCount || 0}
                          </div>
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-base-content/60 py-4">
                    No resources have been shared yet
                  </div>
                )}
              </div>
            </div>

            {/* Shares by Type */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Shares by Resource Type</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.sharesByType).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xl">{getResourceIcon(type)}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{type.replace('_', ' ')}</span>
                          <span className="text-sm font-semibold">{count} shares</span>
                        </div>
                        <progress
                          className="progress progress-primary w-full"
                          value={count}
                          max={analytics.totalShares || 1}
                        ></progress>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shares by Status */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title">Shares by Status</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.sharesByStatus).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <div className={`badge ${getStatusBadgeColor(status)} badge-lg mb-2`}>
                        {status.replace('_', ' ')}
                      </div>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-base-content/60">shares</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default ResourceAnalyticsModal;
