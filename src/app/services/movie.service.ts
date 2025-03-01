import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Movie {
  id: string;
  movieName: string;
  description: string;
  thumbnail: string;
  trailer: string;
  duration: number;
  status: number;
  releaseDate: Date;
}

export interface MovieListResponse {
  data: Movie[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getMovieList(currentPage: number, recordPerPage: number): Observable<MovieListResponse> {
    return this.http.get<MovieListResponse>(`${this.apiUrl}Movie/GetMovieList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  createMovie(movieData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}Movie/CreateMovie`, movieData);
  }

  deleteMovie(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Movie/DeleteMovie?id=${id}`, {});
  }

  getMovieById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}Movie/GetMovieDetail?Id=${id}`);
  }

  updateMovie(id: string, movieData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}Movie/UpdateMovie?MovieID=${id}`, movieData);
  }


  getMovies(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Movie/GetMovieList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }
}
