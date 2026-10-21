import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ReminderService } from '../../../services/reminderService/reminder.service';
import { InvoiceService } from '../../../services/invoiceService/invoice.service';
import { AuthService } from '../../../services/auth-service';
import {
  ReminderDisplayDto,
  CreateReminderDto,
  UpdateReminderDto
} from '../../../model/Reminder.model';
import { InvoiceDisplayDto } from '../../../model/Invoice.model';

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reminder.html',
  styleUrl: './reminder.scss'
})
export class Reminder implements OnInit {
  private reminderService = inject(ReminderService);
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);

  canManage = this.authService.hasRole('Admin');

  reminders = signal<ReminderDisplayDto[]>([]);
  invoices = signal<InvoiceDisplayDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  deletingId = signal<number | null>(null);

  searchTerm = signal('');
  selectedType = signal('ALL');

  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  showModal = signal(false);
  showDeleteModal = signal(false);
  editingId = signal<number | null>(null);
  reminderToDelete = signal<ReminderDisplayDto | null>(null);

  reminderForm = this.fb.group({
    invoiceId: [0, [Validators.required, Validators.min(1)]],
    reminderDate: ['', [Validators.required]],
    reminderType: ['Email', [Validators.required, Validators.maxLength(50)]],
    message: ['', [Validators.maxLength(500)]]
  });

  templates: { [key: string]: string } = {
    Email: 'Dear Customer, this is a friendly reminder that payment for Invoice is due. Please review your statement.',
    'Phone Call': 'Direct credit follow-up call regarding outstanding balance and expected payment transfer date.',
    SMS: 'Notice: Payment for your invoice is due. Please verify receipt and arrange settlement.',
    'Formal Notice': 'URGENT: Outstanding balance is now overdue. Please settle immediately to maintain active credit terms.'
  };

  ngOnInit(): void {
    this.loadReminders();
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.invoiceService.getInvoices(1, 100).subscribe({
      next: (res) => {
        // invoices with open balance
        this.invoices.set(res.items.filter((i) => i.outstandingAmount > 0));
      },
      error: () => {}
    });
  }

  loadReminders(page: number = 1): void {
    this.loading.set(true);
    this.reminderService.getReminders(page, this.pageSize()).subscribe({
      next: (res) => {
        this.reminders.set(res.items);
        this.currentPage.set(res.pageNumber);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to load reminders', 'Error');
        this.loading.set(false);
      }
    });
  }

  filteredReminders = computed(() => {
    let list = this.reminders();
    const search = this.searchTerm().trim().toLowerCase();
    const type = this.selectedType();

    if (search) {
      list = list.filter(
        (r) =>
          r.customerName.toLowerCase().includes(search) ||
          r.invoiceNumber.toLowerCase().includes(search) ||
          (r.message && r.message.toLowerCase().includes(search))
      );
    }

    if (type !== 'ALL') {
      list = list.filter((r) => r.reminderType.toLowerCase() === type.toLowerCase());
    }

    return list;
  });

  onTypeChange(): void {
    const selected = this.reminderForm.get('reminderType')?.value || 'Email';
    if (this.templates[selected] && !this.reminderForm.get('message')?.value) {
      this.reminderForm.patchValue({ message: this.templates[selected] });
    }
  }

  openCreateModal(): void {
    this.editingId.set(null);
    const today = new Date().toISOString().split('T')[0];

    this.reminderForm.reset({
      invoiceId: this.invoices().length > 0 ? this.invoices()[0].id : 0,
      reminderDate: today,
      reminderType: 'Email',
      message: this.templates['Email']
    });

    this.showModal.set(true);
  }

  openEditModal(r: ReminderDisplayDto): void {
    this.editingId.set(r.id);

    this.reminderForm.patchValue({
      invoiceId: r.invoiceId,
      reminderDate: r.reminderDate,
      reminderType: r.reminderType,
      message: r.message || ''
    });

    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  submitReminder(): void {
    if (this.reminderForm.invalid) {
      this.reminderForm.markAllAsTouched();
      this.toast.warning('Please fill in required reminder details.', 'Validation Error');
      return;
    }

    const val = this.reminderForm.getRawValue();
    this.saving.set(true);
    const id = this.editingId();

    if (id === null) {
      const dto: CreateReminderDto = {
        invoiceId: Number(val.invoiceId),
        reminderDate: val.reminderDate!,
        reminderType: val.reminderType!,
        message: val.message || undefined
      };

      this.reminderService.createReminder(dto).subscribe({
        next: (res) => {
          this.toast.success(`Reminder scheduled for ${res.customerName}`, 'Success');
          this.saving.set(false);
          this.closeModal();
          this.loadReminders(this.currentPage());
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to schedule reminder', 'Error');
          this.saving.set(false);
        }
      });
    } else {
      const dto: UpdateReminderDto = {
        reminderDate: val.reminderDate!,
        reminderType: val.reminderType!,
        message: val.message || undefined
      };

      this.reminderService.updateReminder(id, dto).subscribe({
        next: () => {
          this.toast.success('Reminder updated successfully', 'Success');
          this.saving.set(false);
          this.closeModal();
          this.loadReminders(this.currentPage());
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to update reminder', 'Error');
          this.saving.set(false);
        }
      });
    }
  }

  confirmDelete(r: ReminderDisplayDto): void {
    this.reminderToDelete.set(r);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.reminderToDelete.set(null);
  }

  executeDelete(): void {
    const r = this.reminderToDelete();
    if (!r) return;

    this.deletingId.set(r.id);
    this.reminderService.deleteReminder(r.id).subscribe({
      next: () => {
        this.toast.success('Reminder removed', 'Success');
        this.deletingId.set(null);
        this.cancelDelete();
        this.loadReminders(this.currentPage());
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to remove reminder', 'Error');
        this.deletingId.set(null);
      }
    });
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadReminders(p);
    }
  }
}
