import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  // agreeTerms = false;

  showPassword = false;
  showConfirmPassword = false;

  constructor(private authService: AuthService) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register(): void {
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
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
          console.log('Registration successful:', response);
        },

        error: (error) => {
          // console.error('Registration failed:', error);
          console.error('Registration failed:', error);
          console.log('Validation errors:', error.error?.errors);
        }
      });

  }
}
