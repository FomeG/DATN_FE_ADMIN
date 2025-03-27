import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces cho dữ liệu trả về

// Top dịch vụ bán chạy
export interface StatisticTopServicesRes {
  serviceName: string;
  totalSold: number;
  totalRevenue: number;
}

// Lợi nhuận ghế
export interface StatisticSeatProfitabilityRes {
  seatTypeName: string;
  averagePrice: number;
  totalTicketsSold: number;
  totalRevenue: number;
}

// Tỷ lệ lấp đầy ghế
export interface StatisticSeatOccupancyRes {
  startTime: Date;
  movieName: string;
  totalSeats: number;
  bookedSeats: number;
  occupancyRate: number;
}

// Doanh thu theo thời gian
export interface StatisticRevenueByTimeRes {
  orderDate: Date;
  hourOfDay: number;
  totalRevenue: number;
  totalOrders: number;
}

// Doanh thu theo rạp
export interface StatisticRevenueByCinemaRes {
  cinemaName: string;
  totalRevenue: number;
  totalOrders: number;
}

// Thể loại phim phổ biến
export interface StatisticPopularGenresRes {
  genreName: string;
  totalShowtimes: number;
  totalRevenue: number;
}

// Giờ cao điểm
export interface StatisticPeakHoursRes {
  hourOfDay: number;
  totalTicketsSold: number;
}

// Giới tính khách hàng
export interface StatisticCustomerGenderRes {
  gender: string;
  totalCustomers: number;
  totalSpent: number;
}

// Dịch vụ gói
export interface StatisticBundledServicesRes {
  serviceName: string;
  totalOrders: number;
  totalQuantitySold: number;
}

// Response chung
export interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
  totalRecord?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Xử lý ngày tháng để truyền vào API
   * @param date Ngày cần format
   * @returns Chuỗi ngày đã format hoặc null
   */
  private formatDate(date?: Date): string | null {
    if (!date) return null;
    
    // Format thủ công thành YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Tạo HttpParams với date range
   */
  private createDateRangeParams(startDate?: Date, endDate?: Date): HttpParams {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', this.formatDate(startDate) || '');
    }
    
    if (endDate) {
      params = params.set('endDate', this.formatDate(endDate) || '');
    }
    
    return params;
  }

  /**
   * Lấy thống kê dịch vụ bán chạy nhất
   */
  getTopServices(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticTopServicesRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticTopServicesRes[]>>(
      `${this.baseUrl}Statistic/GetTopServices`, 
      { params }
    );
  }

  /**
   * Lấy thống kê lợi nhuận ghế
   */
  getSeatProfitability(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticSeatProfitabilityRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticSeatProfitabilityRes[]>>(
      `${this.baseUrl}Statistic/GetSeatProfitability`, 
      { params }
    );
  }

  /**
   * Lấy thống kê tỷ lệ lấp đầy ghế
   */
  getSeatOccupancy(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticSeatOccupancyRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticSeatOccupancyRes[]>>(
      `${this.baseUrl}Statistic/GetSeatOccupancy`, 
      { params }
    );
  }

  /**
   * Lấy thống kê doanh thu theo thời gian
   */
  getRevenueByTime(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticRevenueByTimeRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticRevenueByTimeRes[]>>(
      `${this.baseUrl}Statistic/GetRevenueByTime`, 
      { params }
    );
  }

  /**
   * Lấy thống kê doanh thu theo rạp
   */
  getRevenueByCinema(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticRevenueByCinemaRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticRevenueByCinemaRes[]>>(
      `${this.baseUrl}Statistic/GetRevenueByCinema`, 
      { params }
    );
  }

  /**
   * Lấy thống kê thể loại phim phổ biến
   */
  getPopularGenres(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticPopularGenresRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticPopularGenresRes[]>>(
      `${this.baseUrl}Statistic/GetPopularGenres`, 
      { params }
    );
  }

  /**
   * Lấy thống kê giờ cao điểm
   */
  getPeakHours(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticPeakHoursRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticPeakHoursRes[]>>(
      `${this.baseUrl}Statistic/GetPeakHours`, 
      { params }
    );
  }

  /**
   * Lấy thống kê giới tính khách hàng
   */
  getCustomerGender(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticCustomerGenderRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticCustomerGenderRes[]>>(
      `${this.baseUrl}Statistic/GetCustomerGender`, 
      { params }
    );
  }

  /**
   * Lấy thống kê dịch vụ gói
   */
  getBundledServices(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticBundledServicesRes[]>> {
    const params = this.createDateRangeParams(startDate, endDate);
    return this.http.get<CommonResponse<StatisticBundledServicesRes[]>>(
      `${this.baseUrl}Statistic/GetBundledServices`, 
      { params }
    );
  }
} 