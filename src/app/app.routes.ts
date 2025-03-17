import { Routes } from '@angular/router';
import { MovieManagementComponent } from './movie-management/movie-management.component';
import { EditMovieComponent } from './edit-movie/edit-movie.component';
import { EmpManagementComponent } from './emp-management/emp-management.component';
import { ActorManagementComponent } from './actor-management/actor-management.component';
import { ShowtimeManagementComponent } from './showtime-management/showtime-management.component';
import { MembershipManagementComponent } from './membership-management/membership-management.component';
import { RoomManagementComponent } from './room/room-management/room-management.component';
import { PricingRuleComponent } from './pricing-rule/pricing-rule.component';

export const routes: Routes = [
  { path: 'movies', component: MovieManagementComponent },
  { path: '', redirectTo: 'movies', pathMatch: 'full' },
  { path: 'movies/edit/:id', component: EditMovieComponent },
  { path: 'employees', component: EmpManagementComponent },
  { path: 'actors', component: ActorManagementComponent },
  { path: 'showtimes', component: ShowtimeManagementComponent },
  { path: 'memberships', component: MembershipManagementComponent },
  { path: 'rooms', component: RoomManagementComponent },
  {
    path: 'pricing-rules',
    component: PricingRuleComponent
  },
];