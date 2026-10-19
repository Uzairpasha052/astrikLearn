import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { CustomerService } from '../../../services/customerService/customer-service';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';
import { CustomerDto } from '../../../model/Customer.model';

@Component({
  selector: 'app-sales-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sales-dashboard.html',
  styleUrl: './sales-dashboard.scss'
})
export class SalesDashboard implements OnInit {
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);

  loading = signal(true);
  invoices = signal<InvoiceDisplayDto[]>([]);
  customers = signal<CustomerDto[]>([]);

  totalSalesValue = signal(0);
  totalInvoicesCount = signal(0);
  activeAccounts = signal(0);
  pendingRevenue = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res) => {
        this.invoices.set(res.items.slice(0, 6));
        this.totalInvoicesCount.set(res.totalCount);

        let total = 0;
        let pending = 0;

        res.items.forEach((i) => {
          total += i.totalAmount;
          pending += i.outstandingAmount;
        });

        this.totalSalesValue.set(total);
        this.pendingRevenue.set(pending);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.customerService.getCustomers(1, 10).subscribe({
      next: (res) => {
        this.customers.set(res.items.filter((c) => c.isActive));
        this.activeAccounts.set(res.totalCount);
      },
      error: () => {}
    });
  }

  avgDealSize = computed(() => {
    if (this.totalInvoicesCount() === 0) return 0;
    return Math.round(this.totalSalesValue() / this.totalInvoicesCount());
  });
}
