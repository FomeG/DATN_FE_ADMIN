import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  movieName: string;
  duration: number;
  roomName: string;
  status: number;
  isDeleted?: boolean;
}

export interface ShowtimeResponse {
  responseCode: number;
  message: string;
  data: Showtime[];
  totalRecord: number;
}

export interface ShowtimeParams {
  movieId?: string;
  roomId?: string;
  search?: string;
  currentPage: number;
  recordPerPage: number;
  startDate?: string;
  endDate?: string;
  status?: number;
  startTimeFilter?: string;
  endTimeFilter?: string;
  [key: string]: any; // Cho phép thêm các tham số khác
}


export interface ShowtimeAutoDateRequest {
  cinemasId: string;
  roomId: string;
  date: string;
  movieId: string;
}

export interface ShowtimeAutoDateResponse {
  responseCode: number;
  message: string;
  data: {
    id: string;
    cinemasId: string;
    roomId: string;
    name: string;
    startTime: string;
    endTime: string;
    movieId: string;
  };
}


export interface ShowtimeAutoDateRequest {
  cinemasId: string;
  roomId: string;
  date: string;
  movieId: string;
}

export interface ShowtimeAutoDateResponse {
  responseCode: number;
  message: string;
  data: {
    id: string;
    cinemasId: string;
    roomId: string;
    name: string;
    startTime: string;
    endTime: string;
    movieId: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ShowtimeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getShowtimes(params: ShowtimeParams): Observable<ShowtimeResponse> {
    let url = `${this.apiUrl}ShowTime/GetList?currentPage=${params.currentPage}&recordPerPage=${params.recordPerPage}`;

    // Thêm các tham số lọc nếu có
    if (params.movieId) {
      url += `&movieId=${params.movieId}`;
    }

    if (params.roomId) {
      url += `&roomId=${params.roomId}`;
    }

    if (params.search) {
      url += `&search=${encodeURIComponent(params.search)}`;
    }

    if (params.status !== undefined && params.status !== -1) {
      url += `&status=${params.status}`;
    }

    if (params.startDate) {
      url += `&startDate=${encodeURIComponent(params.startDate)}`;
    }

    if (params.endDate) {
      url += `&endDate=${encodeURIComponent(params.endDate)}`;
    }

    // Thêm các tham số thời gian cụ thể hơn
    if (params.startTimeFilter) {
      url += `&startTimeFilter=${encodeURIComponent(params.startTimeFilter)}`;
    }

    if (params.endTimeFilter) {
      url += `&endTimeFilter=${encodeURIComponent(params.endTimeFilter)}`;
    }

    console.log('Calling API with URL:', url);

    return this.http.get<ShowtimeResponse>(url);
  }

  createShowtime(showtimeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/Create`, showtimeData);
  }

  updateShowtime(id: string, showtimeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/Update/${id}`, showtimeData);
  }

  deleteShowtime(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/Delete/${id}`, {});
  }

  updateShowtimeStatus(id: string, status: number): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/UpdateShowTimeStatus?id=${id}&status=${status}`, {});
  }

  getShowtimesByStatus(status: number): Observable<ShowtimeResponse> {
    return this.http.get<ShowtimeResponse>(`${this.apiUrl}ShowTime/GetByStatus/${status}`);
  }



  showtimeAutoDate(request: ShowtimeAutoDateRequest): Observable<ShowtimeAutoDateResponse> {
    // Mã hóa URL cho tham số date để xử lý đúng định dạng datetime-local
    const encodedDate = encodeURIComponent(request.date);
    console.log('Calling GetAutoDate with date:', request.date, 'encoded:', encodedDate);
    return this.http.get<ShowtimeAutoDateResponse>(`${this.apiUrl}ShowTime/GetAutoDate?CinemasId=${request.cinemasId}&RoomId=${request.roomId}&Date=${encodedDate}&MovieId=${request.movieId}`);
  }



  getShowtimeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ShowTime/GetById/${id}`);
  }


  showtimeCronJob(): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/ShowtimeCronjob`, {});
  }

  // Phương thức kiểm tra API lọc theo ngày
  testDateFilter(startDate: string, endDate: string): Observable<ShowtimeResponse> {
    const url = `${this.apiUrl}ShowTime/GetList?currentPage=1&recordPerPage=100&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    console.log('Testing date filter with URL:', url);
    return this.http.get<ShowtimeResponse>(url);
  }

  // Phương thức lấy tất cả dữ liệu showtime (không phân trang)
  getAllShowtimes(): Observable<ShowtimeResponse> {
    // Lấy số lượng lớn để đảm bảo lấy tất cả dữ liệu
    const url = `${this.apiUrl}ShowTime/GetList?currentPage=1&recordPerPage=1000`;
    console.log('Getting all showtimes with URL:', url);
    return this.http.get<ShowtimeResponse>(url);
  }

}