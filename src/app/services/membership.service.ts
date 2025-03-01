import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Membership {
  id: string;
  name: string;
  description: string;
  discountPercentage: number;
  monthlyFee: number;
  durationMonths: number;
  createdDate: Date;
  status: number;
}

export interface MembershipResponse {
  data: Membership[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getMemberships(currentPage: number, recordPerPage: number): Observable<MembershipResponse> {
    return this.http.get<MembershipResponse>(`${this.apiUrl}Membership/GetMembershipList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  createMembership(membershipData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}Membership/CreateMembership`, membershipData);
  }

  updateMembership(membershipData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}Membership/UpdateMembership`, membershipData);
  }

  deleteMembership(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Membership/DeleteMembership?id=${id}`, {});
  }
}