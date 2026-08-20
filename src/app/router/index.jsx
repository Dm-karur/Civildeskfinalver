import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '../../components/layout';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { ProjectsListPage } from '../../features/projects/pages/ProjectsListPage';
import { ClientsListPage } from '../../features/clients/pages/ClientsListPage';
import { CompanyListPage } from '../../features/settings/pages/CompanyListPage';
import { BranchListPage } from '../../features/settings/pages/BranchListPage';
import { UsersListPage } from '../../features/users/pages/UsersListPage';
import { PermissionsPage } from '../../features/permissions/pages/PermissionsPage';
import { ApprovalWorkflowsPage } from '../../features/workflows/pages/ApprovalWorkflowsPage';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { RequirePermission } from '../../components/layout/RequirePermission';
import { ErrorBoundary } from '../../components/layout/ErrorBoundary';

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
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <RequirePermission permission="dashboard.view"><DashboardPage /></RequirePermission>,
          },
          {
            path: 'projects',
            element: <RequirePermission permission="project.view"><ProjectsListPage /></RequirePermission>,
          },
          {
            path: 'project-masters/clients',
            element: <RequirePermission permission="client.view"><ClientsListPage /></RequirePermission>,
          },
          {
            path: 'clients',
            element: <Navigate to="/project-masters/clients" replace />,
          },
          {
            path: 'administration/companies',
            element: <RequirePermission permission="company.view"><CompanyListPage /></RequirePermission>,
          },
          {
            path: 'administration/branches',
            element: <RequirePermission permission="branch.view"><BranchListPage /></RequirePermission>,
          },
          {
            path: 'administration/users',
            element: <RequirePermission permission="user.view"><UsersListPage /></RequirePermission>,
          },
          {
            path: 'administration/roles-permissions',
            element: <RequirePermission permission="role.view"><PermissionsPage /></RequirePermission>,
          },
          {
            path: 'administration/approval-workflows',
            element: <ApprovalWorkflowsPage />,
          },
          {
            path: 'forbidden',
            element: <div className="p-8 text-center text-text-secondary">You do not have permission to access this page.</div>,
          },
          // Redirects for legacy routes
          {
            path: 'settings/company-branch',
            element: <Navigate to="/administration/companies" replace />,
          },
          {
            path: 'settings/users',
            element: <Navigate to="/administration/users" replace />,
          },
          {
            path: 'users',
            element: <Navigate to="/administration/users" replace />,
          },
          {
            path: 'settings/permissions',
            element: <Navigate to="/administration/roles-permissions" replace />,
          },
          {
            path: 'permissions',
            element: <Navigate to="/administration/roles-permissions" replace />,
          },
          {
            path: 'settings/company',
            element: <Navigate to="/administration/companies" replace />,
          },
          {
            path: 'settings/branch',
            element: <Navigate to="/administration/branches" replace />,
          },
          // Placeholders for other routes
          {
            path: '*',
            element: (
              <div className="p-8 flex items-center justify-center text-text-muted h-full">
                This module is under construction.
              </div>
            ),
          },
        ],
      },
    ],
  },
]);
