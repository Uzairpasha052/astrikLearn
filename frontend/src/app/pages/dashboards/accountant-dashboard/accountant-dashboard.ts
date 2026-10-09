import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-accountant-dashboard',
  styleUrl: './accountant-dashboard.scss',
  templateUrl: './accountant-dashboard.html',
})
export class AccountantDashboard {

  stats = [
    {
      title: 'Total Revenue',
      value: '$124,680',
      change: '+10.8%'
    },
    {
      title: 'Total Expenses',
      value: '$42,350',
      change: '+4.2%'
    },
    {
      title: 'Pending Invoices',
      value: '38',
      change: '5 new'
    },
    {
      title: 'Net Profit',
      value: '$82,330',
      change: '+12.4%'
    }
  ];

  invoices = [
    {
      invoice: '#INV-1001',
      customer: 'ABC Corporation',
      amount: '$4,500',
      status: 'Paid'
    },
    {
      invoice: '#INV-1002',
      customer: 'XYZ Limited',
      amount: '$2,850',
      status: 'Pending'
    },
    {
      invoice: '#INV-1003',
      customer: 'Global Traders',
      amount: '$7,200',
      status: 'Paid'
    },
    {
      invoice: '#INV-1004',
      customer: 'Tech Solutions',
      amount: '$1,950',
      status: 'Overdue'
    }
  ];

}
