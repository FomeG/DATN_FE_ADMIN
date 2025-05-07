import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MembershipBenefitService {
  private apiUrl = `${environment.apiUrl}MembershipBenefit`;

  constructor(private http: HttpClient) { }

  getAllBenefits(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetAll`);
  }

  getBenefitsByMembershipId(membershipId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetByMembershipId/${membershipId}`);
  }

  getBenefitById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetById/${id}`);
  }

  createBenefit(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/Create`, formData);
  }

  updateBenefit(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/Update/${id}`, formData);
  }

  deleteBenefit(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/Delete/${id}`, {});
  }
}
