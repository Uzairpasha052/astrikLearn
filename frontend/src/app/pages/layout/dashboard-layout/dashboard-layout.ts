import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Component, Inject, PLATFORM_ID, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styleUrl: './dashboard-layout.scss',
  templateUrl: './dashboard-layout.html'
})
export class DashboardLayout {
  sidebarOpen = signal(true);
  user = signal<any>(null);

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          this.user.set(JSON.parse(storedUser));
        } catch {
          this.user.set(null);
        }
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  getDashboardLink(): string {
    const role = this.user()?.role;
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Accountant') return '/accountant/dashboard';
    if (role === 'Sales') return '/sales/dashboard';
    return '/invoices';
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }
}
