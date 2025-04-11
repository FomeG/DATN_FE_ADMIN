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

  getShowtimes(params: {
    currentPage: number;
    recordPerPage: number;
  }): Observable<ShowtimeResponse> {
    const url = `${this.apiUrl}ShowTime/GetList?currentPage=${params.currentPage}&recordPerPage=${params.recordPerPage}`;

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
    return this.http.get<ShowtimeAutoDateResponse>(`${this.apiUrl}ShowTime/GetAutoDate?CinemasId=${request.cinemasId}&RoomId=${request.roomId}&Date=${request.date}&MovieId=${request.movieId}`);
  }



  getShowtimeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ShowTime/GetById/${id}`);
  }


  showtimeCronJob(): Observable<any> {
    return this.http.post(`${this.apiUrl}ShowTime/ShowtimeCronjob`, {});
  }

}