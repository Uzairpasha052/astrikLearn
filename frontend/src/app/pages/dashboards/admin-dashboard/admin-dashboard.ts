import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../../services/customerService/customer-service';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { PaymentService } from '../../../services/paymentService/payment.service';
import { AuthService, UserDisplay } from '../../../services/auth-service';
import { CustomerDto } from '../../../model/Customer.model';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';
import { PaymentDisplayDto } from '../../../model/Payment.model';
import { StatCard } from '../../../components/stat-card/stat-card';

export interface MonthlyTrendItem {
  month: string;
  invoiced: number;
  collected: number;
  invoicedHeight: number;
  collectedHeight: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  amount: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCard],
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
  payments = signal<PaymentDisplayDto[]>([]);

  totalUsers = signal(0);
  totalCustomers = signal(0);
  totalInvoicesCount = signal(0);
  totalRevenue = signal(0);
  totalCollected = signal(0);
  totalOutstanding = signal(0);
  overdueCount = signal(0);

  // Cash Received timeframes ("amount received in 2 days, 1 week, 1 month, 6 months")
  received2Days = signal(0);
  received1Week = signal(0);
  received1Month = signal(0);
  received6Months = signal(0);

  received2DaysCount = signal(0);
  received1WeekCount = signal(0);
  received1MonthCount = signal(0);
  received6MonthsCount = signal(0);

  // Dynamic Chart View State
  activeChartTab = signal<'collections' | 'monthly' | 'status'>('collections');
  monthlyTrend = signal<MonthlyTrendItem[]>([]);
  statusBreakdown = signal<StatusBreakdownItem[]>([]);

  setChartTab(tab: 'collections' | 'monthly' | 'status'): void {
    this.activeChartTab.set(tab);
  }

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
        this.invoices.set(items.slice(0, 6)); // top recent for table
        this.totalInvoicesCount.set(res.totalCount);

        let rev = 0;
        let col = 0;
        let out = 0;
        let overdue = 0;

        const today = new Date();

        // Month grouping map
        const monthMap = new Map<string, { invoiced: number; collected: number }>();
        // Status grouping map
        const statusMap = new Map<string, { count: number; amount: number }>();

        items.forEach((inv) => {
          rev += inv.totalAmount;
          col += inv.amountPaid;
          out += inv.outstandingAmount;

          if (inv.outstandingAmount > 0) {
            const due = new Date(inv.dueDate);
            const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
              overdue++;
            }
          }

          // Monthly aggregation
          const invDate = new Date(inv.invoiceDate);
          const monthKey = isNaN(invDate.getTime())
            ? 'Recent'
            : invDate.toLocaleString('en-US', { month: 'short' });
          const mData = monthMap.get(monthKey) || { invoiced: 0, collected: 0 };
          mData.invoiced += inv.totalAmount;
          mData.collected += inv.amountPaid;
          monthMap.set(monthKey, mData);

          // Status aggregation
          const sKey = inv.status || 'Pending';
          const sData = statusMap.get(sKey) || { count: 0, amount: 0 };
          sData.count++;
          sData.amount += inv.totalAmount;
          statusMap.set(sKey, sData);
        });

        this.totalRevenue.set(rev);
        this.totalCollected.set(col);
        this.totalOutstanding.set(out);
        this.overdueCount.set(overdue);

        // Compute Monthly Trend items
        let maxMonthVal = 1;
        monthMap.forEach((v) => {
          if (v.invoiced > maxMonthVal) maxMonthVal = v.invoiced;
          if (v.collected > maxMonthVal) maxMonthVal = v.collected;
        });

        const trend: MonthlyTrendItem[] = [];
        monthMap.forEach((val, key) => {
          trend.push({
            month: key,
            invoiced: val.invoiced,
            collected: val.collected,
            invoicedHeight: Math.max(8, Math.min(100, Math.round((val.invoiced / maxMonthVal) * 100))),
            collectedHeight: Math.max(8, Math.min(100, Math.round((val.collected / maxMonthVal) * 100)))
          });
        });
        this.monthlyTrend.set(trend);

        // Compute Status Breakdown items
        const colorMap: Record<string, string> = {
          Paid: '#10b981',
          'Partially Paid': '#6366f1',
          Pending: '#f59e0b',
          Overdue: '#ef4444'
        };

        const statuses: StatusBreakdownItem[] = [];
        statusMap.forEach((val, key) => {
          const pct = rev > 0 ? Math.round((val.amount / rev) * 100) : 0;
          statuses.push({
            status: key,
            count: val.count,
            amount: val.amount,
            percent: pct,
            color: colorMap[key] || '#64748b'
          });
        });
        this.statusBreakdown.set(statuses);

        // Calculate received amounts timeline
        this.calculateReceivedAmounts(this.payments(), items);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    // 4. Load payments & compute cash received timeline
    this.paymentService.getPayments(1, 100).subscribe({
      next: (res) => {
        this.payments.set(res.items);
        this.calculateReceivedAmounts(res.items, this.invoices());
      },
      error: () => {}
    });
  }

  calculateReceivedAmounts(paymentsList: PaymentDisplayDto[], invoicesList: InvoiceDisplayDto[]): void {
    let r2 = 0, c2 = 0;
    let r7 = 0, c7 = 0;
    let r30 = 0, c30 = 0;
    let r180 = 0, c180 = 0;

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    if (paymentsList && paymentsList.length > 0) {
      paymentsList.forEach((p) => {
        const amt = Number(p.amount) || 0;
        const pDate = new Date(p.paymentDate);
        if (!isNaN(pDate.getTime())) {
          const pMidnight = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()).getTime();
          const diffDays = Math.floor((todayMidnight - pMidnight) / (1000 * 60 * 60 * 24));

          if (diffDays >= -1) {
            if (diffDays <= 2) {
              r2 += amt;
              c2++;
            }
            if (diffDays <= 7) {
              r7 += amt;
              c7++;
            }
            if (diffDays <= 30) {
              r30 += amt;
              c30++;
            }
            if (diffDays <= 180) {
              r180 += amt;
              c180++;
            }
          }
        }
      });
    } else if (invoicesList && invoicesList.length > 0) {
      invoicesList.forEach((inv) => {
        const amt = Number(inv.amountPaid) || 0;
        if (amt > 0) {
          const invDate = new Date(inv.invoiceDate);
          if (!isNaN(invDate.getTime())) {
            const invMidnight = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate()).getTime();
            const diffDays = Math.floor((todayMidnight - invMidnight) / (1000 * 60 * 60 * 24));

            if (diffDays >= -1) {
              if (diffDays <= 2) {
                r2 += amt;
                c2++;
              }
              if (diffDays <= 7) {
                r7 += amt;
                c7++;
              }
              if (diffDays <= 30) {
                r30 += amt;
                c30++;
              }
              if (diffDays <= 180) {
                r180 += amt;
                c180++;
              }
            }
          }
        }
      });
    }

    this.received2Days.set(r2);
    this.received1Week.set(r7);
    this.received1Month.set(r30);
    this.received6Months.set(r180);

    this.received2DaysCount.set(c2);
    this.received1WeekCount.set(c7);
    this.received1MonthCount.set(c30);
    this.received6MonthsCount.set(c180);
  }

  // Max value for received chart scale
  maxReceivedValue = computed(() => {
    return Math.max(
      this.received6Months(),
      this.received1Month(),
      this.received1Week(),
      this.received2Days(),
      1
    );
  });

  getReceivedHeightPercent(val: number): number {
    if (val <= 0) return 0;
    const percent = (val / this.maxReceivedValue()) * 100;
    return Math.max(12, Math.min(100, Math.round(percent)));
  }

  collectionRate = computed(() => {
    if (this.totalRevenue() === 0) return 0;
    return Math.round((this.totalCollected() / this.totalRevenue()) * 100);
  });
}
