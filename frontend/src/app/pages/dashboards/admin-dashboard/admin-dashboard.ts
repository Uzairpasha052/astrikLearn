import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.scss',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {

   stats = [
    {
      title: 'Total Users',
      value: '1,248',
      change: '+12.5%',
      type: 'users'
    },
    {
      title: 'Total Customers',
      value: '$84,520',
      change: '+8.2%',
      type: 'sales'
    },
    {
      title: 'Total Orders',
      value: '3,642',
      change: '+15.3%',
      type: 'orders'
    },
    {
      title: 'Revenue',
      value: '$124,680',
      change: '+10.8%',
      type: 'revenue'
    }
  ];

  recentUsers = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Sales',
      status: 'Active'
    },
    {
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      role: 'Accountant',
      status: 'Active'
    },
    {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'Sales',
      status: 'Inactive'
    },
    {
      name: 'Emily Davis',
      email: 'emily@example.com',
      role: 'Accountant',
      status: 'Active'
    }
  ];

}
