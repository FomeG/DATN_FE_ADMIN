import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Service, ServiceResponse, CreateServiceRequest, UpdateServiceRequest } from '../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceManagementService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get all services with pagination
  getServices(currentPage: number, recordPerPage: number): Observable<ServiceResponse> {
    return this.http.get<ServiceResponse>(`${this.apiUrl}Service/GetService?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  // Get service by ID
  getServiceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Service/GetServiceById?id=${id}`);
  }

  // Create new service
  createService(data: CreateServiceRequest): Observable<any> {
    const formData = new FormData();
    
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    
    // Append other data as query parameters
    const url = `${this.apiUrl}Service/CreateService?serviceName=${encodeURIComponent(data.serviceName)}&description=${encodeURIComponent(data.description)}&price=${data.price}&serviceTypeID=${data.serviceTypeID}`;
    
    return this.http.post<any>(url, formData);
  }

  // Update service
  updateService(data: UpdateServiceRequest): Observable<any> {
    const formData = new FormData();
    
    if (data.photo) {
      formData.append('photo', data.photo);
    }
    
    // Append other data as query parameters
    const url = `${this.apiUrl}Service/UpdateService?id=${data.id}&serviceName=${encodeURIComponent(data.serviceName)}&description=${encodeURIComponent(data.description)}&price=${data.price}&serviceTypeID=${data.serviceTypeID}`;
    
    return this.http.post<any>(url, formData);
  }

  // Delete service
  deleteService(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Service/DeleteService`, { id });
  }

  // Get service types (for dropdown)
  getServiceTypes(currentPage: number, recordPerPage: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Service/GetServiceTypeList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }
}