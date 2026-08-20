export const mockProjects = [
  { id: '1', code: 'PRJ001', name: 'Metro Station Construction', client: 'Urban Build Pvt. Ltd.', type: 'Infrastructure', status: 'In Progress', startDate: '01-Apr-2024', endDate: '31-Dec-2025', budget: '25,00,00,000' },
  { id: '2', code: 'PRJ002', name: 'Green Valley Residency', client: 'Green Home Developers', type: 'Residential', status: 'In Progress', startDate: '15-Feb-2024', endDate: '15-Oct-2025', budget: '18,75,00,000' },
  { id: '3', code: 'PRJ003', name: 'City Mall Project', client: 'City Developers Ltd.', type: 'Commercial', status: 'On Hold', startDate: '10-Jan-2024', endDate: '10-Jul-2025', budget: '12,50,00,000' },
  { id: '4', code: 'PRJ004', name: 'Bridge Over River Project', client: 'State PWD', type: 'Infrastructure', status: 'In Progress', startDate: '05-Mar-2024', endDate: '05-Sep-2025', budget: '30,00,00,000' },
  { id: '5', code: 'PRJ005', name: 'School Building Construction', client: 'Education Department', type: 'Institutional', status: 'Not Started', startDate: '01-May-2024', endDate: '01-May-2025', budget: '8,50,00,000' },
  { id: '6', code: 'PRJ006', name: 'Warehouse Construction', client: 'LogiSpace Pvt. Ltd.', type: 'Industrial', status: 'In Progress', startDate: '20-Feb-2024', endDate: '20-Dec-2025', budget: '14,20,00,000' },
  { id: '7', code: 'PRJ007', name: 'Road Development Project', client: 'Highways Department', type: 'Infrastructure', status: 'In Progress', startDate: '12-Apr-2024', endDate: '12-Dec-2025', budget: '22,00,00,000' },
  { id: '8', code: 'PRJ008', name: 'Luxury Villa Project', client: 'Dream Homes Pvt. Ltd.', type: 'Residential', status: 'On Hold', startDate: '18-Feb-2024', endDate: '18-Nov-2025', budget: '9,80,00,000' },
  { id: '9', code: 'PRJ009', name: 'Industrial Shed Construction', client: 'Techno Industries', type: 'Industrial', status: 'In Progress', startDate: '25-May-2024', endDate: '25-Sep-2025', budget: '6,75,00,000' },
  { id: '10', code: 'PRJ010', name: 'IT Park Construction', client: 'NextGen Infra Pvt. Ltd.', type: 'Commercial', status: 'Not Started', startDate: '05-Jun-2024', endDate: '05-Jun-2026', budget: '28,50,00,000' },
];

export const projectKpis = {
  totalProjects: {
    value: "24",
    description: "Active Projects",
    status: "primary"
  },
  totalBudget: {
    value: "₹ 175.30 Cr",
    description: "Across All Projects",
    status: "success"
  },
  inProgress: {
    value: "15",
    description: "62.5% of Total",
    status: "info"
  },
  onHold: {
    value: "4",
    description: "16.7% of Total",
    status: "warning"
  },
  notStarted: {
    value: "5",
    description: "20.8% of Total",
    status: "neutral"
  }
};
