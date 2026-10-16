import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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

  private toast = inject(ToastrService)

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

        this.toast.success(
          'Welcome Back! ',
          'Login Successfull',
          {
            timeOut: 4000,
          }
        )

        setTimeout(() => {
          if(response.role === 'Admin'){
            this.router.navigate(['/admin/dashboard'])
          }
          else if(response.role === 'Accountant'){
            this.router.navigate(['/accountant/dashboard'])
          }
          else if(response.role === 'Sales'){
            this.router.navigate(['/sales/dashboard'])
          }
        }, 4000)
        
      },
      error: (err) => {
        console.error('Login failed:', err);

        const message =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message ||
              err.error?.detail ||
              'Invalid email or password. Please try again.';

        this.toast.error(message, 'Login Failed', { enableHtml: false });
        // this.toast.error(
        //   'Login Failed', err
        // )

      }
    })

  }

}
