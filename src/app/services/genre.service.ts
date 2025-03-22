import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Genre {
  id: string;
  genreName: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class GenreService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getGenres(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Genre/GetGenreList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getGenreById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Genre/GetGenreById?id=${id}`);
  }

  createGenre(genre: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Genre/CreateGenre`, genre);
  }

  updateGenre(id: string, genre: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}Genre/UpdateGenre?id=${id}`, genre);
  }

  deleteGenre(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}Genre/DeleteGenre?id=${id}`);
  }
}