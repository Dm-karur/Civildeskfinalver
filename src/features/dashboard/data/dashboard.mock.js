export const dashboardData = {
  kpis: {
    totalProjects: {
      value: "24",
      trend: "+8.4%",
      trendDirection: "up",
      description: "vs last period",
      status: "primary"
    },
    activeProjects: {
      value: "18",
      trend: "3 at risk",
      trendDirection: "down",
      description: "Requires attention",
      status: "warning"
    },
    completedProjects: {
      value: "6",
      trend: "+2",
      trendDirection: "up",
      description: "This month",
      status: "success"
    },
    totalBudget: {
      value: "₹24.8 Cr",
      trend: "73%",
      trendDirection: "up",
      description: "Utilized overall",
      status: "primary"
    },
    overallProgress: {
      value: "68%",
      trend: "+5.2%",
      trendDirection: "up",
      description: "This month",
      status: "primary"
    },
    totalWorkforce: {
      value: "420",
      trend: "95% present",
      trendDirection: "up",
      description: "Across all sites",
      status: "primary"
    }
  },
  
  projectProgress: [
    { name: "Completed", value: 32, fill: "var(--color-primary-dark)" },
    { name: "In Progress", value: 46, fill: "var(--color-primary)" },
    { name: "On Hold", value: 8, fill: "var(--color-primary-light)" },
    { name: "Not Started", value: 10, fill: "var(--color-primary-lighter)" },
    { name: "At Risk", value: 4, fill: "var(--color-slate)" }
  ],
  
  costOverview: [
    { name: "Committed", value: 20.1, fill: "var(--color-primary-light)" },
    { name: "Spent", value: 18.2, fill: "var(--color-primary)" },
    { name: "Remaining", value: 6.6, fill: "var(--color-primary-lighter)" }
  ],

  recentActivity: [
    {
      id: 1,
      type: "submission",
      title: "Material request submitted",
      entity: "Metro Station Construction",
      timestamp: "1 hour ago",
      status: "info"
    },
    {
      id: 2,
      type: "approval",
      title: "BOQ approved",
      entity: "Commercial Complex",
      timestamp: "3 hours ago",
      status: "success"
    },
    {
      id: 3,
      type: "alert",
      title: "Budget exceeded warning",
      entity: "Residential Tower",
      timestamp: "5 hours ago",
      status: "warning"
    },
    {
      id: 4,
      type: "update",
      title: "Labour attendance updated",
      entity: "Highway Project Phase 1",
      timestamp: "1 day ago",
      status: "primary"
    }
  ],

  topProjects: [
    {
      id: "PRJ-001",
      name: "Metro Station Construction",
      progress: 82,
      budget: "₹8.4 Cr",
      status: "in-progress"
    },
    {
      id: "PRJ-002",
      name: "Commercial Complex",
      progress: 68,
      budget: "₹5.2 Cr",
      status: "in-progress"
    },
    {
      id: "PRJ-003",
      name: "Residential Tower",
      progress: 94,
      budget: "₹3.8 Cr",
      status: "completed"
    },
    {
      id: "PRJ-004",
      name: "Highway Project Phase 1",
      progress: 24,
      budget: "₹12.5 Cr",
      status: "at-risk"
    }
  ]
};
