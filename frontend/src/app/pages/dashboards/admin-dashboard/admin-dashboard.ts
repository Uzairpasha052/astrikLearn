import { Component, inject, signal } from '@angular/core';
import { CustomerDto } from '../../../model/Customer.model';
import { CustomerService } from '../../../services/customerService/customer-service';
import { RouterLink } from '@angular/router';
import { AuthService, UserDisplay } from '../../../services/auth-service';

@Component({
  imports: [RouterLink],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.scss',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {

  private customerService = inject(CustomerService)
  private authService = inject(AuthService)

  users = signal<UserDisplay[]>([])
  customers = signal<CustomerDto[]>([])
  loading = signal(false)
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  ngOnInit(){
    this.loadCustomers()
    this.loadUsers()
  }

  loadCustomers(page: number = 1): void {
  this.loading.set(true);
  this.errorMessage.set('');

  this.customerService.getCustomers(
    page,
    this.pageSize()
  ).subscribe({
    next: (data) => {
      this.customers.set(data.items);
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

  // loadCustomers(): void{
  //   this.loading.set(true)
  //   this.errorMessage.set('')

  //   this.customerService.getCustomers().subscribe({
  //     next: (res) => {
  //       this.customers.set(res)
  //       this.loading.set(false)
  //     },
  //     error: (err) => {
  //       this.errorMessage.set(err?.error?.message ?? 'Failed to load customers');
  //       this.loading.set(false);
  //     }
  //   })
  // }

  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  loadUsers(page: number = 1): void {
  this.loading.set(true);
  this.errorMessage.set('');

  this.authService.getLoginUser(
    page,
    this.pageSize()
  ).subscribe({
    next: (data) => {
      this.users.set(data.items);
      this.currentPage.set(data.pageNumber);
      this.totalCount.set(data.totalCount);
      this.totalPages.set(data.totalPages);
      this.loading.set(false);
    },
    error: () => {
      this.errorMessage.set('Failed to load users');
      this.loading.set(false);
    }
  });
}

previousPage(): void {
  if (this.currentPage() > 1) {
    this.loadUsers(this.currentPage() - 1);
  }
}

nextPage(): void {
  if (this.currentPage() < this.totalPages()) {
    this.loadUsers(this.currentPage() + 1);
  }
}

// previousPage(): void {
//   if (this.currentPage() > 1) {
//     this.loadCustomers(this.currentPage() - 1);
//   }
// }

// nextPage(): void {
//   if (this.currentPage() < this.totalPages()) {
//     this.loadCustomers(this.currentPage() + 1);
//   }
// }


  // loadUser(): void {
  //   this.loading.set(true)
  //   this.errorMessage.set('')

  //   this.authService.getLoginUser().subscribe({
  //     next: (res) => {
  //       this.users.set(res)
  //       this.loading.set(false)
  //     },
  //     error: (err) => {
  //       this.errorMessage.set(err?.error?.message ?? 'Failed to load Users');
  //       this.loading.set(false);
  //     }
  //   })
  // }



   stats = [
    {
      title: 'Total Users',
      value: '1,248',
      change: '+12.5%',
      type: 'users'
    },
    {
      title: 'Total Customers',
      value: '$84,520',
      change: '+8.2%',
      type: 'sales'
    },
    {
      title: 'Total Orders',
      value: '3,642',
      change: '+15.3%',
      type: 'orders'
    },
    {
      title: 'Revenue',
      value: '$124,680',
      change: '+10.8%',
      type: 'revenue'
    }
  ];

}
