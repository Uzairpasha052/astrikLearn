import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-dashboard-layout',
  styleUrl: './dashboard-layout.scss',
  templateUrl: './dashboard-layout.html',
})
export class DashboardLayout {

  sidebarOpen = true;

  user: any = null;

  constructor(private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {

      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }

    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);
  }

}
