import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-container">
      <div class="not-found-card">
        <div class="error-badge">404 ERROR</div>
        <h1>Page Not Found</h1>
        <p>The requested financial route or ledger view does not exist or has been relocated.</p>
        <div class="actions">
          <a routerLink="/login" class="btn btn-primary">Return to Portal</a>
          <a routerLink="/invoices" class="btn btn-secondary">Go to Invoices</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: #ffffff;
      padding: 20px;
    }
    .not-found-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .error-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1px;
      color: #f87171;
      background: rgba(239, 68, 68, 0.15);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 10px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      padding: 9px 18px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-primary {
      background: #4f46e5;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: #334155;
      color: #f1f5f9;
    }
    .btn-secondary:hover {
      background: #475569;
    }
  `]
})
export class NotFound {}
