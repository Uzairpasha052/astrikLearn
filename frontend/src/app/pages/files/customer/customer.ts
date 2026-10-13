import { Component, signal, inject } from '@angular/core';
import { CustomerService } from '../../../services/customerService/customer-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerDto, CustomerResponse } from '../../../model/Customer.model';
import { AuthService } from '../../../services/auth-service';


@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-customer',
  styleUrl: './customer.scss',
  templateUrl: './customer.html',
})
export class Customer {

    constructor(
      private customerService : CustomerService,
      // private authService : AuthService
      // private fb: FormBuilder,
    ){}
    private fb = inject(FormBuilder);
    private authService = inject(AuthService)

    canCreate = this.authService.hasRole('Admin', 'Sales')
    canEditDelete = this.authService.hasRole('Admin')

    editingId = signal<number | null>(null)
    deletingId = signal<number | null>(null)

    customers = signal<CustomerDto[]>([]);
    loading = signal(false)
    saving = signal(false);
    showForm = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],    
    })

    ngOnInit(): void {
      this.loadCustomers();
    }

    currentPage = signal(1);
    pageSize = signal(10);
    totalCount = signal(0);
    totalPages = signal(0);

    loadCustomers(page: number = 1): void {
      this.loading.set(true);
      this.errorMessage.set('');

      this.customerService.getCustomers(
        page,
        this.pageSize()
      ).subscribe({
        next: (data) => {
          this.customers.set(data.items.filter(c => c.isActive === true));
          this.currentPage.set(data.pageNumber);
          this.totalCount.set(data.totalCount);
          this.totalPages.set(data.totalPages);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err?.error?.message ?? 'Failed to load customers'
          );
          this.loading.set(false);
        }
      });
    }
 
    // loadCustomers(): void {
    //   this.loading.set(true);
    //   this.errorMessage.set('');
  
    //   this.customerService.getCustomers().subscribe({
    //     next: (data) => {
    //       this.customers.set(data.filter(c => c.isActive === true));
    //       this.loading.set(false);
    //     },
    //     error: (err) => {
    //       this.errorMessage.set(err?.error?.message ?? 'Failed to load customers');
    //       this.loading.set(false);
    //     },
    //   });
    // }

    openForm(): void {
      if(!this.canCreate) 
        return

      this.form.reset()
      this.errorMessage.set('')
      this.successMessage.set('')
      this.showForm.set(true)
      this.editingId.set(null)
    }

    closeForm(): void {
      this.showForm.set(false)
      this.editingId.set(null)
    }

    submit(): void{
      
      if(this.form.invalid){
        this.form.markAllAsTouched()
        return
      }

      const id = this.editingId()
      if(id === null && !this.canCreate) return
      if(id !== null && !this.canEditDelete) return

      this.saving.set(true)
      this.errorMessage.set('')

      const value = this.form.getRawValue()
      const request$ = id === null 
      ? this.customerService.createCustomer(value)
      : this.customerService.updateCustomer(id, value)

      request$.subscribe({
        next: (res) => {
          this.successMessage.set(res.message)
          this.saving.set(false)
          this.closeForm()
          this.loadCustomers()
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? "Failed to save Cutomer")
          this.saving.set(false)
        }
      })

    }

    edit(c: CustomerDto): void{
      if(!this.canEditDelete)
        return

        this.editingId.set(c.id)
        this.form.patchValue({
          name : c.name,
          email : c.email ?? '',
          phone : c.phone ?? '',
          address : c.address ?? ''
        })
        this.errorMessage.set('');
        this.successMessage.set('');
        this.showForm.set(true);
    }

    remove(c: CustomerDto): void{
      if(!this.canEditDelete)
        return

      if(!confirm(`Delete customer "${c.name}"? This cannot be undone.`)) return

      this.deletingId.set(c.id)
      this.errorMessage.set('')
      this.successMessage.set('')

      this.customerService.deleteCustomer(c.id).subscribe({
        next: (res) => {
          this.successMessage.set(res.message)
          this.deletingId.set(null)
          this.customers.update(list => list.filter(x => x.id !== c.id));
        },
        error: (err) => {
          this.errorMessage.set(this.getErrorMessage(err, 'Failed to delete customer'));
          this.deletingId.set(null);
        }
      })

    }

    private getErrorMessage(err: any, fallback: string): string {
      if (err?.status === 403) return "You don't have permission to do this";
      return err?.error?.message ?? fallback;
    }

}
