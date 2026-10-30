import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CustomerService } from '../../../services/customerService/customer-service';
import { AuthService } from '../../../services/auth-service';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto } from '../../../model/Customer.model';
import { ExcelService } from '../../../services/excelService/excel.service';

import { finalize } from 'rxjs';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styleUrl: './customer.scss',
  templateUrl: './customer.html'
})
export class Customer implements OnInit {
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);
  private excelService = inject(ExcelService);

  canCreate = this.authService.hasRole('Admin', 'Sales');
  canEditDelete = this.authService.hasRole('Admin');

  customers = signal<CustomerDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  deletingId = signal<number | null>(null);

  searchTerm = signal('');
  filterActive = signal('ALL');

  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  showModal = signal(false);
  showDeleteModal = signal(false);
  editingId = signal<number | null>(null);
  customerToDelete = signal<CustomerDto | null>(null);


  // For excel File
  selectedFile: File | null = null

  isExporting = false
  isImporting = false

  excelMessage = ''
  excelErrorMessage = ''

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(20)]],
    address: ['', [Validators.maxLength(200)]],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(page: number = 1): void {
    this.loading.set(true);
    this.customerService.getCustomers(page, this.pageSize()).subscribe({
      next: (data) => {
        this.customers.set(data.items);
        this.currentPage.set(data.pageNumber);
        this.totalCount.set(data.totalCount);
        this.totalPages.set(data.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to load customers', 'Error');
        this.loading.set(false);
      }
    });
  }

  filteredCustomers = computed(() => {
    let list = this.customers();
    const search = this.searchTerm().trim().toLowerCase();
    const active = this.filterActive();

    if (search) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.email && c.email.toLowerCase().includes(search)) ||
          (c.phone && c.phone.includes(search)) ||
          (c.address && c.address.toLowerCase().includes(search))
      );
    }

    if (active === 'ACTIVE') {
      list = list.filter((c) => c.isActive);
    } else if (active === 'INACTIVE') {
      list = list.filter((c) => !c.isActive);
    }

    return list;
  });

  openForm(): void {
    if (!this.canCreate) return;
    this.form.reset();
    this.editingId.set(null);
    this.showModal.set(true);
  }

  edit(c: CustomerDto): void {
    if (!this.canEditDelete) return;
    this.editingId.set(c.id);
    this.form.patchValue({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      isActive: c.isActive ?? true
    });
    this.showModal.set(true);
  }

  closeForm(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please enter a valid customer name.', 'Validation Error');
      return;
    }

    const id = this.editingId();
    if (id === null && !this.canCreate) return;
    if (id !== null && !this.canEditDelete) return;

    this.saving.set(true);
    const formVal = this.form.getRawValue();

    const payload: CreateCustomerDto = {
      name: formVal.name!.trim(),
      email: formVal.email?.trim() || undefined,
      phone: formVal.phone?.trim() || undefined,
      address: formVal.address?.trim() || undefined,
      isActive: formVal.isActive ?? true  
    };

    const action$ =
      id === null
        ? this.customerService.createCustomer(payload)
        : this.customerService.updateCustomer(id, payload as UpdateCustomerDto);

    action$.subscribe({
      next: (res) => {
        this.toast.success(
          res.message || (id === null ? 'Customer created successfully' : 'Customer updated successfully'),
          'Success'
        );
        this.saving.set(false);
        this.closeForm();
        this.loadCustomers(this.currentPage());
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to save customer';
        this.toast.error(msg, 'Error');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(c: CustomerDto): void {
    if (!this.canEditDelete) return;
    this.customerToDelete.set(c);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.customerToDelete.set(null);
  }

  executeDelete(): void {
    const c = this.customerToDelete();
    if (!c) return;

    this.deletingId.set(c.id);
    this.customerService.deleteCustomer(c.id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Customer deleted successfully', 'Success');
        this.deletingId.set(null);
        this.cancelDelete();
        this.loadCustomers(this.currentPage());
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to delete customer';
        this.toast.error(msg, 'Error');
        this.deletingId.set(null);
      }
    });
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadCustomers(p);
    }
  }

  //Excel import and export

  //Select excel File
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement

    this.excelMessage = ''
    this.excelErrorMessage = ''

    const file = input.files?.[0]

    if(!file){
      this.selectedFile = null
      return
    }

    if(!file.name.toLowerCase().endsWith('.xlsx')){
      this.excelErrorMessage = "Please select an .xlsx file"
      this.selectedFile = null
      input.value = ''
      return
    }

    this.selectedFile = file
  }

  // export excel file
  exportCustomer(): void {
    this.isExporting = true
    this.excelMessage = ''
    this.excelErrorMessage = ''

    this.excelService.customerExport().pipe(
      finalize(() => {
        this.isImporting = false
      })
    )
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `Customers_${new Date().getTime()}.xlsx`

          // Append, click, and clean up
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Revoke URL after a slight delay to allow download initiation
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        
        // window.URL.revokeObjectURL(url)

        this.excelMessage = "Customer exported Successfully"
        // this.isExporting = false
      },
      error: (error) => {
        console.error(error)

        this.excelErrorMessage = 'Failed to export customers.';
        this.isExporting = false;
      }
    })
  }

  // import excel file
  importCustomer(): void {
    if(!this.selectedFile){
      this.excelErrorMessage = "Please select an excel file first."
      return
    }

    this.isImporting = true
    this.excelMessage = ''
    this.excelErrorMessage = ''

    this.excelService.customerImport(this.selectedFile).pipe(
      finalize(() => {
        this.isImporting = false
      })
    )
    .subscribe({
      next: (res) => {
        this.excelMessage = res.message || 'Customers imported Successfully'
        this.selectedFile = null

        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        this.loadCustomers();
      },
      error: (err) => {
        console.error(err)

        this.excelErrorMessage =
          err.error?.message || 'Failed to import customers.';

        this.isImporting = false;
      }
    })

  }


}
