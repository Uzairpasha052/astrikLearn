import { Component, signal, inject } from '@angular/core';
import { CustomerService } from '../../../services/customerService/customer-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerDto, CustomerResponse } from '../../../model/Customer.model';


@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-customer',
  styleUrl: './customer.scss',
  templateUrl: './customer.html',
})
export class Customer {

  constructor(
    private customerService : CustomerService,
    // private fb: FormBuilder,
  ){}
  private fb = inject(FormBuilder);


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
 
    loadCustomers(): void {
      this.loading.set(true);
      this.errorMessage.set('');
  
      this.customerService.getCustomers().subscribe({
        next: (data) => {
          this.customers.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load customers');
          this.loading.set(false);
        },
      });
    }

    openForm(): void {
      this.form.reset()
      this.errorMessage.set('')
      this.successMessage.set('')
      this.showForm.set(true)
    }

    closeForm(): void {
      this.showForm.set(false)
    }

    submit(): void{
      
      if(this.form.invalid){
        this.form.markAllAsTouched()
        return
      }

      this.saving.set(true)
      this.errorMessage.set('')

      this.customerService.createCustomer(this.form.getRawValue()).subscribe({
        next: (res) => {
          this.successMessage.set(res.message)
          this.saving.set(false)
          this.showForm.set(false)
          this.loadCustomers()

          console.log(res)
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? "Failed to create Cutomer")
          this.saving.set(false)
        }
      })

    }

}
