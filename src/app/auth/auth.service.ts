import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoginResponse, LoginRequest } from '../model/auth.model'
import { User } from '../model/user.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7263/api/Account';
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';


  // BehaviorSubject để theo dõi user hiện tại
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();



  constructor(private http: HttpClient) {
    // Khôi phục user từ localStorage nếu có
    const savedUser = localStorage.getItem(this.userKey);
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      useName: username,
      passWord: password
    };

    return this.http.post<LoginResponse>(`${this.apiUrl}/Login`, loginData)
      .pipe(
        tap(response => {
          if (response.responseCode === 200) {
            localStorage.setItem(this.tokenKey, response.data.accessToken);
            localStorage.setItem(this.refreshTokenKey, response.data.refreshToken);
            
            // Lưu thông tin user
            const user: User = {
              userId: response.data.userId,
              userName: response.data.userName,
              displayName: response.data.displayName,
              roles: response.data.roles
            };
            localStorage.setItem(this.userKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }


  // getCurrentUser(): any {
  //   const userString = localStorage.getItem(this.userKey);
  //   return userString ? JSON.parse(userString) : null;
  // }
}