import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesDashboard } from './sales-dashboard';

describe('SalesDashboard', () => {
  let component: SalesDashboard;
  let fixture: ComponentFixture<SalesDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
