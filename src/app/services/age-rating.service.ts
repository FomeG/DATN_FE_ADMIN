import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AgeRating {
  ageRatingId: string;
  code: string;
  description: string;
  minAge: number;
  status: number;
}

export interface AgeRatingListResponse {
  data: AgeRating[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

export interface AgeRatingDetailResponse {
  data: AgeRating;
  message: string;
  responseCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgeRatingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAgeRatingList(currentPage: number, recordPerPage: number): Observable<AgeRatingListResponse> {
    return this.http.get<AgeRatingListResponse>(`${this.apiUrl}AgeRating/GetAgeRatings?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getAgeRatingById(id: string): Observable<AgeRatingDetailResponse> {
    return this.http.get<AgeRatingDetailResponse>(`${this.apiUrl}AgeRating/GetById?id=${id}`);
  }

  createAgeRating(ageRating: { code: string; description: string; minimumAge: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}AgeRating/CreateAgeRating`, ageRating);
  }

  updateAgeRating(ageRating: { ageRatingId: string; code: string; description: string; minimumAge: number; status?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}AgeRating/UpdateAgeRating`, ageRating);
  }

  deleteAgeRating(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}AgeRating/DeleteAgeRating?id=${id}`, {});
  }
}
