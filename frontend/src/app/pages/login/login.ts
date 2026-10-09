import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  imports: [FormsModule, CommonModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {

  email = '';
  password = '';
  showPassword = false;

  constructor( private authService: AuthService,
    private router: Router
  ){}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.authService.login({
      mail: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        console.log('Login successful:', response);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user))

        if(response.user.role === 'Admin'){
          this.router.navigate(['/admin/dashboard'])
        }
        else if(response.user.role === 'Accountant'){
          this.router.navigate(['/accountant/dashboard'])
        }
        else if(response.user.role === 'Sales'){
          this.router.navigate(['/sales/dashboard'])
        }
        
      },
      error: (err) => {
        console.error('Login failed:', err);
      }
    })

  }

 
}
