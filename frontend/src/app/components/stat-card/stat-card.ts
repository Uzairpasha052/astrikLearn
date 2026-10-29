import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss'
})
export class StatCard {
  title = input<string>('');
  value = input<string | number | null | undefined>('');
  subtitle = input<string>('');
  icon = input<string>('');
  iconClass = input<string>('');
  valueClass = input<string>('');
  subClass = input<string>('');
}
