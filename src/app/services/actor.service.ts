import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Actor {
  id: string;
  name: string;
  dateOfBirth: Date;
  biography: string;
  photo: string;
  status: number; // Giữ lại để hiển thị, nhưng không sử dụng khi tạo mới hoặc cập nhật
}

export interface ActorListResponse {
  data: Actor[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getActors(currentPage: number, recordPerPage: number): Observable<ActorListResponse> {
    return this.http.get<ActorListResponse>(`${this.apiUrl}Actor/GetListActor?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  createActor(actorData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}Actor/CreateActor`, actorData);
  }

  updateActor(id: string, actorData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}Actor/UpdateActor?Id=${id}`, actorData);
  }

  deleteActor(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Actor/DeleteActor?Id=${id}`, {});
  }
}