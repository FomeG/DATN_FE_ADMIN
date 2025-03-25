import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StatisticTopServicesRes {
    serviceName: string;
    totalSold: number;
    totalRevenue: number;
}

export interface StatisticCustomerGenderRes {
    gender: string;
    totalCustomers: number;
    totalSpent: number;
}

export interface StatisticPeakHoursRes {
    hourOfDay: number;
    totalTicketsSold: number;
}

export interface StatisticPopularGenresRes {
    genreName: string;
    totalShowtimes: number;
    totalRevenue: number;
}

export interface StatisticRevenueByCinemaRes {
    cinemaName: string;
    totalTickets: number;
    totalRevenue: number;
    totalShowtimes: number;
}

export interface StatisticRevenueByTimeRes {
    date: string;
    totalTickets: number;
    totalRevenue: number;
    totalShowtimes: number;
}

export interface StatisticSeatOccupancyRes {
    startTime: string;
    movieName: string;
    totalSeats: number;
    bookedSeats: number;
    occupancyRate: number;
}

export interface CommonResponse<T> {
    responseCode: number;
    message: string;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class StatisticService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) { 
        // Đảm bảo baseUrl không kết thúc bằng dấu /
        this.baseUrl = this.baseUrl.endsWith('/') 
            ? this.baseUrl.slice(0, -1) 
            : this.baseUrl;
    }

    /**
     * Lấy thống kê top dịch vụ bán chạy nhất
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @returns Top dịch vụ bán chạy nhất
     */
    getTopServices(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticTopServicesRes[]>> {
        let params = new HttpParams();
        
        if (startDate) {
            // Chuyển đổi theo định dạng yyyy-MM-dd
            const formattedStart = startDate.toISOString().split('T')[0];
            params = params.append('startDate', formattedStart);
        }
        
        if (endDate) {
            // Chuyển đổi theo định dạng yyyy-MM-dd
            const formattedEnd = endDate.toISOString().split('T')[0];
            params = params.append('endDate', formattedEnd);
        }
        
        return this.http.get<CommonResponse<StatisticTopServicesRes[]>>(
            `${this.baseUrl}/Statistic/GetTopServices`,
            { params }
        );
    }

    // Định dạng ngày thành chuỗi yyyy-MM-dd trước khi gửi đến API
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    // Lấy thống kê giới tính khách hàng
    getCustomerGender(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticCustomerGenderRes[]>> {
        let params = new HttpParams();
        
        if (startDate) {
            params = params.set('startDate', this.formatDate(startDate));
        }
        
        if (endDate) {
            params = params.set('endDate', this.formatDate(endDate));
        }
        
        return this.http.get<CommonResponse<StatisticCustomerGenderRes[]>>(`${this.baseUrl}/Statistic/GetCustomerGender`, { params });
    }

    /**
     * Lấy thống kê giờ cao điểm
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @returns Thống kê số lượng vé bán theo giờ trong ngày
     */
    getPeakHours(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticPeakHoursRes[]>> {
        let params = new HttpParams();
        
        if (startDate) {
            params = params.set('startDate', this.formatDate(startDate));
        }
        
        if (endDate) {
            params = params.set('endDate', this.formatDate(endDate));
        }
        
        return this.http.get<CommonResponse<StatisticPeakHoursRes[]>>(`${this.baseUrl}/Statistic/GetPeakHours`, { params });
    }

    /**
     * Lấy thống kê thể loại phim phổ biến
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @returns Thống kê về thể loại phim phổ biến
     */
    getPopularGenres(startDate?: Date, endDate?: Date): Observable<CommonResponse<StatisticPopularGenresRes[]>> {
        let params = new HttpParams();
        
        if (startDate) {
            params = params.append('startDate', startDate.toISOString().split('T')[0]);
        }
        
        if (endDate) {
            params = params.append('endDate', endDate.toISOString().split('T')[0]);
        }
        
        return this.http.get<CommonResponse<StatisticPopularGenresRes[]>>(`${this.baseUrl}/Statistic/GetPopularGenres`, { params });
    }

    getRevenueByCinema(
        startDate?: Date,
        endDate?: Date
    ): Observable<CommonResponse<StatisticRevenueByCinemaRes[]>> {
        let params = new HttpParams();

        if (startDate) {
            params = params.append('startDate', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
            params = params.append('endDate', endDate.toISOString().split('T')[0]);
        }

        return this.http.get<CommonResponse<StatisticRevenueByCinemaRes[]>>(
            `${this.baseUrl}/Statistic/GetRevenueByCinema`,
            { params }
        );
    }

    getRevenueByTime(
        timeType: string = 'day',
        startDate?: Date,
        endDate?: Date
    ): Observable<CommonResponse<StatisticRevenueByTimeRes[]>> {
        let params = new HttpParams();
        
        // Loại thời gian: day, week, month, year
        params = params.append('timeType', timeType);

        if (startDate) {
            params = params.append('startDate', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
            params = params.append('endDate', endDate.toISOString().split('T')[0]);
        }

        return this.http.get<CommonResponse<StatisticRevenueByTimeRes[]>>(
            `${this.baseUrl}/Statistic/GetRevenueByTime`,
            { params }
        );
    }

    /**
     * Lấy thống kê tỷ lệ lấp đầy ghế
     * @param startDate Ngày bắt đầu
     * @param endDate Ngày kết thúc
     * @param cinemaId ID của rạp (tùy chọn)
     * @returns Thống kê tỷ lệ lấp đầy ghế theo rạp và thời gian
     */
    getSeatOccupancy(
        startDate?: Date,
        endDate?: Date,
        cinemaId?: string
    ): Observable<CommonResponse<StatisticSeatOccupancyRes[]>> {
        let params = new HttpParams();

        if (startDate) {
            params = params.append('startDate', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
            params = params.append('endDate', endDate.toISOString().split('T')[0]);
        }
        if (cinemaId) {
            params = params.append('cinemaId', cinemaId);
        }

        return this.http.get<CommonResponse<StatisticSeatOccupancyRes[]>>(
            `${this.baseUrl}/Statistic/GetSeatOccupancy`,
            { params }
        );
    }
} 