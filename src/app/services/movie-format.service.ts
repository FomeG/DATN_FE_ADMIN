import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MovieFormat {
  formatId: string;
  name: string;
  description: string;
  status: number;
}

export interface MovieFormatMovie {
  movieId: string;
  formatId: string;
  movieName: string;
  formatName: string;
}

export interface MovieFormatListResponse {
  data: MovieFormat[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

export interface MovieFormatDetailResponse {
  data: MovieFormat;
  message: string;
  responseCode: number;
}

export interface MovieFormatMovieListResponse {
  data: MovieFormatMovie[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class MovieFormatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getMovieFormatList(currentPage: number, recordPerPage: number): Observable<MovieFormatListResponse> {
    return this.http.get<MovieFormatListResponse>(`${this.apiUrl}MovieFormat/GetMovieFormats?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getMovieFormatById(id: string): Observable<MovieFormatDetailResponse> {
    return this.http.get<MovieFormatDetailResponse>(`${this.apiUrl}MovieFormat/GetById?id=${id}`);
  }

  createMovieFormat(movieFormat: { name: string; description: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}MovieFormat/CreateMovieFormat`, movieFormat);
  }

  updateMovieFormat(movieFormat: MovieFormat): Observable<any> {
    return this.http.post(`${this.apiUrl}MovieFormat/UpdateMovieFormat`, movieFormat);
  }

  deleteMovieFormat(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}MovieFormat/DeleteMovieFormat?id=${id}`, {});
  }

  getMovieFormatsByMovieId(movieId: string): Observable<MovieFormatMovieListResponse> {
    return this.http.get<MovieFormatMovieListResponse>(`${this.apiUrl}MovieFormat/GetByMovieId?movieId=${movieId}`);
  }

  getMoviesByFormatId(formatId: string, currentPage: number, recordPerPage: number): Observable<MovieFormatMovieListResponse> {
    return this.http.get<MovieFormatMovieListResponse>(`${this.apiUrl}MovieFormat/GetMoviesByFormatId?formatId=${formatId}&currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  assignFormatToMovie(movieId: string, formatId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}MovieFormat/AssignToMovie`, { movieId, formatId });
  }

  removeFormatFromMovie(movieId: string, formatId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}MovieFormat/RemoveFromMovie`, { movieId, formatId });
  }
}
