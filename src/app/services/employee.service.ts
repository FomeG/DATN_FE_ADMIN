import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CinemaInfo {
  cinemasId: string;
  name: string;
  address: string;
  phoneNumber: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  dob: Date;
  sex: number;
  status: number;
  createdDate: Date;
  lockoutEnabled: boolean;
  lockoutEnd: string | null;
  roleName?: string;
  userName: string;
  cinemas: CinemaInfo[];
}

export interface EmployeeListResponse {
  data: Employee[];
  message: string;
  responseCode: number;
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getEmployeeList(currentPage: number, recordPerPage: number): Observable<EmployeeListResponse> {
    return this.http.get<EmployeeListResponse>(`${this.apiUrl}Employee/GetEmployeeList?currentPage=${currentPage}&recordPerPage=${recordPerPage}`);
  }

  createEmployee(employeeData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}Employee/AddEmployee`, employeeData);
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Employee/DeleteEmployee?id=${id}`, {});
  }

  getEmployeeById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}Employee/GetEmployeeDetail?Id=${id}`);
  }

  updateEmployee(id: string, employeeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}Employee/UpdateEmployee?id=${id}`, employeeData);
  }

  toggleLockoutEmployee(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}Employee/ToggleLockout?id=${id}`, {});
  }
}