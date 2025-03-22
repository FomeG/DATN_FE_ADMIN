import { Routes } from '@angular/router';
import { MovieManagementComponent } from './movie/movie-management/movie-management.component';
import { MovieDetailComponent } from './movie/movie-detail/movie-detail.component';
import { EditMovieComponent } from './edit-movie/edit-movie.component';
import { EmpManagementComponent } from './emp-management/emp-management.component';
import { ActorManagementComponent } from './actor-management/actor-management.component';
import { ShowtimeManagementComponent } from './showtime-management/showtime-management.component';
import { MembershipManagementComponent } from './membership-management/membership-management.component';
import { RoomManagementComponent } from './room/room-management/room-management.component';
import { PricingRuleComponent } from './pricing-rule/pricing-rule.component';
import { LogManagementComponent } from './log-management/log-management.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth/auth.guard';
import { PaymentCallbackComponent } from './VNPAY/payment-callback/payment-callback.component';
import { PaymentLayoutComponent } from './VNPAY/payment-layout/payment-layout.component';
import { VoucherManagementComponent } from './voucher/voucher-management/voucher-management.component';
import { VoucherUsageManagementComponent } from './voucher/voucher-usage-management/voucher-usage-management.component';

import { LogManagementComponent } from './log-management/log-management.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  // Public routes that don't require authentication
  { path: 'login', component: LoginComponent },

  // Special routes like payment callback


  // Protected routes - all grouped under a parent with the auth guard
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'movies', pathMatch: 'full' },
      { path: 'movies', component: MovieManagementComponent },
      { path: 'movies/edit/:id', component: EditMovieComponent },
      { path: 'movies/detail/:id', component: MovieDetailComponent },
      { path: 'employees', component: EmpManagementComponent },
      { path: 'actors', component: ActorManagementComponent },
      { path: 'showtimes', component: ShowtimeManagementComponent },
      { path: 'memberships', component: MembershipManagementComponent },
      { path: 'log', component: LogManagementComponent },
      { path: 'rooms', component: RoomManagementComponent },
      { path: 'pricing-rules', component: PricingRuleComponent },



      { path: 'voucher', component: VoucherManagementComponent },
      { path: 'voucher-usage', component: VoucherUsageManagementComponent },
      { path: 'payment-callback', component: PaymentCallbackComponent },
    ]
  },

  // Wildcard route - redirect to login if not logged in, otherwise to default page
  {
    path: '**',
    redirectTo: ''
  }
];