import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../services/auth-service';


@Component({
  imports: [FormsModule, CommonModule, 
    // RouterLink
  ],
  selector: 'app-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role: number = 0;

  showPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService) {}
  private toast = inject(ToastrService)

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  resetForm(): void {
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.role = 0;

    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  register(): void {
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
      this.resetForm();
      return;
    }

    this.authService
      .register({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role
      })
      .subscribe({
        next: (response) => {
          console.log( response);

          this.toast.success( 
            'Registration successful:',
            'Success',
            {
              timeOut: 4000,
            }
          )

          this.resetForm()
        },

        error: (error) => {
          console.error('Registration failed:', error);
          console.log('Validation errors:', error.error?.errors);

          // const message = error || error.message || 'Registration failed, Please try again'
          const message =
            typeof error.error === 'string'
              ? error.error.split('\r\n')[0]
              : error.error?.message ||
                error.message ||
                'Registration failed. Please try again.';

          this.toast.error(message, 'Registration Failed')

          this.resetForm()
        }
      });

  }
}
