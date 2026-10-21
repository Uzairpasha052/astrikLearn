import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  styleUrl: './login.scss',
  templateUrl: './login.html'
})
export class Login {
  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastrService);

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  fillDemo(role: 'admin'): void{ // | 'accountant' | 'sales'): void {
    if (role === 'admin') {
      this.email = 'uu@gmail.com';
      this.password = 'uu1234';
    } 
    // else if (role === 'accountant') {
    //   this.email = 'accountant@project.com';
    //   this.password = 'acc123456';
    // } else {
    //   this.email = 'sales@project.com';
    //   this.password = 'sales123456';
    // }
  }

  login(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.authService
      .login({
        mail: this.email,
        password: this.password
      })
      .subscribe({
        next: (response) => {
          const { token, ...user } = response;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          this.toast.success(
            `Welcome back, ${response.name || 'User'}!`,
            'Login Successful'
          );

          setTimeout(() => {
            if (response.role === 'Admin') {
              this.router.navigate(['/admin/dashboard']);
            } else if (response.role === 'Accountant') {
              this.router.navigate(['/accountant/dashboard']);
            } else if (response.role === 'Sales') {
              this.router.navigate(['/sales/dashboard']);
            } else {
              this.router.navigate(['/invoices']);
            }
          }, 300);
        },
        error: (err) => {
          this.loading.set(false);
          const message =
            typeof err.error === 'string'
              ? err.error
              : err.error?.message ||
                err.error?.detail ||
                'Invalid email or password. Please try again.';

          this.toast.error(message, 'Login Failed');
        }
      });
  }
}
