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

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();



  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem(this.userKey);
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const loginData: LoginRequest = {
      userName: username,
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
    const userString = localStorage.getItem(this.userKey);
    if (userString) {
      return JSON.parse(userString) as User;
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    // Basic check for token existence
    return !!token;
    
    // If you want a more sophisticated check that also validates token expiration:
    // return !!token && !this.isTokenExpired(token);
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


  private isTokenExpired(token: string): boolean {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.exp < Date.now() / 1000;
    } catch (err) {
      return true; // If there's an error decoding, consider the token invalid
    }
  }
}