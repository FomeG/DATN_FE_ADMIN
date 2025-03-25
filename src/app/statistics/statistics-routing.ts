import { Routes } from '@angular/router';
import { BundledServicesComponent } from './components/bundled-services/bundled-services.component';
import { CustomerGenderComponent } from './components/customer-gender/customer-gender.component';
import { PeakHoursComponent } from './components/peak-hours/peak-hours.component';
import { RevenueByTimeComponent } from './components/revenue-by-time/revenue-by-time.component';
import { RevenueByCinemaComponent } from './components/revenue-by-cinema/revenue-by-cinema.component';
import { SeatProfitabilityComponent } from './components/seat-profitability/seat-profitability.component';
import { TopServicesComponent } from './components/top-services/top-services.component';
import { SeatOccupancyComponent } from './components/seat-occupancy/seat-occupancy.component';
import { PopularGenresComponent } from './components/popular-genres/popular-genres.component';

export const STATISTICS_ROUTES: Routes = [
  {
    path: 'bundled-services',
    component: BundledServicesComponent,
    title: 'Thống kê dịch vụ gói'
  },
  {
    path: 'customer-gender',
    component: CustomerGenderComponent,
    title: 'Thống kê giới tính khách hàng'
  },
  {
    path: 'peak-hours',
    component: PeakHoursComponent,
    title: 'Thống kê giờ cao điểm'
  },
  {
    path: 'revenue-by-cinema',
    component: RevenueByCinemaComponent,
    title: 'Thống kê doanh thu theo rạp'
  },
  {
    path: 'revenue-by-time',
    component: RevenueByTimeComponent,
    title: 'Thống kê doanh thu theo thời gian'
  },
  {
    path: 'seat-profitability',
    component: SeatProfitabilityComponent,
    title: 'Thống kê lợi nhuận ghế'
  },
  {
    path: 'top-services',
    component: TopServicesComponent,
    title: 'Thống kê dịch vụ hàng đầu'
  },
  {
    path: 'seat-occupancy',
    component: SeatOccupancyComponent,
    title: 'Thống kê tỷ lệ lấp đầy ghế'
  },
  {
    path: 'popular-genres',
    component: PopularGenresComponent,
    title: 'Thống kê thể loại phổ biến'
  }
]; 