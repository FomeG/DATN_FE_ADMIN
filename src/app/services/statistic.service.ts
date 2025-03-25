import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StatisticTopServicesRes {
    serviceName: string;
    totalSold: number;
    totalRevenue: number;
}

export interface CommonResponse<T> {
    code: number;
    data: T;
    message: string;
    status: boolean;
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
} 