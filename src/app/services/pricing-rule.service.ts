import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PricingRule {
  pricingRuleId: string;
  ruleName: string;
  multiplier: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  date: string;
  specialDay: number | null;
  specialMonth: number | null;
  dayOfWeek: number | null;
  isDiscount: boolean | null;
}

export interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
}

export interface CommonPagination<T> extends CommonResponse<T> {
  totalRecord: number;
}

@Injectable({
  providedIn: 'root'
})
export class PricingRuleService {
  private apiUrl = environment.apiUrl.endsWith('/') 
    ? `${environment.apiUrl}PricingRule`
    : `${environment.apiUrl}/PricingRule`;

  constructor(private http: HttpClient) { }

  getAllRules(currentPage: number, recordPerPage: number): Observable<CommonPagination<PricingRule[]>> {
    const params = new HttpParams()
      .set('currentPage', currentPage.toString())
      .set('recordPerPage', recordPerPage.toString());
    
    return this.http.get<CommonPagination<PricingRule[]>>(`${this.apiUrl}/GetAllRule`, { params });
  }

  createRule(rule: Omit<PricingRule, 'pricingRuleId'>): Observable<CommonResponse<null>> {
    return this.http.post<CommonResponse<null>>(`${this.apiUrl}/CreateRule`, rule);
  }

  updateRuleMultiplier(pricingRuleId: string, multiplier: number): Observable<CommonResponse<null>> {
    return this.http.post<CommonResponse<null>>(`${this.apiUrl}/UpdateRule`, {
      pricingRuleId,
      multiplier
    });
  }

  deleteRule(pricingRuleId: string): Observable<CommonResponse<null>> {
    return this.http.post<CommonResponse<null>>(`${this.apiUrl}/DeleteRule?id=${pricingRuleId}`, {});
  }
} 