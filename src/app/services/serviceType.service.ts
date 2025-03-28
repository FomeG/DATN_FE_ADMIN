import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  serviceList: any[];
}

export interface ServiceTypeResponse {
  responseCode: number;
  message: string;
  data: ServiceType[];
  totalRecord: number;
}

export interface CreateServiceTypeRequest {
  name: string;
  description: string;
  photo?: File;
}

export interface UpdateServiceTypeRequest {
  id: string;
  name: string;
  description: string;
  photo?: File;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceTypeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getServiceTypes(currentPage: number, recordPerPage: number): Observable<ServiceTypeResponse> {
    return this.http.get<ServiceTypeResponse>(`${this.apiUrl}Service/GetServiceTypeList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  getServiceTypeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Service/GetServiceTypeById?id=${id}`);
  }

  createServiceType(data: CreateServiceTypeRequest): Observable<any> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    return this.http.post<any>(`${this.apiUrl}Service/CreateServiceType`, formData);
  }

  updateServiceType(data: UpdateServiceTypeRequest): Observable<any> {
    const formData = new FormData();
    formData.append('id', data.id);
    formData.append('name', data.name);
    formData.append('description', data.description);
    
    if (data.photo) {
      formData.append('photo', data.photo);
    }

    return this.http.post<any>(`${this.apiUrl}Service/UpdateServiceType`, formData);
  }

  deleteServiceType(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Service/DeleteServiceType`, { id });
  }
}