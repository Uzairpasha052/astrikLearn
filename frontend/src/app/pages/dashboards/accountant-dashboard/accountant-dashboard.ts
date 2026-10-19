import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { PaymentService } from '../../../services/paymentService/payment.service';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';
import { PaymentDisplayDto } from '../../../model/Payment.model';

@Component({
  selector: 'app-accountant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accountant-dashboard.html',
  styleUrl: './accountant-dashboard.scss'
})
export class AccountantDashboard implements OnInit {
  private invoiceService = inject(InvoiceService);
  private paymentService = inject(PaymentService);

  loading = signal(true);
  invoices = signal<InvoiceDisplayDto[]>([]);
  payments = signal<PaymentDisplayDto[]>([]);

  totalInvoiced = signal(0);
  totalCollected = signal(0);
  totalOutstanding = signal(0);
  unallocatedCash = signal(0);
  overdueInvoices = signal(0);

  // Aging Buckets
  agingCurrent = signal(0);
  aging1To30 = signal(0);
  aging31To60 = signal(0);
  aging60Plus = signal(0);

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

        let b0 = 0;
        let b30 = 0;
        let b60 = 0;
        let b90 = 0;

        const today = new Date();

        res.items.forEach((inv) => {
          invTotal += inv.totalAmount;
          paidTotal += inv.amountPaid;
          dueTotal += inv.outstandingAmount;

          if (inv.outstandingAmount > 0) {
            const due = new Date(inv.dueDate);
            const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
              b0 += inv.outstandingAmount;
            } else if (diffDays <= 30) {
              odCount++;
              b30 += inv.outstandingAmount;
            } else if (diffDays <= 60) {
              odCount++;
              b60 += inv.outstandingAmount;
            } else {
              odCount++;
              b90 += inv.outstandingAmount;
            }
          }
        });

        this.totalInvoiced.set(invTotal);
        this.totalCollected.set(paidTotal);
        this.totalOutstanding.set(dueTotal);
        this.overdueInvoices.set(odCount);

        this.agingCurrent.set(b0);
        this.aging1To30.set(b30);
        this.aging31To60.set(b60);
        this.aging60Plus.set(b90);

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
      },
      error: () => {}
    });
  }

  recoveryRate = computed(() => {
    if (this.totalInvoiced() === 0) return 0;
    return Math.round((this.totalCollected() / this.totalInvoiced()) * 100);
  });
}
