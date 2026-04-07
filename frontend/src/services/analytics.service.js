import { transformAnalytics, transformPublicFeedbackAnalytics } from './api/adapters.js';

const toTime = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const daysSince = (value) => {
  const time = toTime(value);
  if (!time) return 0;
  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
};

export const createUserComplaintAnalytics = (complaints = []) => {
  const rows = complaints || [];
  const openRows = rows.filter((row) => ['submitted', 'in_review'].includes(String(row.status || '').toLowerCase()));
  const resolvedRows = rows.filter((row) => ['resolved', 'closed'].includes(String(row.status || '').toLowerCase()));

  return {
    summary: {
      total: rows.length,
      open: openRows.length,
      resolved: resolvedRows.length
    },
    recentComplaints: rows.slice(0, 5)
  };
};

export const createOrgAdminAnalytics = ({ complaints = [], users = [], departments = [], escalations = [], statusLogs = [] } = {}) => {
  const complaintsSorted = [...complaints].sort((a, b) => {
    const aTime = toTime(a.updated_at || a.reviewed_at || a.created_at);
    const bTime = toTime(b.updated_at || b.reviewed_at || b.created_at);
    return bTime - aTime;
  });

  const activeUsers = users.filter((row) => String(row.status || '').toLowerCase() === 'active');
  const inactiveUsers = users.filter((row) => String(row.status || '').toLowerCase() !== 'active');
  const openComplaints = complaints.filter((row) => ['submitted', 'in_review'].includes(String(row.status || '').toLowerCase()));
  const inReviewComplaints = complaints.filter((row) => String(row.status || '').toLowerCase() === 'in_review');
  const overdueComplaints = openComplaints.filter((row) => daysSince(row.updated_at || row.created_at) >= 4);
  const unassignedDepartmentComplaints = openComplaints.filter((row) => !row.department_id && !row.department_name);
  const unansweredComplaints = openComplaints.filter((row) => !String(row.admin_response || '').trim());
  const activeEscalations = escalations.filter((row) => ['pending', 'in_progress'].includes(String(row.status || '').toLowerCase()));

  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const resolvedThisWeek = complaints.filter((row) => {
    const status = String(row.status || '').toLowerCase();
    const resolvedAt = toTime(row.reviewed_at || row.updated_at || row.created_at);
    return ['resolved', 'closed'].includes(status) && resolvedAt >= weekAgo;
  }).length;
  const newComplaintsThisWeek = complaints.filter((row) => toTime(row.created_at) >= weekAgo).length;

  const statusCounts = {
    submitted: 0,
    in_review: 0,
    resolved: 0,
    closed: 0
  };

  complaints.forEach((complaint) => {
    const status = String(complaint.status || 'submitted').toLowerCase();
    if (Object.hasOwn(statusCounts, status)) statusCounts[status] += 1;
  });

  const statusSeries = [
    { label: 'Submitted', value: statusCounts.submitted, tone: '#f59e0b' },
    { label: 'In Review', value: statusCounts.in_review, tone: '#2563eb' },
    { label: 'Resolved', value: statusCounts.resolved, tone: '#16a34a' },
    { label: 'Closed', value: statusCounts.closed, tone: '#64748b' }
  ];

  const timeline = {};
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    timeline[key] = {
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: 0
    };
  }
  complaints.forEach((complaint) => {
    const key = (complaint.created_at ? new Date(complaint.created_at) : new Date()).toISOString().slice(0, 10);
    if (timeline[key]) timeline[key].value += 1;
  });

  const counts = new Map();
  departments.forEach((department) => {
    counts.set(String(department.name || `Department #${department.id}`), 0);
  });
  complaints.forEach((complaint) => {
    const label = complaint.department_name || 'Unassigned';
    counts.set(label, Number(counts.get(label) || 0) + 1);
  });
  const departmentWorkloadSeries = [...counts.entries()]
    .map(([label, value], index) => ({
      label,
      value,
      tone: index === 0 ? '#183a63' : index === 1 ? '#335c8a' : index === 2 ? '#5b587f' : '#8a6d2f'
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const summaryCards = [
    { label: 'Open Complaints', value: openComplaints.length, detail: 'submitted or in review', icon: '📂' },
    { label: 'In Review', value: inReviewComplaints.length, detail: 'awaiting progress', icon: '📝' },
    { label: 'Resolved This Week', value: resolvedThisWeek, detail: 'closed or resolved', icon: '✅' },
    { label: 'New Complaints This Week', value: newComplaintsThisWeek, detail: 'fresh intake', icon: '🆕' },
    { label: 'Active Users', value: activeUsers.length, detail: 'organization staff', icon: '👥' }
  ];

  const attentionItems = [];
  if (overdueComplaints.length) attentionItems.push({ title: `${overdueComplaints.length} complaints are overdue`, detail: 'These cases have stayed open for at least 4 days without resolution.', tone: 'danger' });
  if (activeEscalations.length) attentionItems.push({ title: `${activeEscalations.length} escalations are still active`, detail: 'Escalated complaints need direct operational follow-up inside this organization.', tone: 'warning' });
  if (unassignedDepartmentComplaints.length) attentionItems.push({ title: `${unassignedDepartmentComplaints.length} complaints need department assignment`, detail: 'Routing these complaints will reduce response delays and improve workload clarity.', tone: 'warning' });
  if (unansweredComplaints.length) attentionItems.push({ title: `${unansweredComplaints.length} complaints still need an admin response`, detail: 'These cases appear open without a recorded official response.', tone: 'danger' });
  if (!attentionItems.length) attentionItems.push({ title: 'No urgent complaint workflow blockers right now', detail: 'Complaint intake, assignment, and response activity look stable inside this organization.', tone: 'info' });

  return {
    complaintsSorted,
    activeUsers,
    inactiveUsers,
    openComplaints,
    inReviewComplaints,
    overdueComplaints,
    unassignedDepartmentComplaints,
    unansweredComplaints,
    activeEscalations,
    resolvedThisWeek,
    newComplaintsThisWeek,
    summaryCards,
    attentionItems: attentionItems.slice(0, 4),
    statusSeries,
    complaintTrendSeries: Object.values(timeline),
    departmentWorkloadSeries,
    statusLogs,
    escalations,
    users
  };
};

export const createSuperAdminAnalytics = ({ organizations = [], dashboardStats = {} } = {}) => {
  const normalizedStats = transformAnalytics(dashboardStats);
  const totalComplaints = Number(normalizedStats.totalComplaints || 0);
  const submittedComplaints = Number(normalizedStats.submittedComplaints || 0);
  const inReviewComplaints = Number(normalizedStats.inReviewComplaints || 0);
  const resolvedComplaints = Number(normalizedStats.resolvedComplaints || 0);
  const closedComplaints = Number(normalizedStats.closedComplaints || 0);
  const openComplaints = submittedComplaints + inReviewComplaints;
  const resolvedTotal = resolvedComplaints + closedComplaints;

  const totalEscalations = Object.values(normalizedStats.escalationStatusCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const openEscalations = Number(normalizedStats.escalationStatusCounts?.pending || 0) + Number(normalizedStats.escalationStatusCounts?.in_progress || 0);

  const activeOrganizations = organizations.filter((item) => String(item.status || '').toLowerCase() === 'active');
  const inactiveOrganizations = organizations.filter((item) => String(item.status || '').toLowerCase() !== 'active');
  const organizationsWithoutAdmin = organizations.filter((item) => !item.organization_admin?.email && !item.organization_admin?.full_name);
  const resolutionRate = totalComplaints > 0 ? (resolvedTotal / totalComplaints) * 100 : 0;
  const globalPendingRate = totalComplaints > 0 ? (openComplaints / totalComplaints) : 0;
  const globalEscalationRate = totalComplaints > 0 ? (openEscalations / totalComplaints) : 0;
  const averageComplaintsPerOrganization = activeOrganizations.length > 0 ? Math.round(totalComplaints / activeOrganizations.length) : 0;

  const organizationComplaintMap = new Map();
  normalizedStats.complaintsByOrganization.forEach((row) => {
    organizationComplaintMap.set(Number(row.organization_id), Number(row.value || 0));
  });
  organizations.forEach((row) => {
    const key = Number(row.organization_id);
    if (!organizationComplaintMap.has(key)) {
      organizationComplaintMap.set(key, Number(row.complaints_count || 0));
    }
  });

  const organizationOverviewRows = organizations.map((organization) => {
    const id = Number(organization.organization_id);
    const total = Number(organizationComplaintMap.get(id) || 0);
    const status = String(organization.status || 'inactive').toLowerCase();
    const hasAdmin = Boolean(organization.organization_admin?.email || organization.organization_admin?.full_name);
    const complaintPressure = averageComplaintsPerOrganization > 0 ? total / averageComplaintsPerOrganization : 0;
    const pendingMultiplier = status === 'active' ? 1 : 1.3;
    const adminMultiplier = hasAdmin ? 1 : 1.25;
    const estimatedPending = Math.min(total, Math.round(total * globalPendingRate * pendingMultiplier * adminMultiplier));
    const responseRate = Math.max(18, Math.min(98, Math.round(resolutionRate - (hasAdmin ? 0 : 12) - (status === 'active' ? 0 : 18) - Math.max(0, (complaintPressure - 1) * 9))));
    const escalationRate = Math.max(2, Math.min(95, Math.round((globalEscalationRate * 100) + (status === 'active' ? 0 : 9) + (hasAdmin ? 0 : 6) + Math.max(0, (complaintPressure - 1) * 8))));
    const riskScore = estimatedPending + escalationRate + (hasAdmin ? 0 : 18) + (status === 'active' ? 0 : 24);

    return {
      id,
      name: organization.name || 'Unnamed organization',
      status,
      totalComplaints: total,
      pendingComplaints: estimatedPending,
      responseRate,
      escalationRate,
      hasAdmin,
      adminName: organization.organization_admin?.full_name || 'Not assigned',
      riskScore
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  const underperformingOrganizations = organizationOverviewRows
    .filter((row) => row.pendingComplaints >= 10 || row.escalationRate >= 18 || !row.hasAdmin || row.status !== 'active')
    .slice(0, 5);

  const systemAlerts = [];
  if (organizationsWithoutAdmin.length > 0) systemAlerts.push({ title: `${organizationsWithoutAdmin.length} organizations are missing org-admin coverage`, detail: 'These organizations need an assigned org-admin before their internal response performance can stabilize.', tone: 'danger' });
  if (inactiveOrganizations.length > 0) systemAlerts.push({ title: `${inactiveOrganizations.length} organizations are currently inactive`, detail: 'Inactive organizations remain visible in system oversight but should not be treated as healthy routing targets.', tone: 'warning' });
  if (openEscalations > 0) systemAlerts.push({ title: `${openEscalations} escalations remain open across organizations`, detail: 'Use this signal to identify where organization-level operations are struggling before the backlog grows further.', tone: 'danger' });
  if (Number(normalizedStats.unassignedAnonymousComplaints || 0) > 0) systemAlerts.push({ title: `${normalizedStats.unassignedAnonymousComplaints} anonymous complaints still need organization routing`, detail: 'This is a platform supervision signal only. Routing decisions should stay inside the organization oversight workflow.', tone: 'warning' });
  if (underperformingOrganizations.length > 0) systemAlerts.push({ title: `${underperformingOrganizations.length} organizations are below expected performance`, detail: 'Pending volume, escalation exposure, or missing administrative ownership is putting these organizations at risk.', tone: 'danger' });
  if (!systemAlerts.length) systemAlerts.push({ title: 'No urgent platform alerts right now', detail: 'Organization coverage and complaint performance look stable in the current reporting window.', tone: 'info' });

  return {
    normalizedStats,
    activeOrganizations,
    inactiveOrganizations,
    organizationsWithoutAdmin,
    totalComplaints,
    submittedComplaints,
    inReviewComplaints,
    resolvedComplaints,
    closedComplaints,
    openComplaints,
    resolvedTotal,
    totalEscalations,
    openEscalations,
    resolutionRate,
    averageComplaintsPerOrganization,
    organizationOverviewRows,
    underperformingOrganizations,
    systemAlerts,
    organizationStatusSeries: [
      { label: 'Active', value: activeOrganizations.length, tone: '#183a63' },
      { label: 'Inactive', value: inactiveOrganizations.length, tone: '#f59e0b' },
      { label: 'Missing Org Admin', value: organizationsWithoutAdmin.length, tone: '#dc2626' }
    ],
    complaintStatusSeries: [
      { label: 'Submitted', value: submittedComplaints, tone: '#f59e0b' },
      { label: 'In Review', value: inReviewComplaints, tone: '#2563eb' },
      { label: 'Resolved', value: resolvedComplaints, tone: '#16a34a' },
      { label: 'Closed', value: closedComplaints, tone: '#64748b' }
    ],
    complaintTrendSeries: normalizedStats.complaintMonthlyTrend || [],
    organizationLoadSeries: organizationOverviewRows.slice(0, 6).map((row) => ({
      label: row.name,
      value: row.totalComplaints,
      tone: row.status === 'active' ? '#183a63' : '#9b4d43'
    })),
    summaryCards: [
      { label: 'Organizations', value: Number(normalizedStats.totalOrganizations || organizations.length || 0), detail: 'tracked tenants' },
      { label: 'Active Orgs', value: Number(normalizedStats.activeOrganizations || activeOrganizations.length || 0), detail: 'currently operating' },
      { label: 'Open Complaints', value: openComplaints, detail: 'submitted or in review' },
      { label: 'Open Escalations', value: openEscalations, detail: 'pending or in progress' }
    ]
  };
};

export const createReportsAnalytics = (stats = {}) => {
  const normalizedStats = transformAnalytics(stats);
  const complaintStatusSeries = [
    { label: 'Submitted', value: Number(normalizedStats.submittedComplaints || 0), tone: '#1d4ed8' },
    { label: 'In Review', value: Number(normalizedStats.inReviewComplaints || 0), tone: '#0f766e' },
    { label: 'Resolved', value: Number(normalizedStats.resolvedComplaints || 0), tone: '#d97706' },
    { label: 'Closed', value: Number(normalizedStats.closedComplaints || 0), tone: '#0f172a' }
  ];
  const escalationBars = [
    { label: 'Pending', value: Number(normalizedStats.escalationStatusCounts.pending || 0), tone: '#d97706' },
    { label: 'In Progress', value: Number(normalizedStats.escalationStatusCounts.in_progress || 0), tone: '#2563eb' },
    { label: 'Resolved', value: Number(normalizedStats.escalationStatusCounts.resolved || 0), tone: '#0f766e' },
    { label: 'Rejected', value: Number(normalizedStats.escalationStatusCounts.rejected || 0), tone: '#64748b' }
  ];
  const feedbackBars = Object.entries(normalizedStats.feedbackSummary.byRating || {}).map(([rating, count], index) => ({
    label: `${rating} Star`,
    value: Number(count || 0),
    tone: ['#1d4ed8', '#2563eb', '#0f766e', '#d97706', '#7c3aed'][index % 5]
  }));
  const totalComplaints = complaintStatusSeries.reduce((sum, item) => sum + item.value, 0);
  const openComplaints = Number(normalizedStats.submittedComplaints || 0) + Number(normalizedStats.inReviewComplaints || 0);
  const openEscalations = Number(normalizedStats.escalationStatusCounts.pending || 0) + Number(normalizedStats.escalationStatusCounts.in_progress || 0);
  const complaintResolutionRate = totalComplaints > 0 ? Math.round(((Number(normalizedStats.resolvedComplaints || 0) + Number(normalizedStats.closedComplaints || 0)) / totalComplaints) * 100) : 0;
  const analyticsSummary = {
    totalComplaints,
    openComplaints,
    totalEscalations: escalationBars.reduce((sum, item) => sum + item.value, 0),
    averageFeedback: Number(normalizedStats.feedbackSummary.average || 0).toFixed(2)
  };
  const topComplaintOrganization = normalizedStats.complaintsByOrganization[0] || null;

  const attentionItems = [];
  if (openEscalations > 0) attentionItems.push({ title: 'Escalations are still open', detail: `${openEscalations} escalations remain pending or in progress and should be reviewed before the queue grows further.`, tone: 'border-amber-200 bg-amber-50 text-amber-900' });
  if (openComplaints > 0 && complaintResolutionRate < 60) attentionItems.push({ title: 'Complaint resolution rate is still low', detail: `${complaintResolutionRate}% of complaints are resolved or closed based on the current reporting feed.`, tone: 'border-red-200 bg-red-50 text-red-900' });
  if (topComplaintOrganization?.value >= Math.max(5, Math.ceil(totalComplaints * 0.2))) attentionItems.push({ title: 'Complaint volume is concentrated', detail: `${topComplaintOrganization.label} currently carries the highest complaint load with ${topComplaintOrganization.value} complaints.`, tone: 'border-blue-200 bg-blue-50 text-blue-900' });
  if (Number(normalizedStats.feedbackSummary.average || 0) > 0 && Number(normalizedStats.feedbackSummary.average || 0) < 3.5) attentionItems.push({ title: 'Feedback trend needs follow-up', detail: `Average feedback is ${Number(normalizedStats.feedbackSummary.average || 0).toFixed(2)}/5, which may indicate delays or poor resolution quality.`, tone: 'border-red-200 bg-red-50 text-red-900' });
  if (!attentionItems.length) attentionItems.push({ title: 'No immediate report-level alerts', detail: 'Current complaint, escalation, and feedback data does not show a major platform-level warning.', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' });

  return {
    normalizedStats,
    complaintStatusSeries,
    escalationBars,
    feedbackBars,
    analyticsSummary,
    topComplaintOrganization,
    attentionItems,
    escalationSummaryCards: [
      { label: 'Open escalations', value: openEscalations, detail: 'Pending and in-progress escalation work' },
      { label: 'Pending', value: Number(normalizedStats.escalationStatusCounts.pending || 0), detail: 'Cases still waiting to be handled' },
      { label: 'Resolved', value: Number(normalizedStats.escalationStatusCounts.resolved || 0), detail: 'Escalations completed in the current feed' },
      { label: 'Rejected', value: Number(normalizedStats.escalationStatusCounts.rejected || 0), detail: 'Escalations closed without approval' }
    ],
    escalationAttentionItems: openEscalations
      ? [
          Number(normalizedStats.escalationStatusCounts.pending || 0) > 0 ? `${Number(normalizedStats.escalationStatusCounts.pending || 0)} escalations are waiting to be picked up.` : null,
          Number(normalizedStats.escalationStatusCounts.in_progress || 0) > Number(normalizedStats.escalationStatusCounts.resolved || 0) ? 'In-progress escalations currently outnumber resolved escalations.' : null
        ].filter(Boolean)
      : ['No open escalations are currently reported.']
  };
};

export const createPublicFeedbackAnalyticsSummary = (stats = {}) => {
  const normalizedStats = transformPublicFeedbackAnalytics(stats);

  return {
    normalizedStats,
    summaryCards: [
      { label: 'Public submissions', value: Number(normalizedStats.total_submissions || 0), detail: 'Responses collected from public QR and link channels.' },
      { label: 'Average rating', value: Number(normalizedStats.average_rating || 0).toFixed(2), detail: 'Average rating across all public organization feedback submissions.' },
      { label: 'Anonymous', value: Number(normalizedStats.anonymous_submissions || 0), detail: 'Submissions sent without identifying details.' }
    ],
    organizationSeries: (normalizedStats.by_organization || []).map((item, index) => ({
      label: item.name,
      value: Number(item.submissions_count || 0),
      tone: ['#183a63', '#335c8a', '#5b587f', '#8a6d2f', '#2f7a6d'][index % 5]
    })),
    monthlyTrend: (normalizedStats.monthly_trend || []).map((item) => ({
      label: item.month_key,
      value: Number(item.count || 0)
    }))
  };
};
