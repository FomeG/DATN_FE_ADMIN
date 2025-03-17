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
  status: number;
  movieName: string;
  roomName: string;
}

export interface ShowtimeResponse {
  data: Showtime[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class ShowtimeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getShowtimes(movieId: string, roomId: string, currentPage: number, recordPerPage: number): Observable<ShowtimeResponse> {
    let url = `${this.apiUrl}ShowTime/GetListShowTimes?currentPage=${currentPage}&recordPerPage=${recordPerPage}`;

    url += '&status=1,2';
    if (movieId) {
      url += `&movieId=${movieId}`;
    }
    if (roomId) {
      url += `&roomId=${roomId}`;
    }

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