import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-invoice',
  styleUrl: './invoice.scss',
  templateUrl: './invoice.html',
})
export class Invoice {}


// {
//   "customerId": 1,
//   "invoiceDate": "2026-10-14",
//   "dueDate": "2026-10-28",
//   "items": [
//     {
//       "description": "Website Development",
//       "quantity": 1,
//       "unitPrice": 50000
//     },
//     {
//       "description": "Monthly Maintenance",
//       "quantity": 2,
//       "unitPrice": 5000
//     }
//   ]
// }