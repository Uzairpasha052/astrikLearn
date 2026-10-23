import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AdminDashboard } from './pages/dashboards/admin-dashboard/admin-dashboard';
import { AccountantDashboard } from './pages/dashboards/accountant-dashboard/accountant-dashboard';
import { SalesDashboard } from './pages/dashboards/sales-dashboard/sales-dashboard';
import { DashboardLayout } from './pages/layout/dashboard-layout/dashboard-layout';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { NotFound } from './pages/not-found/not-found';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role/role-guard';
import { User } from './pages/files/user/user';
import { Customer } from './pages/files/customer/customer';
import { Invoice } from './pages/files/invoice/invoice';
import { Payment } from './pages/files/payment/payment';
import { Reminder } from './pages/files/reminder/reminder';
import { Intelligence } from './pages/files/intelligence/intelligence';
import { AuditLogComponent } from './pages/files/audit-log/audit-log';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'unauthorized',
    component: Unauthorized
  },

  // Common Protected Core Operations
  {
    path: 'invoices',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin', 'Accountant', 'Sales']
    },
    children: [
      {
        path: '',
        component: Invoice
      }
    ]
  },
  {
    path: 'payments',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin', 'Accountant', 'Sales']
    },
    children: [
      {
        path: '',
        component: Payment
      }
    ]
  },
  {
    path: 'customers',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin', 'Accountant', 'Sales']
    },
    children: [
      {
        path: '',
        component: Customer
      }
    ]
  },
  {
    path: 'reminders',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin', 'Accountant', 'Sales']
    },
    children: [
      {
        path: '',
        component: Reminder
      }
    ]
  },
  {
    path: 'intelligence',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin', 'Accountant', 'Sales']
    },
    children: [
      {
        path: '',
        component: Intelligence
      }
    ]
  },
  {
    path: 'audit-logs',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin']
    },
    children: [
      {
        path: '',
        component: AuditLogComponent
      }
    ]
  },

  // Admin Protected Routes
  {
    path: 'admin',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Admin']
    },
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard
      },
      {
        path: 'register',
        component: Register
      },
      {
        path: 'users',
        component: User
      },
      {
        path: 'audit-logs',
        component: AuditLogComponent
      }
    ]
  },

  // Accountant Protected Routes
  {
    path: 'accountant',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Accountant']
    },
    children: [
      {
        path: 'dashboard',
        component: AccountantDashboard
      }
    ]
  },

  // Sales Protected Routes
  {
    path: 'sales',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['Sales']
    },
    children: [
      {
        path: 'dashboard',
        component: SalesDashboard
      }
    ]
  },

  // Fallback 404
  {
    path: '**',
    component: NotFound
  }
];
