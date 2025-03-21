// payment-layout.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payment-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="payment-callback-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .payment-callback-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #f5f5f5;
    }
  `]
})
export class PaymentLayoutComponent {}