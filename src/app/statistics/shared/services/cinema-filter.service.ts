import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CinemaFilterService {
  // BehaviorSubject để lưu trữ và phát tán ID rạp đã chọn
  private selectedCinemaIdSubject = new BehaviorSubject<string | null>(null);
  
  // Observable để các component có thể subscribe
  public selectedCinemaId$ = this.selectedCinemaIdSubject.asObservable();
  
  constructor() { }
  
  /**
   * Cập nhật ID rạp đã chọn
   */
  updateSelectedCinemaId(cinemaId: string | null): void {
    this.selectedCinemaIdSubject.next(cinemaId);
  }
  
  /**
   * Lấy ID rạp đã chọn hiện tại
   */
  getCurrentSelectedCinemaId(): string | null {
    return this.selectedCinemaIdSubject.value;
  }
}
