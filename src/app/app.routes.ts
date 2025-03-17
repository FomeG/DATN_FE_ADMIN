import { Routes } from '@angular/router';
import { MovieManagementComponent } from './movie-management/movie-management.component';
import { EditMovieComponent } from './edit-movie/edit-movie.component';
import { EmpManagementComponent } from './emp-management/emp-management.component';
import { ActorManagementComponent } from './actor-management/actor-management.component';
import { ShowtimeManagementComponent } from './showtime-management/showtime-management.component';
import { MembershipManagementComponent } from './membership-management/membership-management.component';
import { LogManagementComponent } from './log-management/log-management.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  
  // Protected routes
  { 
    path: '', 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'movies', pathMatch: 'full' }, // Default route when authenticated
      { path: 'movies', component: MovieManagementComponent },
      { path: 'movies/edit/:id', component: EditMovieComponent },
      { path: 'employees', component: EmpManagementComponent },
      { path: 'actors', component: ActorManagementComponent },
      { path: 'showtimes', component: ShowtimeManagementComponent },
      { path: 'memberships', component: MembershipManagementComponent },
      { path: 'log', component: LogManagementComponent }
    ]
  },

  // Wildcard route for 404
  { path: '**', redirectTo: '' }
];