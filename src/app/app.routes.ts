import { Routes } from '@angular/router';
import { MovieManagementComponent } from './movie/movie-management/movie-management.component';
import { MovieDetailComponent } from './movie/movie-detail/movie-detail.component';
import { EditMovieComponent } from './movie/edit-movie/edit-movie.component';
import { MovieSettingsComponent } from './movie/movie-settings/movie-settings.component';
import { EmpManagementComponent } from './emp-management/emp-management.component';
import { ActorManagementComponent } from './actor-management/actor-management.component';
import { ShowtimeManagementComponent } from './showtime/showtime-management/showtime-management.component';
import { MembershipManagementComponent } from './membership-management/membership-management.component';
import { RoomManagementComponent } from './room/room-management/room-management.component';
import { PricingRuleComponent } from './pricing-rule/pricing-rule-management/pricing-rule.component';
import { LogManagementComponent } from './log-management/log-management.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth/auth.guard';
import { VoucherManagementComponent } from './voucher/voucher-management/voucher-management.component';
import { VoucherUsageManagementComponent } from './voucher/voucher-usage-management/voucher-usage-management.component';
import { VoucherUiComponent } from './voucher/voucher-ui/voucher-ui.component';
import { CinemaManagementComponent } from './cinema/cinema-management/cinema-management.component';
import { ServiceManagementComponent } from './dichvu/service-management/service-management.component';
import { ServiceTypeManagementComponent } from './dichvu/service-type-management/service-type-management.component';
// import { STATISTICS_ROUTES } from './statistics/statistics-routing';
import { DashboardComponent } from './statistics/dashboard/dashboard.component';

export const routes: Routes = [
  // Public routes that don't require authentication
  { path: 'login', component: LoginComponent },

  // Special routes like payment callback


  // Protected routes - all grouped under a parent with the auth guard
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'statistics', pathMatch: 'full' },
      { path: 'movies', component: MovieManagementComponent },
      { path: 'movies/edit/:id', component: EditMovieComponent },
      { path: 'movies/detail/:id', component: MovieDetailComponent },
      { path: 'movies/settings', component: MovieSettingsComponent },
      { path: 'employees', component: EmpManagementComponent },
      { path: 'actors', component: ActorManagementComponent },
      { path: 'showtimes', component: ShowtimeManagementComponent },
      { path: 'memberships', component: MembershipManagementComponent },
      { path: 'log', component: LogManagementComponent },
      { path: 'rooms', component: RoomManagementComponent },
      { path: 'pricing-rules', component: PricingRuleComponent },
      { path: 'service', component: ServiceManagementComponent },
      { path: 'service-type', component: ServiceTypeManagementComponent },



      { path: 'voucher', component: VoucherManagementComponent },
      { path: 'voucher-usage', component: VoucherUsageManagementComponent },
      { path: 'voucher-ui', component: VoucherUiComponent },
      { path: 'cinemas', component: CinemaManagementComponent },
      { path: 'statistics', component: DashboardComponent }
    ]
  },

  // Wildcard route - redirect to login if not logged in, otherwise to default page
  {
    path: '**',
    redirectTo: ''
  }
];