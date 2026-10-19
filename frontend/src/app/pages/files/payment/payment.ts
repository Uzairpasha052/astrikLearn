import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PaymentService } from '../../../services/paymentService/payment.service';
import { CustomerService } from '../../../services/customerService/customer-service';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { AuthService } from '../../../services/auth-service';
import {
  PaymentDisplayDto,
  CreatePaymentDto,
  AllocatePaymentDto
} from '../../../model/Payment.model';
import { CustomerDto } from '../../../model/Customer.model';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';

interface InvoiceAllocationRow {
  invoice: InvoiceDisplayDto;
  allocatedAmount: number;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.scss'
})
export class Payment implements OnInit {
  private paymentService = inject(PaymentService);
  private customerService = inject(CustomerService);
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);

  // Role permissions
  canRecord = this.authService.hasRole('Admin', 'Accountant');

  // State
  payments = signal<PaymentDisplayDto[]>([]);
  customers = signal<CustomerDto[]>([]);
  customerInvoices = signal<InvoiceDisplayDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  allocating = signal(false);

  // Search & Filter
  searchTerm = signal('');
  filterStatus = signal('ALL'); // ALL, UNALLOCATED, FULLY_ALLOCATED

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  // Modals
  showRecordModal = signal(false);
  showAllocateModal = signal(false);
  selectedPayment = signal<PaymentDisplayDto | null>(null);

  // Allocation inputs
  allocationRows = signal<InvoiceAllocationRow[]>([]);

  // Record Payment Form
  paymentForm = this.fb.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    paymentDate: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['Bank Transfer', [Validators.required, Validators.maxLength(50)]],
    referenceNumber: ['', [Validators.maxLength(50)]],
    notes: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.loadPayments();
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.customerService.getCustomers(1, 100).subscribe({
      next: (res) => {
        this.customers.set(res.items.filter((c) => c.isActive));
      },
      error: () => {}
    });
  }

  loadPayments(page: number = 1): void {
    this.loading.set(true);
    this.paymentService.getPayments(page, this.pageSize()).subscribe({
      next: (res) => {
        this.payments.set(res.items);
        this.currentPage.set(res.pageNumber);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to load payments', 'Error');
        this.loading.set(false);
      }
    });
  }

  filteredPayments = computed(() => {
    let list = this.payments();
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.filterStatus();

    if (search) {
      list = list.filter(
        (p) =>
          p.customerName.toLowerCase().includes(search) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(search)) ||
          (p.paymentMethod && p.paymentMethod.toLowerCase().includes(search))
      );
    }

    if (status === 'UNALLOCATED') {
      list = list.filter((p) => p.unallocatedAmount > 0);
    } else if (status === 'FULLY_ALLOCATED') {
      list = list.filter((p) => p.unallocatedAmount <= 0);
    }

    return list;
  });

  // RECORD PAYMENT MODAL
  openRecordModal(): void {
    if (!this.canRecord) return;
    const today = new Date().toISOString().split('T')[0];

    this.paymentForm.reset({
      customerId: this.customers().length > 0 ? this.customers()[0].id : 0,
      paymentDate: today,
      amount: 100,
      paymentMethod: 'Bank Transfer',
      referenceNumber: 'REF-' + Math.floor(100000 + Math.random() * 900000),
      notes: ''
    });

    this.showRecordModal.set(true);
  }

  closeRecordModal(): void {
    this.showRecordModal.set(false);
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.toast.warning('Please check all required payment details.', 'Validation Error');
      return;
    }

    const val = this.paymentForm.getRawValue();
    this.saving.set(true);

    const dto: CreatePaymentDto = {
      customerId: Number(val.customerId),
      paymentDate: val.paymentDate!,
      amount: Number(val.amount),
      paymentMethod: val.paymentMethod || undefined,
      referenceNumber: val.referenceNumber || undefined,
      notes: val.notes || undefined
    };

    this.paymentService.createPayment(dto).subscribe({
      next: (res) => {
        this.toast.success(
          `Payment of $${res.amount.toLocaleString()} recorded for ${res.customerName}!`,
          'Success'
        );
        this.saving.set(false);
        this.closeRecordModal();
        this.loadPayments(this.currentPage());
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to record payment', 'Error');
        this.saving.set(false);
      }
    });
  }

  // ALLOCATION MODAL
  openAllocateModal(p: PaymentDisplayDto): void {
    if (!this.canRecord) return;
    if (p.unallocatedAmount <= 0) {
      this.toast.info('This payment has already been 100% allocated to invoices.', 'Notice');
      return;
    }

    this.selectedPayment.set(p);
    this.allocating.set(true);
    this.allocationRows.set([]);
    this.showAllocateModal.set(true);

    // Fetch invoices for this customer
    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res) => {
        // filter unpaid or partially paid invoices for this customer
        const matching = res.items.filter(
          (inv) => inv.customerId === p.customerId && inv.outstandingAmount > 0
        );

        this.customerInvoices.set(matching);
        this.allocationRows.set(
          matching.map((inv) => ({
            invoice: inv,
            allocatedAmount: 0
          }))
        );
        this.allocating.set(false);
      },
      error: () => {
        this.toast.error('Failed to load customer outstanding invoices', 'Error');
        this.allocating.set(false);
      }
    });
  }

  closeAllocateModal(): void {
    this.showAllocateModal.set(false);
    this.selectedPayment.set(null);
    this.allocationRows.set([]);
  }

  // Auto distribute remaining cash to invoices
  autoAllocate(): void {
    const payment = this.selectedPayment();
    if (!payment) return;

    let available = payment.unallocatedAmount;
    const currentRows = [...this.allocationRows()];

    for (const row of currentRows) {
      if (available <= 0) {
        row.allocatedAmount = 0;
        continue;
      }

      const needed = row.invoice.outstandingAmount;
      const assign = Math.min(available, needed);
      row.allocatedAmount = Math.round(assign * 100) / 100;
      available -= assign;
    }

    this.allocationRows.set(currentRows);
  }

  getTotalAllocatedNow(): number {
    const total = this.allocationRows().reduce(
      (sum, row) => sum + (Number(row.allocatedAmount) || 0),
      0
    );
    return Math.round(total * 100) / 100;
  }

  getRemainingUnallocatedNow(): number {
    const payment = this.selectedPayment();
    if (!payment) return 0;
    const remaining = payment.unallocatedAmount - this.getTotalAllocatedNow();
    return Math.round(remaining * 100) / 100;
  }

  submitAllocations(): void {
    const payment = this.selectedPayment();
    if (!payment) return;

    const activeAllocations = this.allocationRows()
      .filter((row) => Number(row.allocatedAmount) > 0)
      .map((row) => ({
        invoiceId: row.invoice.id,
        allocatedAmount: Number(row.allocatedAmount)
      }));

    if (activeAllocations.length === 0) {
      this.toast.warning('Please enter an allocated amount for at least one invoice.', 'Notice');
      return;
    }

    const totalNow = this.getTotalAllocatedNow();
    if (totalNow > payment.unallocatedAmount) {
      this.toast.error(
        `Allocations ($${totalNow}) exceed payment unallocated balance ($${payment.unallocatedAmount})!`,
        'Constraint Exceeded'
      );
      return;
    }

    // Per-invoice check
    for (const row of this.allocationRows()) {
      if (row.allocatedAmount > row.invoice.outstandingAmount) {
        this.toast.error(
          `Allocation ($${row.allocatedAmount}) exceeds invoice ${row.invoice.invoiceNumber} balance ($${row.invoice.outstandingAmount})!`,
          'Overpayment Error'
        );
        return;
      }
    }

    this.allocating.set(true);
    const dto: AllocatePaymentDto = {
      allocations: activeAllocations
    };

    this.paymentService.allocatePayment(payment.id, dto).subscribe({
      next: (res) => {
        this.toast.success(
          `Allocated $${totalNow.toLocaleString()} across ${res.length} invoice(s)!`,
          'Allocations Settled'
        );
        this.allocating.set(false);
        this.closeAllocateModal();
        this.loadPayments(this.currentPage());
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to allocate payment', 'Error');
        this.allocating.set(false);
      }
    });
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadPayments(p);
    }
  }
}
