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

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.authService.getLoginUser().subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load users');
        this.loading.set(false);
      }
    });
  }

}
