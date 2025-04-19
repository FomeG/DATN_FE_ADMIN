import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MembershipService {
  private apiUrl = `${environment.apiUrl}Membership`;

  constructor(private http: HttpClient) { }

  getAllMemberships(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetAllMembership`);
  }

  getMembershipById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetById/${id}`);
  }
}
