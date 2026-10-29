import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { PaymentService } from '../../../services/paymentService/payment.service';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';
import { PaymentDisplayDto } from '../../../model/Payment.model';
import { ReminderService } from '../../../services/reminderService/reminder.service';
import { StatCard } from '../../../components/stat-card/stat-card';

@Component({
  selector: 'app-accountant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCard],
  templateUrl: './accountant-dashboard.html',
  styleUrl: './accountant-dashboard.scss'
})
export class AccountantDashboard implements OnInit {
  private invoiceService = inject(InvoiceService);
  private paymentService = inject(PaymentService);
  private reminderService = inject(ReminderService);

  loading = signal(true);
  invoices = signal<InvoiceDisplayDto[]>([]);
  payments = signal<PaymentDisplayDto[]>([]);

  totalInvoiced = signal(0);
  totalCollected = signal(0);
  totalOutstanding = signal(0);
  unallocatedCash = signal(0);
  overdueInvoices = signal(0);
  totalReminders = signal(0);

  // Cash Received timeframes ("amount received in 2 days, 1 week, 1 month, 6 months")
  received2Days = signal(0);
  received1Week = signal(0);
  received1Month = signal(0);
  received6Months = signal(0);

  received2DaysCount = signal(0);
  received1WeekCount = signal(0);
  received1MonthCount = signal(0);
  received6MonthsCount = signal(0);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res) => {
        this.invoices.set(res.items.slice(0, 6));

        let invTotal = 0;
        let paidTotal = 0;
        let dueTotal = 0;
        let odCount = 0;

        const today = new Date();

        res.items.forEach((inv) => {
          invTotal += inv.totalAmount;
          paidTotal += inv.amountPaid;
          dueTotal += inv.outstandingAmount;

          if (inv.outstandingAmount > 0) {
            const due = new Date(inv.dueDate);
            const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
              odCount++;
            }
          }
        });

        this.totalInvoiced.set(invTotal);
        this.totalCollected.set(paidTotal);
        this.totalOutstanding.set(dueTotal);
        this.overdueInvoices.set(odCount);

        // Calculate received amounts if payments already loaded or using invoice payments as fallback
        this.calculateReceivedAmounts(this.payments(), res.items);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.paymentService.getPayments(1, 100).subscribe({
      next: (res) => {
        this.payments.set(res.items.slice(0, 5));
        const unallocated = res.items.reduce((sum, p) => sum + p.unallocatedAmount, 0);
        this.unallocatedCash.set(unallocated);

        // Calculate received amounts from payments
        this.calculateReceivedAmounts(res.items, this.invoices());
      },
      error: () => {}
    });

    this.reminderService.getReminders(1, 10).subscribe({
      next: (res) => {
        this.totalReminders.set(res.totalCount);
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

  recoveryRate = computed(() => {
    if (this.totalInvoiced() === 0) return 0;
    return Math.round((this.totalCollected() / this.totalInvoiced()) * 100);
  });
}
