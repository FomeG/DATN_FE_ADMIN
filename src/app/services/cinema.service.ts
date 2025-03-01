import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cinema {
  cinemasId: string;
  name: string;
  address: string;
  phoneNumber: string;
  totalRooms: number;
  status: number;
  createdDate: Date;
}

export interface CinemaResponse {
  data: Cinema[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class CinemaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getCinemas(currentPage: number, recordPerPage: number): Observable<CinemaResponse> {
    return this.http.get<CinemaResponse>(`${this.apiUrl}Cinemas/GetListCinemas?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getCinemasByName(name: string, currentPage: number, recordPerPage: number): Observable<CinemaResponse> {
    return this.http.get<CinemaResponse>(`${this.apiUrl}Cinemas/GetListCinemasByName?nameCinemas=${name}&currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  createCinema(cinemaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}Cinemas/CreateCinemas`, cinemaData);
  }

  updateCinema(id: string, cinemaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}Cinemas/UpdateCinemas?IdCinemasReq=${id}`, cinemaData);
  }

  updateCinemaAddress(id: string, newAddress: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Cinemas/UpdateCinemasAddress?IdCinemasReq=${id}&newAddress=${newAddress}`, {});
  }

  getCinemaById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}Cinemas/GetCinemaById?IdCinemasReq=${id}`);
  }
}