import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface Cinema {
  cinemasId: string;
  name: string;
  address: string;
  phoneNumber: string;
  totalRooms: number;
  status: number;
  createdDate: Date;
  isdeleted: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CreateCinemaRequest {
  name: string;
  address: string;
  phoneNumber: string;
  totalRooms: number;
  status: number;
  createdDate: Date;
  latitude?: number;
  longitude?: number;
}

export interface UpdateCinemaRequest {
  name: string;
  address: string;
  phoneNumber: string;
  totalRooms: number;
  status: number;
  createdDate: Date;
  latitude?: number;
  longitude?: number;
}

export interface CinemaResponse {
  responseCode: number;
  message: string;
  data: Cinema[];
  totalRecord: number;
}

export interface CommonPagination<T> {
  data: T[];
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class CinemaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCinemas(currentPage: number, recordPerPage: number): Observable<CinemaResponse> {
    return this.http.get<CinemaResponse>(`${this.apiUrl}Cinemas/GetListCinemas?currentPage=${currentPage}&recordPerPage=${recordPerPage}`).pipe(
      map(response => {
        // Lọc ra các cinema chưa bị xóa
        const nonDeletedCinemas = response.data.filter(cinema => !cinema.isdeleted);
        return {
          ...response,
          data: nonDeletedCinemas,
          totalRecord: nonDeletedCinemas.length
        };
      })
    );
  }

  getCinemasByName(name: string, currentPage: number, recordPerPage: number): Observable<CinemaResponse> {
    return this.http.get<CinemaResponse>(`${this.apiUrl}Cinemas/GetListCinemasByName?nameCinemas=${name}&currentPage=${currentPage}&recordPerPage=${recordPerPage}`).pipe(
      map(response => {
        // Lọc ra các cinema chưa bị xóa
        const nonDeletedCinemas = response.data.filter(cinema => !cinema.isdeleted);
        return {
          ...response,
          data: nonDeletedCinemas,
          totalRecord: nonDeletedCinemas.length
        };
      })
    );
  }

  getCinemaById(id: string): Observable<CinemaResponse> {
    return this.http.get<CinemaResponse>(`${this.apiUrl}Cinemas/GetCinemaById?IdCinemasReq=${id}`);
  }

  createCinema(cinemaData: CreateCinemaRequest): Observable<CinemaResponse> {
    return this.http.post<CinemaResponse>(`${this.apiUrl}Cinemas/CreateCinemas`, cinemaData);
  }

  updateCinema(id: string, cinemaData: UpdateCinemaRequest): Observable<CinemaResponse> {
    return this.http.post<CinemaResponse>(`${this.apiUrl}Cinemas/UpdateCinemas?IdCinemasReq=${id}`, cinemaData);
  }

  deleteCinema(id: string): Observable<CinemaResponse> {
    return this.http.post<CinemaResponse>(`${this.apiUrl}Cinemas/DeleteCinema?id=${id}`, {});
  }
} 