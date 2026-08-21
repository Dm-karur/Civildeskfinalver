import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../../components/layout';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { ProjectsListPage } from '../../features/projects/pages/ProjectsListPage';
import { ProjectCreatePage } from '../../features/projects/pages/ProjectCreatePage';
import { ProjectClientsPage } from '../../features/projects/pages/ProjectClientsPage';
import { ProjectTeamPage } from '../../features/projects/pages/ProjectTeamPage';
import { ProjectOverviewPage } from '../../features/projects/pages/ProjectOverviewPage';
import { ProjectDocumentsPage } from '../../features/projects/pages/ProjectDocumentsPage';
import { ProjectMilestonesPage } from '../../features/projects/pages/ProjectMilestonesPage';
import { ProjectStatusHistoryPage } from '../../features/projects/pages/ProjectStatusHistoryPage';
import { ClientsListPage } from '../../features/clients/pages/ClientsListPage';
import { CompanyListPage } from '../../features/settings/pages/CompanyListPage';
import { BranchListPage } from '../../features/settings/pages/BranchListPage';
import { UsersListPage } from '../../features/users/pages/UsersListPage';
import { PermissionsPage } from '../../features/permissions/pages/PermissionsPage';
import { ApprovalWorkflowsPage } from '../../features/workflows/pages/ApprovalWorkflowsPage';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { RequirePermission } from '../../components/layout/RequirePermission';
import { ErrorBoundary } from '../../components/layout/ErrorBoundary';
// Phase 1 — Sites, Masters, BOQ, Budgets
import { SitesListPage } from '../../features/sites/pages/SitesListPage';
import { SiteZonesPage } from '../../features/sites/pages/SiteZonesPage';
import { WorkLocationsPage } from '../../features/sites/pages/WorkLocationsPage';
import { SiteTeamPage } from '../../features/sites/pages/SiteTeamPage';
import { SiteInstructionsPage } from '../../features/sites/pages/SiteInstructionsPage';
import { SiteDocumentsPage } from '../../features/sites/pages/SiteDocumentsPage';
import { ProjectTypesPage } from '../../features/masters/pages/ProjectTypesPage';
import { FinancialYearsPage } from '../../features/masters/pages/FinancialYearsPage';
import { UnitsOfMeasurementPage } from '../../features/masters/pages/UnitsOfMeasurementPage';
import { WorkCategoriesPage } from '../../features/masters/pages/WorkCategoriesPage';
import { BoqListPage } from '../../features/boq/pages/BoqListPage';
import { BoqSectionsPage } from '../../features/boq/pages/BoqSectionsPage';
import { BoqItemsPage } from '../../features/boq/pages/BoqItemsPage';
import { DrawingTakeoffPage } from '../../features/boq/pages/DrawingTakeoffPage';
import { TakeoffReviewPage } from '../../features/boq/pages/TakeoffReviewPage';
import { ConvertTakeoffPage } from '../../features/boq/pages/ConvertTakeoffPage';
import { BudgetListPage } from '../../features/budgets/pages/BudgetListPage';
import { BudgetRevisionsPage } from '../../features/budgets/pages/BudgetRevisionsPage';
import { BudgetVariationsPage } from '../../features/budgets/pages/BudgetVariationsPage';
import { BudgetApprovalsPage } from '../../features/budgets/pages/BudgetApprovalsPage';
import { PlanningActivitiesPage } from '../../features/planning/pages/PlanningActivitiesPage';
import { WorkProgrammePage } from '../../features/planning/pages/WorkProgrammePage';
import { PlanningBoqMappingPage } from '../../features/planning/pages/PlanningBoqMappingPage';
import { PlannedVsCompletedPage } from '../../features/planning/pages/PlannedVsCompletedPage';
import { LookAheadSchedulePage } from '../../features/planning/pages/LookAheadSchedulePage';
import { MaterialRequirementsPlanningPage } from '../../features/planning/pages/MaterialRequirementsPlanningPage';
import { MaterialForecastPage } from '../../features/planning/pages/MaterialForecastPage';
import { MaterialShortagesPage } from '../../features/planning/pages/MaterialShortagesPage';
import { PlanningAlertsPage } from '../../features/planning/pages/PlanningAlertsPage';
// Phase 2 — Labour & Attendance
import { LabourRegisterPage } from '../../features/labour/pages/LabourRegisterPage';
import { LabourDeploymentPage } from '../../features/labour/pages/LabourDeploymentPage';
import { DailyAttendancePage } from '../../features/labour/pages/DailyAttendancePage';
import { AttendanceExceptionsPage } from '../../features/labour/pages/AttendanceExceptionsPage';
import { LabourTimesheetsPage } from '../../features/labour/pages/LabourTimesheetsPage';
import { LabourOvertimePage } from '../../features/labour/pages/LabourOvertimePage';
import { LabourLeavePage } from '../../features/labour/pages/LabourLeavePage';
import { DailyWagesPage } from '../../features/labour/pages/DailyWagesPage';
import { ManpowerCostPage } from '../../features/labour/pages/ManpowerCostPage';
import { LabourWageApprovalPage } from '../../features/labour/pages/LabourWageApprovalPage';
// Phase 2 — Materials & Inventory
import { MaterialCataloguePage } from '../../features/materials/pages/MaterialCataloguePage';
import { StockOverviewPage } from '../../features/materials/pages/StockOverviewPage';
import { ProjectStockPage } from '../../features/materials/pages/ProjectStockPage';
import { MaterialRequestsPage } from '../../features/materials/pages/MaterialRequestsPage';
import { StockReceiptsPage } from '../../features/materials/pages/StockReceiptsPage';
import { StockIssuesPage } from '../../features/materials/pages/StockIssuesPage';
import { StockTransfersPage } from '../../features/materials/pages/StockTransfersPage';
import { MaterialReturnsPage } from '../../features/materials/pages/MaterialReturnsPage';
import { StockAdjustmentsPage } from '../../features/materials/pages/StockAdjustmentsPage';
import { DeliveryChallansPage } from '../../features/materials/pages/DeliveryChallansPage';
import { MaterialConsumptionPage } from '../../features/materials/pages/MaterialConsumptionPage';
import { StockLedgerPage } from '../../features/materials/pages/StockLedgerPage';
// Phase 2 — Procurement
import { PurchaseRequisitionsPage } from '../../features/procurement/pages/PurchaseRequisitionsPage';
import { RequisitionApprovalPage } from '../../features/procurement/pages/RequisitionApprovalPage';
import { RfqPage } from '../../features/procurement/pages/RfqPage';
import { VendorQuotationsPage } from '../../features/procurement/pages/VendorQuotationsPage';
import { QuotationComparisonPage } from '../../features/procurement/pages/QuotationComparisonPage';
import { PurchaseOrdersPage } from '../../features/procurement/pages/PurchaseOrdersPage';
import { PurchaseOrderApprovalPage } from '../../features/procurement/pages/PurchaseOrderApprovalPage';
import { ProcurementGoodsReceiptPage } from '../../features/procurement/pages/ProcurementGoodsReceiptPage';
import { VendorInvoicesPage } from '../../features/procurement/pages/VendorInvoicesPage';
import { ProcurementReturnsPage } from '../../features/procurement/pages/ProcurementReturnsPage';
import { ProcurementTrackingPage } from '../../features/procurement/pages/ProcurementTrackingPage';
// Phase 2 — Daily Site Operations
import { DailyProgressReportsPage } from '../../features/daily-operations/pages/DailyProgressReportsPage';
import { WorkCompletionPage } from '../../features/daily-operations/pages/WorkCompletionPage';
import { SiteMeasurementsPage } from '../../features/daily-operations/pages/SiteMeasurementsPage';
import { DailyManpowerPage } from '../../features/daily-operations/pages/DailyManpowerPage';
import { DailyEquipmentPage } from '../../features/daily-operations/pages/DailyEquipmentPage';
import { DailyMaterialsPage } from '../../features/daily-operations/pages/DailyMaterialsPage';
import { DailyIssuesPage } from '../../features/daily-operations/pages/DailyIssuesPage';
import { DailyPhotosPage } from '../../features/daily-operations/pages/DailyPhotosPage';
import { DailyApprovalsPage } from '../../features/daily-operations/pages/DailyApprovalsPage';
import { DailyHistoryPage } from '../../features/daily-operations/pages/DailyHistoryPage';
// Phase 2 — Subcontract Management
import { SubcontractorsPage } from '../../features/subcontracts/pages/SubcontractorsPage';
import { WorkOrdersPage } from '../../features/subcontracts/pages/WorkOrdersPage';
import { WorkOrderApprovalPage } from '../../features/subcontracts/pages/WorkOrderApprovalPage';
import { SubcontractMeasurementsPage } from '../../features/subcontracts/pages/SubcontractMeasurementsPage';
import { PaymentCertificatesPage } from '../../features/subcontracts/pages/PaymentCertificatesPage';
import { SubcontractRABillsPage } from '../../features/subcontracts/pages/SubcontractRABillsPage';
import { RABillApprovalPage } from '../../features/subcontracts/pages/RABillApprovalPage';
import { SubcontractPaymentsPage } from '../../features/subcontracts/pages/SubcontractPaymentsPage';
import { PackageCompletionPage } from '../../features/subcontracts/pages/PackageCompletionPage';
import { RetentionLedgerPage } from '../../features/subcontracts/pages/RetentionLedgerPage';
// Phase 3 — Client Billing & Receivables
import { ClientContractsPage } from '../../features/receivables/pages/ClientContractsPage';
import { ContractValuesPage } from '../../features/receivables/pages/ContractValuesPage';
import { ClientAdvancesPage } from '../../features/receivables/pages/ClientAdvancesPage';
import { AdvanceApprovalPage } from '../../features/receivables/pages/AdvanceApprovalPage';
import { ClientInvoicesPage } from '../../features/receivables/pages/ClientInvoicesPage';
import { ProgressBillingPage } from '../../features/receivables/pages/ProgressBillingPage';
import { ClientReceiptsPage } from '../../features/receivables/pages/ClientReceiptsPage';
import { ReceiptAllocationsPage } from '../../features/receivables/pages/ReceiptAllocationsPage';
import { OutstandingReceivablesPage } from '../../features/receivables/pages/OutstandingReceivablesPage';
import { ClientRetentionPage } from '../../features/receivables/pages/ClientRetentionPage';
import { ClientStatementsPage } from '../../features/receivables/pages/ClientStatementsPage';
// Phase 3 — Finance & Cost Control
import { ExpenseRequestsPage, ExpenseBillsPage, ExpensePaymentsPage, ProjectCostSummaryPage } from '../../features/finance/pages/FinancePages';
// Phase 3 — Reports & Analytics
import { ProjectProgressReportPage, BudgetVsActualReportPage, MaterialReportPage, ExpenseReportPage } from '../../features/reports/pages/ReportPages';
import { SubcontractReportPage } from '../../features/reports/pages/SubcontractReportPage';
import { LabourReportPage } from '../../features/reports/pages/LabourReportPage';
// Phase 2/3 — Additional Masters
import { LabourCategoriesPage, LabourContractorsPage } from '../../features/masters/pages/LabourMasterPages';
import { MaterialCategoriesPage, SuppliersPage, ExpenseCategoriesPage } from '../../features/masters/pages/MaterialProcurementMasterPages';
// Phase 3 — Admin
import { AuditLogsPage } from '../../features/settings/pages/AuditLogsPage';

const R = (permission, Component) => <RequirePermission permission={permission}><Component /></RequirePermission>;

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          // ─── Dashboard ───────────────────────────────────
          { path: 'dashboard', element: R('dashboard.view', DashboardPage) },
          { path: 'dashboards/projects', element: R('dashboard.view', DashboardPage) },
          { path: 'dashboards/sites', element: R('dashboard.view', DashboardPage) },
          { path: 'dashboards/finance', element: R('dashboard.view', DashboardPage) },
          { path: 'alerts', element: R('dashboard.view', DashboardPage) },

          // ─── 1. Projects ─────────────────────────────────
          { path: 'projects', element: R('project.view', ProjectsListPage) },
          { path: 'projects/new', element: R('project.create', ProjectCreatePage) },
          { path: 'projects/clients', element: R('project.view', ProjectClientsPage) },
          { path: 'projects/team', element: R('project.view', ProjectTeamPage) },
          { path: 'projects/overview', element: R('project.view', ProjectOverviewPage) },
          { path: 'projects/documents', element: R('project.view', ProjectDocumentsPage) },
          { path: 'projects/milestones', element: R('project.view', ProjectMilestonesPage) },
          { path: 'projects/status-history', element: R('project.view', ProjectStatusHistoryPage) },
          { path: 'project-masters/clients', element: R('client.view', ClientsListPage) },
          { path: 'clients', element: <Navigate to="/project-masters/clients" replace /> },

          // ─── 2. Sites & Locations ─────────────────────────
          { path: 'sites', element: R('site.view', SitesListPage) },
          { path: 'sites/zones', element: R('site.view', SiteZonesPage) },
          { path: 'sites/work-locations', element: R('site.view', WorkLocationsPage) },
          { path: 'sites/team', element: R('site.view', SiteTeamPage) },
          { path: 'sites/instructions', element: R('site.view', SiteInstructionsPage) },
          { path: 'sites/documents', element: R('site.view', SiteDocumentsPage) },
          { path: 'project-masters/sites', element: R('site.view', SitesListPage) },

          // ─── 3. BOQ & Project Budget ─────────────────────
          { path: 'project-boqs', element: R('boq.view', BoqListPage) },
          { path: 'boq', element: R('boq.view', BoqListPage) },
          { path: 'boq/sections', element: R('boq.view', BoqSectionsPage) },
          { path: 'boq/items', element: R('boq.view', BoqItemsPage) },
          { path: 'project-budgets', element: R('budget.view', BudgetListPage) },
          { path: 'budgets', element: R('budget.view', BudgetListPage) },
          { path: 'budgets/revisions', element: R('budget.view', BudgetRevisionsPage) },
          { path: 'budgets/variations', element: R('budget.view', BudgetVariationsPage) },
          { path: 'budgets/approvals', element: R('budget.view', BudgetApprovalsPage) },
          { path: 'takeoff', element: R('boq.view', DrawingTakeoffPage) },
          { path: 'takeoff/review', element: R('boq.view', TakeoffReviewPage) },
          { path: 'takeoff/convert', element: R('boq.view', ConvertTakeoffPage) },
          // ─── 4. Project Planning ─────────────────────────
          { path: 'planning/activities', element: R('planning.view', PlanningActivitiesPage) },
          { path: 'planning/work-programme', element: R('planning.view', WorkProgrammePage) },
          { path: 'planning/boq-mapping', element: R('planning.view', PlanningBoqMappingPage) },
          { path: 'planning/planned-vs-completed', element: R('planning.view', PlannedVsCompletedPage) },
          { path: 'planning/look-ahead', element: R('planning.view', LookAheadSchedulePage) },
          { path: 'planning/material-requirements', element: R('planning.view', MaterialRequirementsPlanningPage) },
          { path: 'planning/material-forecast', element: R('planning.view', MaterialForecastPage) },
          { path: 'planning/shortages', element: R('planning.view', MaterialShortagesPage) },
          { path: 'planning/alerts', element: R('planning.view', PlanningAlertsPage) },

          // ─── 5. Labour & Attendance ───────────────────────
          { path: 'labour', element: R('labour.view', LabourRegisterPage) },
          { path: 'labour/deployment', element: R('labour.view', LabourDeploymentPage) },
          { path: 'labour/attendance', element: R('attendance.view', DailyAttendancePage) },
          { path: 'labour/attendance-exceptions', element: R('attendance.view', AttendanceExceptionsPage) },
          { path: 'labour/timesheets', element: R('attendance.view', LabourTimesheetsPage) },
          { path: 'labour/overtime', element: R('attendance.view', LabourOvertimePage) },
          { path: 'labour/leave', element: R('attendance.view', LabourLeavePage) },
          { path: 'labour/wages', element: R('wages.view', DailyWagesPage) },
          { path: 'labour/manpower-cost', element: R('wages.view', ManpowerCostPage) },
          { path: 'labour/wage-approval', element: R('wages.approve', LabourWageApprovalPage) },

          // ─── 6. Materials & Inventory ─────────────────────
          { path: 'materials/catalogue', element: R('materials.view', MaterialCataloguePage) },
          { path: 'materials/stock', element: R('material_stock.view', StockOverviewPage) },
          { path: 'materials/project-stock', element: R('material_stock.view', ProjectStockPage) },
          { path: 'materials/requests', element: R('materials.view', MaterialRequestsPage) },
          { path: 'materials/receipts', element: R('material_receipts.view', StockReceiptsPage) },
          { path: 'materials/issues', element: R('material_stock.view', StockIssuesPage) },
          { path: 'materials/transfers', element: R('material_stock.view', StockTransfersPage) },
          { path: 'materials/returns', element: R('material_stock.view', MaterialReturnsPage) },
          { path: 'materials/adjustments', element: R('material_stock.view', StockAdjustmentsPage) },
          { path: 'materials/delivery-challans', element: R('material_stock.view', DeliveryChallansPage) },
          { path: 'materials/consumption', element: R('materials.view', MaterialConsumptionPage) },
          { path: 'materials/ledger', element: R('material_stock.view', StockLedgerPage) },

          // ─── 7. Procurement ───────────────────────────────
          { path: 'procurement/requisitions', element: R('purchase_orders.view', PurchaseRequisitionsPage) },
          { path: 'procurement/requisition-approval', element: R('purchase_orders.approve', RequisitionApprovalPage) },
          { path: 'procurement/rfq', element: R('purchase_orders.view', RfqPage) },
          { path: 'procurement/quotations', element: R('purchase_orders.view', VendorQuotationsPage) },
          { path: 'procurement/comparison', element: R('purchase_orders.view', QuotationComparisonPage) },
          { path: 'procurement/purchase-orders', element: R('purchase_orders.view', PurchaseOrdersPage) },
          { path: 'procurement/purchase-order-approval', element: R('purchase_orders.approve', PurchaseOrderApprovalPage) },
          { path: 'procurement/goods-receipt', element: R('material_receipts.view', ProcurementGoodsReceiptPage) },
          { path: 'procurement/vendor-invoices', element: R('purchase_orders.view', VendorInvoicesPage) },
          { path: 'procurement/returns', element: R('purchase_orders.view', ProcurementReturnsPage) },
          { path: 'procurement/tracking', element: R('purchase_orders.view', ProcurementTrackingPage) },

          // ─── 8. Daily Site Operations ─────────────────────
          { path: 'daily-operations/reports', element: R('daily_reports.view', DailyProgressReportsPage) },
          { path: 'daily-operations/completion', element: R('work_progress.record', WorkCompletionPage) },
          { path: 'daily-operations/measurements', element: R('measurements.view', SiteMeasurementsPage) },
          { path: 'daily-operations/manpower', element: R('daily_reports.view', DailyManpowerPage) },
          { path: 'daily-operations/equipment', element: R('daily_reports.view', DailyEquipmentPage) },
          { path: 'daily-operations/materials', element: R('daily_reports.view', DailyMaterialsPage) },
          { path: 'daily-operations/issues', element: R('site_issues.view', DailyIssuesPage) },
          { path: 'daily-operations/photos', element: R('site_photos.manage', DailyPhotosPage) },
          { path: 'daily-operations/approvals', element: R('daily_reports.approve', DailyApprovalsPage) },
          { path: 'daily-operations/history', element: R('daily_reports.view', DailyHistoryPage) },

          // ─── 9. Subcontract Management ────────────────────
          { path: 'subcontracts/subcontractors', element: R('subcontractors.view', SubcontractorsPage) },
          { path: 'subcontracts/work-orders', element: R('work_orders.view', WorkOrdersPage) },
          { path: 'subcontracts/work-order-approval', element: R('work_orders.approve', WorkOrderApprovalPage) },
          { path: 'subcontracts/measurements', element: R('measurements.view', SubcontractMeasurementsPage) },
          { path: 'subcontracts/certificates', element: R('measurements.view', PaymentCertificatesPage) },
          { path: 'subcontracts/ra-bills', element: R('ra_bills.view', SubcontractRABillsPage) },
          { path: 'subcontracts/bill-approval', element: R('ra_bills.certify', RABillApprovalPage) },
          { path: 'subcontracts/payments', element: R('payments.view', SubcontractPaymentsPage) },
          { path: 'subcontracts/completion', element: R('work_progress.view', PackageCompletionPage) },
          { path: 'subcontracts/retention', element: R('ra_bills.view', RetentionLedgerPage) },
          { path: 'reports/subcontracts', element: R('report.view', SubcontractReportPage) },

          // ─── 10. Client Billing & Receivables ─────────────
          { path: 'receivables/contracts', element: R('client.view', ClientContractsPage) },
          { path: 'receivables/contract-values', element: R('client.view', ContractValuesPage) },
          { path: 'receivables/advances', element: R('payments.view', ClientAdvancesPage) },
          { path: 'receivables/advance-approval', element: R('payments.approve', AdvanceApprovalPage) },
          { path: 'receivables/invoices', element: R('payments.view', ClientInvoicesPage) },
          { path: 'receivables/progress-billing', element: R('payments.view', ProgressBillingPage) },
          { path: 'receivables/receipts', element: R('payments.view', ClientReceiptsPage) },
          { path: 'receivables/allocations', element: R('payments.view', ReceiptAllocationsPage) },
          { path: 'receivables/outstanding', element: R('cashflow.view', OutstandingReceivablesPage) },
          { path: 'receivables/retention', element: R('cashflow.view', ClientRetentionPage) },
          { path: 'receivables/statements', element: R('report.view', ClientStatementsPage) },

          // ─── 11. Finance & Cost Control ───────────────────
          { path: 'finance/project-cost', element: R('project_cost.view', ProjectCostSummaryPage) },
          { path: 'finance/budget-vs-actual', element: R('budget.view', BudgetVsActualReportPage) },
          { path: 'finance/material-costs', element: R('project_cost.view', MaterialReportPage) },
          { path: 'finance/labour-costs', element: R('wages.view', LabourReportPage) },
          { path: 'finance/subcontract-costs', element: R('project_cost.view', SubcontractReportPage) },
          { path: 'finance/equipment-costs', element: R('project_cost.view', ProjectCostSummaryPage) },
          { path: 'finance/other-expenses', element: R('expenses.view', ExpenseRequestsPage) },
          { path: 'finance/income', element: R('cashflow.view', ExpensePaymentsPage) },
          { path: 'finance/expenses', element: R('expenses.view', ExpenseBillsPage) },
          { path: 'finance/vendor-payables', element: R('expense_payments.view', ExpenseBillsPage) },
          { path: 'finance/payments', element: R('expense_payments.view', ExpensePaymentsPage) },
          { path: 'finance/profitability', element: R('project_cost.view', ProjectCostSummaryPage) },
          { path: 'finance/cash-flow', element: R('cashflow.view', ProjectCostSummaryPage) },

          // ─── 12. Reports & Analytics ─────────────────────
          { path: 'reports/project-progress', element: R('report.view', ProjectProgressReportPage) },
          { path: 'reports/boq-progress', element: R('report.view', ProjectProgressReportPage) },
          { path: 'reports/budget-vs-actual', element: R('report.view', BudgetVsActualReportPage) },
          { path: 'reports/material-consumption', element: R('report.view', MaterialReportPage) },
          { path: 'reports/material-shortage', element: R('report.view', MaterialReportPage) },
          { path: 'reports/labour-deployment', element: R('report.view', LabourReportPage) },
          { path: 'reports/labour-cost', element: R('report.view', LabourReportPage) },
          { path: 'reports/labour', element: R('report.view', LabourReportPage) },
          { path: 'reports/subcontracts', element: R('report.view', SubcontractReportPage) },
          { path: 'reports/client-receivables', element: R('report.view', ExpenseReportPage) },
          { path: 'reports/vendor-payables', element: R('report.view', ExpenseReportPage) },
          { path: 'reports/project-profitability', element: R('report.view', ProjectCostSummaryPage) },
          { path: 'reports/daily-site', element: R('report.view', ProjectProgressReportPage) },
          { path: 'reports/management-summary', element: R('management_review.view', ProjectProgressReportPage) },

          // ─── Communication ───────────────────────────────
          { path: 'communication/project-messages', element: R('dashboard.view', DashboardPage) },
          { path: 'communication/client-updates', element: R('dashboard.view', DashboardPage) },
          { path: 'communication/documents', element: R('project.view', ProjectsListPage) },
          { path: 'communication/approvals', element: <ApprovalWorkflowsPage /> },
          { path: 'communication/whatsapp', element: R('activity_log.view', AuditLogsPage) },
          { path: 'communication/email', element: R('activity_log.view', AuditLogsPage) },

          // ─── Client Portal ───────────────────────────────
          { path: 'client-portal/users', element: R('user.view', UsersListPage) },
          { path: 'client-portal/access', element: R('user.view', UsersListPage) },
          { path: 'client-portal/projects', element: R('project.view', ProjectsListPage) },
          { path: 'client-portal/documents', element: R('project.view', ProjectsListPage) },
          { path: 'client-portal/approvals', element: <ApprovalWorkflowsPage /> },
          { path: 'client-portal/communications', element: R('client.view', ClientsListPage) },

          // ─── Masters — Project ───────────────────────────
          { path: 'project-masters/clients', element: R('client.view', ClientsListPage) },
          { path: 'masters/project-types', element: R('project.view', ProjectTypesPage) },
          { path: 'masters/project-statuses', element: R('master.view', ProjectTypesPage) },
          { path: 'masters/financial-years', element: R('financial_year.view', FinancialYearsPage) },
          { path: 'masters/units', element: R('master.view', UnitsOfMeasurementPage) },
          { path: 'masters/work-categories', element: R('master.view', WorkCategoriesPage) },

          // ─── Masters — Labour ────────────────────────────
          { path: 'masters/labour-types', element: R('labour.view', LabourCategoriesPage) },
          { path: 'masters/labour-categories', element: R('labour.view', LabourCategoriesPage) },
          { path: 'masters/trades', element: R('labour.view', LabourCategoriesPage) },
          { path: 'masters/wage-rates', element: R('wages.view', LabourCategoriesPage) },
          { path: 'masters/crews', element: R('labour.view', LabourContractorsPage) },

          // ─── Masters — Materials & Procurement ───────────
          { path: 'masters/material-categories', element: R('materials.view', MaterialCategoriesPage) },
          { path: 'masters/materials', element: R('materials.view', MaterialCataloguePage) },
          { path: 'masters/brands', element: R('materials.view', MaterialCategoriesPage) },
          { path: 'masters/material-units', element: R('materials.view', UnitsOfMeasurementPage) },
          { path: 'masters/warehouses', element: R('material_stock.view', MaterialCategoriesPage) },
          { path: 'masters/vendors', element: R('purchase_orders.view', SuppliersPage) },
          { path: 'masters/payment-terms', element: R('master.view', WorkCategoriesPage) },
          { path: 'masters/tax-rates', element: R('master.view', WorkCategoriesPage) },

          // ─── Masters — Finance ───────────────────────────
          { path: 'masters/expense-categories', element: R('expenses.view', ExpenseCategoriesPage) },
          { path: 'masters/income-categories', element: R('master.view', ExpenseCategoriesPage) },
          { path: 'masters/banks', element: R('master.view', ExpenseCategoriesPage) },
          { path: 'masters/accounts', element: R('master.view', ExpenseCategoriesPage) },
          { path: 'masters/cost-heads', element: R('master.view', ExpenseCategoriesPage) },

          // ─── Administration ──────────────────────────────
          { path: 'administration/companies', element: R('company.view', CompanyListPage) },
          { path: 'administration/branches', element: R('branch.view', BranchListPage) },
          { path: 'administration/users', element: R('user.view', UsersListPage) },
          { path: 'administration/roles-permissions', element: R('role.view', PermissionsPage) },
          { path: 'administration/approval-workflows', element: <ApprovalWorkflowsPage /> },
          { path: 'administration/numbering', element: R('settings.view', AuditLogsPage) },
          { path: 'administration/notifications', element: R('settings.view', AuditLogsPage) },
          { path: 'administration/email', element: R('settings.view', AuditLogsPage) },
          { path: 'administration/whatsapp', element: R('settings.view', AuditLogsPage) },
          { path: 'administration/audit-logs', element: R('activity_log.view', AuditLogsPage) },
          { path: 'administration/system-settings', element: R('settings.view', AuditLogsPage) },

          // ─── Utility ─────────────────────────────────────
          { path: 'forbidden', element: <div className="p-8 text-center text-text-secondary">You do not have permission to access this page.</div> },
          // Legacy redirects
          { path: 'settings/company-branch', element: <Navigate to="/administration/companies" replace /> },
          { path: 'settings/users', element: <Navigate to="/administration/users" replace /> },
          { path: 'users', element: <Navigate to="/administration/users" replace /> },
          { path: 'settings/permissions', element: <Navigate to="/administration/roles-permissions" replace /> },
          { path: 'permissions', element: <Navigate to="/administration/roles-permissions" replace /> },
          { path: 'settings/company', element: <Navigate to="/administration/companies" replace /> },
          { path: 'settings/branch', element: <Navigate to="/administration/branches" replace /> },
          // Catch-all
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
