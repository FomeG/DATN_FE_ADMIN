import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces cho dữ liệu trả về


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


// Doanh thu theo rạp (SP_Statistic_RevenueByCinema)
export interface CinemaRevenueData {
  cinemasId: string;
  name: string;
  totalRooms: number;
  totalRevenue: number;
  totalTickets: number;
}


// Thể loại phim phổ biến
export interface StatisticPopularGenresRes {
  genreName: string;
  totalShowtimes: number;
  totalBookedSeats: number;
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




// Response chung
export interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
  totalRecord?: number;
}







// tổng doanh thu theo thời gian
export interface StatisticSummaryDateRange {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  totalServices: number;
}

// Chi tiết tổng doanh thu theo thời gian
export interface StatisticSummaryDateRangeDetail {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  totalServices: number;
}

// Chi tiết doanh thu theo rạp và thời gian
export interface StatisticRevenueDetail {
  cinemasID?: string;
  cinemaName?: string;
  date: string;
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  totalServices: number;
}

// Phim top
export interface MovieStatisticSummaryDateRange {
  movieId: string;
  movieName: string;
  banner: string;
  totalRevenue: number;
  totalTickets: number;
}

// Dịch vụ top
export interface ServiceStatisticSummaryDateRange {
  serviceId: string;
  serviceName: string;
  imageUrl: string;
  totalRevenue: number;
  totalSold: number;
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

    // Format thủ công thành YYYY-MM-DD mà không chuyển đổi múi giờ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');


    // Sử dụng định dạng 'YYYY-MM-DD' để tránh vấn đề múi giờ
    const formattedDate = `${year}-${month}-${day}`;

    // Log để debug
    console.log(`Ngày gốc: ${date.toLocaleString()}, Ngày sau format: ${formattedDate}`);

    return formattedDate;
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


    console.log(`[API Params] startDate: ${params.get('startDate')}, endDate: ${params.get('endDate')}`);
    return params;
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
   * Lấy thống kê doanh thu theo rạp từ SP_Statistic_RevenueByCinema
   */
  getCinemaRevenue(startDate?: Date, endDate?: Date): Observable<CommonResponse<CinemaRevenueData[]>> {
    let params = new HttpParams();

    // Mặc định lấy tất cả dữ liệu nếu không có ngày
    const start = startDate ? (this.formatDate(startDate) || '01-01-1900') : '01-01-1900';
    const end = endDate ? (this.formatDate(endDate) || '12-31-2999') : '12-31-2999';

    params = params.set('Start', start);
    params = params.set('End', end);

    return this.http.get<CommonResponse<CinemaRevenueData[]>>(
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
    console.log(`[getPeakHours] Gọi API với startDate=${startDate?.toLocaleString()}, endDate=${endDate?.toLocaleString()}`);
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
   * Lấy tổng hợp thống kê
   */
  getSummaryDateRange(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticSummaryDateRange[]>> {
    let params = new HttpParams();

    // Mặc định lấy tất cả dữ liệu nếu không có ngày
    const start = startDate ? (this.formatDate(startDate) || '01-01-1900') : '01-01-1900';
    const end = endDate ? (this.formatDate(endDate) || '12-31-2999') : '12-31-2999';

    params = params.set('Start', start);
    params = params.set('End', end);

    return this.http.get<CommonResponse<StatisticSummaryDateRange[]>>(
      `${this.baseUrl}Statistic/GetSummary_DateRange`,
      { params }
    );
  }





  /**
   * Lấy tổng hợp thống kê phim
   */
  getMovieSummaryDateRange(startDate?: Date, endDate?: Date): Observable<CommonResponse<MovieStatisticSummaryDateRange[]>> {
    let params = new HttpParams();

    // Mặc định lấy tất cả dữ liệu nếu không có ngày
    const start = startDate ? (this.formatDate(startDate) || '01-01-1900') : '01-01-1900';
    const end = endDate ? (this.formatDate(endDate) || '12-31-2999') : '12-31-2999';

    params = params.set('Start', start);
    params = params.set('End', end);

    return this.http.get<CommonResponse<MovieStatisticSummaryDateRange[]>>(
      `${this.baseUrl}Statistic/GetMovieSummary_DateRange`,
      { params }
    );
  }

  /**
   * Lấy tổng hợp thống kê dịch vụ
   */
  getServiceSummaryDateRange(startDate?: Date, endDate?: Date): Observable<CommonResponse<ServiceStatisticSummaryDateRange[]>> {
    let params = new HttpParams();

    // Mặc định lấy tất cả dữ liệu nếu không có ngày
    const start = startDate ? (this.formatDate(startDate) || '01-01-1900') : '01-01-1900';
    const end = endDate ? (this.formatDate(endDate) || '12-31-2999') : '12-31-2999';

    params = params.set('Start', start);
    params = params.set('End', end);

    return this.http.get<CommonResponse<ServiceStatisticSummaryDateRange[]>>(
      `${this.baseUrl}Statistic/GetServiceSummary_DateRange`,
      { params }
    );
  }

  /**
   * Lấy chi tiết tổng hợp thống kê theo khoảng thời gian
   */
  getSummaryDateRangeDetail(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticSummaryDateRangeDetail[]>> {
    let params = new HttpParams();

    // Mặc định lấy tất cả dữ liệu nếu không có ngày
    const start = startDate ? (this.formatDate(startDate) || '01-01-1900') : '01-01-1900';
    const end = endDate ? (this.formatDate(endDate) || '12-31-2999') : '12-31-2999';

    params = params.set('Start', start);
    params = params.set('End', end);

    return this.http.get<CommonResponse<StatisticSummaryDateRangeDetail[]>>(
      `${this.baseUrl}Statistic/GetSummary_DateRange_Detail`,
      { params }
    );
  }

  /**
   * Lấy chi tiết doanh thu theo rạp và thời gian
   */
  getRevenueDetail(cinemasId?: string, startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticRevenueDetail[]>> {
    let params = new HttpParams();

    // Thêm tham số CinemasID nếu có
    if (cinemasId) {
      params = params.set('CinemasID', cinemasId);
    }

    // Mặc định lấy tất cả dữ liệu nếu không có ngày
    const start = startDate ? (this.formatDate(startDate) || '01-01-1900') : '01-01-1900';
    const end = endDate ? (this.formatDate(endDate) || '12-31-2999') : '12-31-2999';

    params = params.set('Start', start);
    params = params.set('End', end);

    return this.http.get<CommonResponse<StatisticRevenueDetail[]>>(
      `${this.baseUrl}Statistic/GetRevenueDetail`,
      { params }
    );
  }
}

