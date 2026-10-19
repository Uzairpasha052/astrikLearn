import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../../services/customerService/customer-service';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { PaymentService } from '../../../services/paymentService/payment.service';
import { AuthService, UserDisplay } from '../../../services/auth-service';
import { CustomerDto } from '../../../model/Customer.model';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private customerService = inject(CustomerService);
  private invoiceService = inject(InvoiceService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  loading = signal(true);

  users = signal<UserDisplay[]>([]);
  customers = signal<CustomerDto[]>([]);
  invoices = signal<InvoiceDisplayDto[]>([]);

  totalUsers = signal(0);
  totalCustomers = signal(0);
  totalInvoicesCount = signal(0);
  totalRevenue = signal(0);
  totalCollected = signal(0);
  totalOutstanding = signal(0);
  overdueCount = signal(0);

  // Aging buckets
  agingCurrent = signal(0);
  aging1To30 = signal(0);
  aging31To60 = signal(0);
  aging60Plus = signal(0);

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);

    // 1. Load users
    this.authService.getLoginUser(1, 10).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.totalUsers.set(res.totalCount);
      },
      error: () => {}
    });

    // 2. Load customers
    this.customerService.getCustomers(1, 10).subscribe({
      next: (res) => {
        this.customers.set(res.items);
        this.totalCustomers.set(res.totalCount);
      },
      error: () => {}
    });

    // 3. Load invoices & compute financial analytics
    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res) => {
        const items = res.items;
        this.invoices.set(items.slice(0, 6)); // top recent
        this.totalInvoicesCount.set(res.totalCount);

        let rev = 0;
        let col = 0;
        let out = 0;
        let overdue = 0;

        let bCurrent = 0;
        let b130 = 0;
        let b3160 = 0;
        let b60Plus = 0;

        const today = new Date();

        items.forEach((inv) => {
          rev += inv.totalAmount;
          col += inv.amountPaid;
          out += inv.outstandingAmount;

          if (inv.outstandingAmount > 0) {
            const due = new Date(inv.dueDate);
            const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
              bCurrent += inv.outstandingAmount;
            } else if (diffDays <= 30) {
              overdue++;
              b130 += inv.outstandingAmount;
            } else if (diffDays <= 60) {
              overdue++;
              b3160 += inv.outstandingAmount;
            } else {
              overdue++;
              b60Plus += inv.outstandingAmount;
            }
          }
        });

        this.totalRevenue.set(rev);
        this.totalCollected.set(col);
        this.totalOutstanding.set(out);
        this.overdueCount.set(overdue);

        this.agingCurrent.set(bCurrent);
        this.aging1To30.set(b130);
        this.aging31To60.set(b3160);
        this.aging60Plus.set(b60Plus);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Max value for aging chart scale
  maxAgingValue = computed(() => {
    const max = Math.max(
      this.agingCurrent(),
      this.aging1To30(),
      this.aging31To60(),
      this.aging60Plus(),
      1
    );
    return max;
  });

  getAgingHeightPercent(val: number): number {
    const percent = (val / this.maxAgingValue()) * 100;
    return Math.max(6, Math.min(100, Math.round(percent)));
  }

  collectionRate = computed(() => {
    if (this.totalRevenue() === 0) return 0;
    return Math.round((this.totalCollected() / this.totalRevenue()) * 100);
  });
}
