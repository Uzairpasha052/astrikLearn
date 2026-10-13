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
        const { token, ...user} = response

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user))

        
        if(response.role === 'Admin'){
          this.router.navigate(['/admin/dashboard'])
        }
        else if(response.role === 'Accountant'){
          this.router.navigate(['/accountant/dashboard'])
        }
        else if(response.role === 'Sales'){
          this.router.navigate(['/sales/dashboard'])
        }
        
      },
      error: (err) => {
        console.error('Login failed:', err);
      }
    })

  }

 
}
