import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Showtime {
  id: string;
  movieId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  movieName: string;
  roomName: string;
  status?: number;
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
}

@Injectable({
  providedIn: 'root'
})
export class ShowtimeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getShowtimes(params: {
    currentPage: number;
    recordPerPage: number;
  }): Observable<ShowtimeResponse> {
    const url = `${this.apiUrl}ShowTime/GetListShowTimes?currentPage=${params.currentPage}&recordPerPage=${params.recordPerPage}`;
    
    console.log('Calling API with URL:', url);
    
    return this.http.get<ShowtimeResponse>(url);
  }

  createShowtime(showtimeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/CreateShowTime`, showtimeData);
  }

  updateShowtime(id: string, showtimeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/UpdateShowTime?ShowTimeId=${id}`, showtimeData);
  }

  deleteShowtime(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/DeleteShowTime?showTimeId=${id}`, {});
  }
}