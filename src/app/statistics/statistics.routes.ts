import { Routes } from '@angular/router';
import { BundledServicesComponent } from './components/bundled-services/bundled-services.component';
import { CustomerGenderComponent } from './components/customer-gender/customer-gender.component';
import { PeakHoursComponent } from './components/peak-hours/peak-hours.component';

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'bundled-services',
    pathMatch: 'full'
  },
  {
    path: 'bundled-services',
    component: BundledServicesComponent
  },
  {
    path: 'customer-gender',
    component: CustomerGenderComponent
  },
  {
    path: 'peak-hours',
    component: PeakHoursComponent
  }
]; 