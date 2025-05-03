import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Movie {
  id: string;
  movieName: string;
  description: string;
  thumbnail: string;
  banner: string;
  trailer: string;
  duration: number;
  status: number;
  releaseDate: Date;
  importDate: Date; // ngày nhập phim vào hệ thống
  endDate: Date; // ngày hết hạn của phim
  listdienvien: Actor[];
  genres: Genre[];
  averageRating: number;
  ageRatingId?: string;
  ageRatingCode?: string;
  formats: MovieFormat[];
}

export interface Actor {
  id: string;
  name: string;
  dateOfBirth: Date;
  biography: string;
  photo: string;
  status: number;
  movieId: string;
}

export interface Genre {
  id: string;
  genreName: string;
  status: number;
}

export interface MovieFormat {
  formatId: string;
  name: string;
  description: string;
}

export interface MovieListResponse {
  data: Movie[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

export interface MovieDetailResponse {
  data: Movie;
  message: string;
  responseCode: number;
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

  getMovieById(id: string): Observable<MovieDetailResponse> {
    return this.http.get<MovieDetailResponse>(`${this.apiUrl}Movie/GetMovieDetail?Id=${id}`);
  }

  updateMovie(id: string, movieData: FormData): Observable<any> {
    // Không cần thêm MovieID vào URL vì đã có trong FormData
    return this.http.post(`${this.apiUrl}Movie/UpdateMovie`, movieData);
  }


  getMovies(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Movie/GetMovieList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }



  getMovieGenres(movieId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/Movie/GetMovieGenres?id=${movieId}`);
  }
}
