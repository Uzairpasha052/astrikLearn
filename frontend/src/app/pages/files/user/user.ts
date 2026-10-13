import { Component, signal } from '@angular/core';
import { AuthService, UserDisplay } from '../../../services/auth-service';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-user',
  styleUrl: './user.scss',
  templateUrl: './user.html',
})
export class User {

  users = signal<UserDisplay[]>([]);
  loading = signal(true);
  error = signal('');

  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
  this.loading.set(true);
  this.error.set('');

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
      this.error.set('Failed to load users');
      this.loading.set(false);
    }
  });
}
  // loadUsers() {
  //   this.loading.set(true);
  //   this.authService.getLoginUser().subscribe({
  //     next: (data) => {
  //       this.users.set(data);
  //       this.loading.set(false);
  //     },
  //     error: () => {
  //       this.error.set('Failed to load users');
  //       this.loading.set(false);
  //     }
  //   });
  // }

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

}
