import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { CustomerService } from '../../../services/customerService/customer-service';
import { AuthService } from '../../../services/auth-service';
import { IntelligenceService } from '../../../services/intelligenceService/intelligence.service';
import { InvoiceDisplayDto, CreateInvoiceDto, UpdateInvoiceDto } from '../../../model/Invoice.model';
import { CustomerDto } from '../../../model/Customer.model';
import { RiskEvaluation } from '../../../model/Intelligence.model';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './invoice.html',
  styleUrl: './invoice.scss'
})
export class Invoice implements OnInit {
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private intelligenceService = inject(IntelligenceService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);

  // Role permissions
  canCreate = this.authService.hasRole('Admin', 'Accountant', 'Sales');
  canEditDelete = this.authService.hasRole('Admin', 'Accountant');

  // State signals
  invoices = signal<InvoiceDisplayDto[]>([]);
  customers = signal<CustomerDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  deletingId = signal<number | null>(null);

  // Search & Filters
  searchTerm = signal('');
  selectedStatus = signal('ALL');
  selectedAging = signal('ALL');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  // Modals & Panels
  showFormModal = signal(false);
  showDetailModal = signal(false);
  showAiModal = signal(false);
  showDeleteModal = signal(false);

  editingInvoiceId = signal<number | null>(null);
  selectedInvoice = signal<InvoiceDisplayDto | null>(null);
  selectedAiRisk = signal<RiskEvaluation | null>(null);
  invoiceToDelete = signal<InvoiceDisplayDto | null>(null);

  // Form definition
  invoiceForm = this.fb.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    invoiceDate: ['', [Validators.required]],
    dueDate: ['', [Validators.required]],
    items: this.fb.array([])
  });

  get itemsFormArray(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.loadInvoices();
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

  loadInvoices(page: number = 1): void {
    this.loading.set(true);
    this.invoiceService.getInvoices(page, this.pageSize()).subscribe({
      next: (res) => {
        this.invoices.set(res.items);
        this.currentPage.set(res.pageNumber);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to load invoices', 'Error');
        this.loading.set(false);
      }
    });
  }

  // Filtered invoices based on search, status & aging
  filteredInvoices = computed(() => {
    let list = this.invoices();
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();
    const aging = this.selectedAging();

    if (search) {
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(search) ||
          inv.customerName.toLowerCase().includes(search)
      );
    }

    if (status !== 'ALL') {
      list = list.filter((inv) => inv.status.toLowerCase() === status.toLowerCase());
    }

    if (aging !== 'ALL') {
      list = list.filter((inv) => this.getAgingBucket(inv) === aging);
    }

    return list;
  });

  // Calculate Aging Bucket
  getAgingBucket(inv: InvoiceDisplayDto): string {
    if (inv.status.toLowerCase() === 'paid') return 'Paid';
    const today = new Date();
    const due = new Date(inv.dueDate);
    const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Current';
    if (diffDays <= 30) return '1-30 Days';
    if (diffDays <= 60) return '31-60 Days';
    return '60+ Days';
  }

  getAgingClass(inv: InvoiceDisplayDto): string {
    const bucket = this.getAgingBucket(inv);
    switch (bucket) {
      case 'Paid':
        return 'aging-paid';
      case 'Current':
        return 'aging-current';
      case '1-30 Days':
        return 'aging-warning';
      case '31-60 Days':
        return 'aging-danger';
      case '60+ Days':
        return 'aging-critical';
      default:
        return '';
    }
  }

  // Multi-line Items Form Handlers
  addItem(desc: string = '', qty: number = 1, price: number = 0): void {
    const itemGroup = this.fb.group({
      description: [desc, [Validators.required, Validators.maxLength(300)]],
      quantity: [qty, [Validators.required, Validators.min(0.01)]],
      unitPrice: [price, [Validators.required, Validators.min(0.01)]]
    });
    this.itemsFormArray.push(itemGroup);
  }

  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    } else {
      this.toast.warning('An invoice must contain at least one line item', 'Notice');
    }
  }

  getItemLineTotal(index: number): number {
    const group = this.itemsFormArray.at(index);
    if (!group) return 0;
    const qty = Number(group.get('quantity')?.value) || 0;
    const price = Number(group.get('unitPrice')?.value) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  getCalculatedGrandTotal(): number {
    let total = 0;
    for (let i = 0; i < this.itemsFormArray.length; i++) {
      total += this.getItemLineTotal(i);
    }
    return Math.round(total * 100) / 100;
  }

  // Modal actions
  openCreateModal(): void {
    if (!this.canCreate) return;
    this.editingInvoiceId.set(null);
    this.itemsFormArray.clear();

    const todayStr = new Date().toISOString().split('T')[0];
    const dueStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    this.invoiceForm.reset({
      customerId: this.customers().length > 0 ? this.customers()[0].id : 0,
      invoiceDate: todayStr,
      dueDate: dueStr
    });

    this.addItem('Consulting / Service Fee', 1, 100);
    this.showFormModal.set(true);
  }

  openEditModal(inv: InvoiceDisplayDto): void {
    if (!this.canEditDelete) return;
    if (inv.amountPaid > 0) {
      this.toast.error(
        'Invoices with recorded payments cannot be modified per audit rules.',
        'Action Restricted'
      );
      return;
    }

    this.editingInvoiceId.set(inv.id);
    this.itemsFormArray.clear();

    this.invoiceForm.patchValue({
      customerId: inv.customerId,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate
    });

    if (inv.items && inv.items.length > 0) {
      inv.items.forEach((item) => {
        this.addItem(item.description, item.quantity, item.unitPrice);
      });
    } else {
      this.addItem('Line Item', 1, inv.totalAmount);
    }

    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingInvoiceId.set(null);
  }

  submitInvoice(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.toast.warning('Please fill in all required fields properly.', 'Validation Error');
      return;
    }

    const formVal = this.invoiceForm.getRawValue();
    if (new Date(formVal.dueDate!) < new Date(formVal.invoiceDate!)) {
      this.toast.error('Due date cannot be earlier than invoice date', 'Validation Error');
      return;
    }

    if (this.itemsFormArray.length === 0) {
      this.toast.warning('Please add at least one line item', 'Notice');
      return;
    }

    this.saving.set(true);
    const id = this.editingInvoiceId();

    const payload: CreateInvoiceDto = {
      customerId: Number(formVal.customerId),
      invoiceDate: formVal.invoiceDate!,
      dueDate: formVal.dueDate!,
      items: (formVal.items as any[]).map((it) => ({
        description: it.description.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice)
      }))
    };

    const action$ =
      id === null
        ? this.invoiceService.createInvoice(payload)
        : this.invoiceService.updateInvoice(id, payload as UpdateInvoiceDto);

    action$.subscribe({
      next: (res) => {
        this.toast.success(
          id === null ? `Invoice #${res.invoiceNumber} created!` : 'Invoice updated successfully',
          'Success'
        );
        this.saving.set(false);
        this.closeFormModal();
        this.loadInvoices(this.currentPage());
      },
      error: (err) => {
        this.toast.error(
          err?.error?.message || 'Failed to save invoice. Verify your inputs.',
          'Error'
        );
        this.saving.set(false);
      }
    });
  }

  // Invoice Details
  viewDetails(inv: InvoiceDisplayDto): void {
    this.invoiceService.getInvoiceById(inv.id).subscribe({
      next: (fullInv) => {
        this.selectedInvoice.set(fullInv);
        this.showDetailModal.set(true);
      },
      error: () => {
        this.selectedInvoice.set(inv);
        this.showDetailModal.set(true);
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedInvoice.set(null);
  }

  // AI Late-Payment Risk Evaluation Modal
  assessRisk(inv: InvoiceDisplayDto): void {
    const evaluation = this.intelligenceService.evaluateInvoice(inv, this.invoices());
    this.selectedAiRisk.set(evaluation);
    this.showAiModal.set(true);
  }

  closeAiModal(): void {
    this.showAiModal.set(false);
    this.selectedAiRisk.set(null);
  }

  confirmAiAudit(overrideLevel?: string): void {
    const current = this.selectedAiRisk();
    if (!current) return;

    const level = (overrideLevel || current.riskLevel) as any;
    this.intelligenceService.saveAuditRecord(
      current,
      level,
      `User validated advisory scoring for invoice ${current.invoiceNumber}`,
      'Confirmed in Invoice Portal'
    );
    this.toast.success('Advisory evaluation logged to compliance audit trail', 'AI Intelligence');
    this.closeAiModal();
  }

  // Delete modal
  confirmDelete(inv: InvoiceDisplayDto): void {
    if (!this.canEditDelete) return;
    if (inv.amountPaid > 0) {
      this.toast.error(
        'Cannot delete invoice with existing payment allocations.',
        'Integrity Rule'
      );
      return;
    }
    this.invoiceToDelete.set(inv);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.invoiceToDelete.set(null);
  }

  executeDelete(): void {
    const inv = this.invoiceToDelete();
    if (!inv) return;

    this.deletingId.set(inv.id);
    this.invoiceService.deleteInvoice(inv.id).subscribe({
      next: () => {
        this.toast.success(`Invoice ${inv.invoiceNumber} removed`, 'Deleted');
        this.deletingId.set(null);
        this.cancelDelete();
        this.loadInvoices(this.currentPage());
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete invoice', 'Error');
        this.deletingId.set(null);
      }
    });
  }

  // Pagination navigation
  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadInvoices(p);
    }
  }
}