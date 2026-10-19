import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserDisplay } from '../../../services/auth-service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  styleUrl: './user.scss',
  templateUrl: './user.html'
})
export class User implements OnInit {
  private authService = inject(AuthService);

  users = signal<UserDisplay[]>([]);
  loading = signal(true);
  error = signal('');
  searchTerm = signal('');

  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.getLoginUser(page, this.pageSize()).subscribe({
      next: (data) => {
        this.users.set(data.items);
        this.currentPage.set(data.pageNumber);
        this.totalCount.set(data.totalCount);
        this.totalPages.set(data.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load user directory');
        this.loading.set(false);
      }
    });
  }

  filteredUsers = computed(() => {
    let list = this.users();
    const search = this.searchTerm().trim().toLowerCase();

    if (search) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.role.toLowerCase().includes(search)
      );
    }

    return list;
  });

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadUsers(p);
    }
  }
}
