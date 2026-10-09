import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-sales-dashboard',
  styleUrl: './sales-dashboard.scss',
  templateUrl: './sales-dashboard.html',
})
export class SalesDashboard {

  stats = [
    {
      title: 'Total Sales',
      value: '$84,520',
      change: '+18.2%'
    },
    {
      title: 'New Leads',
      value: '186',
      change: '+24.5%'
    },
    {
      title: 'Customers',
      value: '842',
      change: '+12.8%'
    },
    {
      title: 'Deals Won',
      value: '64',
      change: '+15.4%'
    }
  ];

  deals = [
    {
      customer: 'ABC Corporation',
      deal: 'Enterprise Plan',
      value: '$12,500',
      status: 'Won'
    },
    {
      customer: 'Tech Solutions',
      deal: 'Business Plan',
      value: '$7,800',
      status: 'Negotiation'
    },
    {
      customer: 'Global Traders',
      deal: 'Enterprise Plan',
      value: '$15,200',
      status: 'Won'
    },
    {
      customer: 'XYZ Limited',
      deal: 'Starter Plan',
      value: '$3,200',
      status: 'Pending'
    }
  ];
  
}
