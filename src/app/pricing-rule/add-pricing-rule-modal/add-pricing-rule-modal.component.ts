import { Component, EventEmitter, OnInit, Output, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { PricingRuleService, PricingRule } from '../../services/pricing-rule.service';
import Swal from 'sweetalert2';

// Khai báo kiểu Bootstrap global để tránh lỗi typescript
declare global {
  interface Window {
    bootstrap?: any;
    $?: any;
  }
}

interface PricingRuleData {
  ruleName: string;
  multiplier: number;
  isDiscount: boolean;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  specialDay?: number;
  specialMonth?: number;
  dayOfWeek?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-add-pricing-rule-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal fade" id="addPricingRuleModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Thêm Quy Tắc Giá Mới</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="ruleForm" (ngSubmit)="onSubmit()">
              <div class="row">
                <!-- Rule Name -->
                <div class="col-md-6 mb-3">
                  <label class="form-label required">Tên Quy Tắc</label>
                  <input type="text" class="form-control" formControlName="ruleName"
                         [class.is-invalid]="ruleForm.get('ruleName')?.invalid && ruleForm.get('ruleName')?.touched">
                  <div class="invalid-feedback" *ngIf="ruleForm.get('ruleName')?.invalid && ruleForm.get('ruleName')?.touched">
                    Vui lòng nhập tên quy tắc
                  </div>
                </div>

                <!-- Multiplier -->
                <div class="col-md-6 mb-3">
                  <label class="form-label required">Hệ Số</label>
                  <input type="number" class="form-control" formControlName="multiplier" step="0.01"
                         [class.is-invalid]="ruleForm.get('multiplier')?.invalid && ruleForm.get('multiplier')?.touched">
                  <div class="invalid-feedback" *ngIf="ruleForm.get('multiplier')?.invalid && ruleForm.get('multiplier')?.touched">
                    <div *ngIf="ruleForm.get('multiplier')?.errors?.['required']">Vui lòng nhập hệ số</div>
                    <div *ngIf="ruleForm.get('multiplier')?.errors?.['min']">Hệ số phải lớn hơn 0</div>
                  </div>
                </div>

                <!-- Time Range -->
                <div class="col-md-6 mb-3 time-picker-container">
                  <label class="form-label">Thời Gian Bắt Đầu</label>
                  <div class="input-group">
                    <input type="time" class="form-control" formControlName="startTime" #startTimePicker
                           [class.is-invalid]="ruleForm.errors?.['timeRange'] && (ruleForm.get('startTime')?.touched || ruleForm.get('endTime')?.touched)">
                    <button class="btn btn-outline-secondary" type="button" (click)="confirmTimeSelection('startTime')">OK</button>
                  </div>
                </div>

                <div class="col-md-6 mb-3 time-picker-container">
                  <label class="form-label">Thời Gian Kết Thúc</label>
                  <div class="input-group">
                    <input type="time" class="form-control" formControlName="endTime" #endTimePicker
                           [class.is-invalid]="ruleForm.errors?.['timeRange'] && (ruleForm.get('startTime')?.touched || ruleForm.get('endTime')?.touched)">
                    <button class="btn btn-outline-secondary" type="button" (click)="confirmTimeSelection('endTime')">OK</button>
                  </div>
                  <div class="invalid-feedback" *ngIf="ruleForm.errors?.['timeRange'] && (ruleForm.get('startTime')?.touched || ruleForm.get('endTime')?.touched)">
                    Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc và phải nhập đủ cả hai
                  </div>
                </div>

                <!-- Date Range -->
                <div class="col-md-6 mb-3 date-picker-container">
                  <label class="form-label">Ngày Bắt Đầu</label>
                  <div class="input-group">
                    <input type="date" class="form-control" formControlName="startDate" #startDatePicker
                           [class.is-invalid]="(ruleForm.errors?.['dateRange'] || ruleForm.errors?.['startDateFuture']) && (ruleForm.get('startDate')?.touched || ruleForm.get('endDate')?.touched)">
                    <button class="btn btn-outline-secondary" type="button" (click)="confirmDateSelection('startDate')">OK</button>
                  </div>
                </div>

                <div class="col-md-6 mb-3 date-picker-container">
                  <label class="form-label">Ngày Kết Thúc</label>
                  <div class="input-group">
                    <input type="date" class="form-control" formControlName="endDate" #endDatePicker
                           [class.is-invalid]="ruleForm.errors?.['dateRange'] && (ruleForm.get('startDate')?.touched || ruleForm.get('endDate')?.touched)">
                    <button class="btn btn-outline-secondary" type="button" (click)="confirmDateSelection('endDate')">OK</button>
                  </div>
                  <div class="invalid-feedback" *ngIf="(ruleForm.errors?.['dateRange'] || ruleForm.errors?.['startDateFuture']) && (ruleForm.get('startDate')?.touched || ruleForm.get('endDate')?.touched)">
                    <div *ngIf="ruleForm.errors?.['dateRange']">Ngày bắt đầu phải nhỏ hơn ngày kết thúc và phải nhập đủ cả hai</div>
                    <div *ngIf="ruleForm.errors?.['startDateFuture']">Ngày bắt đầu phải là ngày trong tương lai</div>
                  </div>
                </div>

                <!-- Specific Date -->
                <div class="col-md-6 mb-3 date-picker-container">
                  <label class="form-label">Ngày Cụ Thể</label>
                  <div class="input-group">
                    <input type="date" class="form-control" formControlName="date" #specificDatePicker
                           [class.is-invalid]="(ruleForm.errors?.['dateFuture'] || ruleForm.errors?.['exclusiveDate']) && ruleForm.get('date')?.touched">
                    <button class="btn btn-outline-secondary" type="button" (click)="confirmDateSelection('date')">OK</button>
                  </div>
                  <div class="invalid-feedback" *ngIf="(ruleForm.errors?.['dateFuture'] || ruleForm.errors?.['exclusiveDate']) && ruleForm.get('date')?.touched">
                    <div *ngIf="ruleForm.errors?.['dateFuture']">Ngày phải là ngày trong tương lai</div>
                    <div *ngIf="ruleForm.errors?.['exclusiveDate']">Không thể chọn ngày cụ thể cùng với các điều kiện ngày khác</div>
                  </div>
                </div>

                <!-- Special Day/Month -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Ngày Đặc Biệt</label>
                  <input type="number" class="form-control" formControlName="specialDay" min="1" max="31"
                         [class.is-invalid]="(ruleForm.errors?.['specialDayMonth'] || ruleForm.errors?.['exclusiveSpecial']) && (ruleForm.get('specialDay')?.touched || ruleForm.get('specialMonth')?.touched)">
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label">Tháng Đặc Biệt</label>
                  <input type="number" class="form-control" formControlName="specialMonth" min="1" max="12"
                         [class.is-invalid]="(ruleForm.errors?.['specialDayMonth'] || ruleForm.errors?.['exclusiveSpecial']) && (ruleForm.get('specialDay')?.touched || ruleForm.get('specialMonth')?.touched)">
                  <div class="invalid-feedback" *ngIf="(ruleForm.errors?.['specialDayMonth'] || ruleForm.errors?.['exclusiveSpecial']) && (ruleForm.get('specialDay')?.touched || ruleForm.get('specialMonth')?.touched)">
                    <div *ngIf="ruleForm.errors?.['specialDayMonth']">Phải nhập đủ cả ngày và tháng đặc biệt, và ngày phải hợp lệ với tháng</div>
                    <div *ngIf="ruleForm.errors?.['exclusiveSpecial']">Không thể chọn ngày/tháng đặc biệt cùng với các điều kiện khác</div>
                  </div>
                </div>

                <!-- Day of Week -->
                <div class="col-md-6 mb-3">
                  <label class="form-label">Ngày Trong Tuần</label>
                  <select class="form-select" formControlName="dayOfWeek"
                         [class.is-invalid]="((ruleForm.get('dayOfWeek')?.errors?.['min'] || ruleForm.get('dayOfWeek')?.errors?.['max']) || ruleForm.errors?.['exclusiveDayOfWeek']) && ruleForm.get('dayOfWeek')?.touched">
                    <option [ngValue]="null">Chọn ngày</option>
                    <option [ngValue]="1">Chủ Nhật</option>
                    <option [ngValue]="2">Thứ Hai</option>
                    <option [ngValue]="3">Thứ Ba</option>
                    <option [ngValue]="4">Thứ Tư</option>
                    <option [ngValue]="5">Thứ Năm</option>
                    <option [ngValue]="6">Thứ Sáu</option>
                    <option [ngValue]="7">Thứ Bảy</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="((ruleForm.get('dayOfWeek')?.errors?.['min'] || ruleForm.get('dayOfWeek')?.errors?.['max']) || ruleForm.errors?.['exclusiveDayOfWeek']) && ruleForm.get('dayOfWeek')?.touched">
                    <div *ngIf="ruleForm.get('dayOfWeek')?.errors?.['min'] || ruleForm.get('dayOfWeek')?.errors?.['max']">Ngày trong tuần không hợp lệ</div>
                    <div *ngIf="ruleForm.errors?.['exclusiveDayOfWeek']">Không thể chọn ngày trong tuần cùng với các điều kiện khác</div>
                  </div>
                </div>

                <!-- Is Discount -->
                <div class="col-md-6 mb-3">
                  <div class="form-check mt-4">
                    <input type="checkbox" class="form-check-input" formControlName="isDiscount">
                    <label class="form-check-label required">Là Giảm Giá</label>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                <button type="submit" class="btn btn-primary" [disabled]="ruleForm.invalid || ruleForm.errors?.['noCondition']">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .required:after {
      content: ' *';
      color: red;
    }
    .invalid-feedback {
      display: block;
    }
    @media (max-width: 768px) {
      .row {
        flex-direction: column;
      }
      .col-md-6 {
        width: 100%;
      }
    }
    .date-picker-container .input-group,
    .time-picker-container .input-group {
      display: flex;
    }
    .date-picker-container .btn,
    .time-picker-container .btn {
      flex-shrink: 0;
      width: 50px;
    }
    .invalid-feedback {
      width: 100%;
      margin-top: 0.25rem;
      font-size: 0.875em;
      color: #dc3545;
    }
  `]
})
export class AddPricingRuleModalComponent implements OnDestroy, AfterViewInit {
  @Output() ruleAdded = new EventEmitter<void>();
  @ViewChild('startTimePicker') startTimePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('endTimePicker') endTimePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('startDatePicker') startDatePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('endDatePicker') endDatePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('specificDatePicker') specificDatePicker!: ElementRef<HTMLInputElement>;

  ruleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private pricingRuleService: PricingRuleService
  ) {
    this.ruleForm = this.fb.group({
      ruleName: ['', Validators.required],
      multiplier: [null, [Validators.required, Validators.min(0.01)]],
      startTime: [null],
      endTime: [null],
      startDate: [null],
      endDate: [null],
      date: [null],
      specialDay: [null],
      specialMonth: [null],
      dayOfWeek: [null],
      isDiscount: [false, Validators.required]
    }, {
      validators: [
        this.timeRangeValidator,
        this.dateRangeValidator,
        this.specialDayMonthValidator,
        this.exclusiveConditionsValidator,
        this.futureDateValidator,
        this.dayOfWeekValidator
      ]
    });
  }

  ngAfterViewInit(): void {
    // Thêm bất kỳ logic khởi tạo nào ở đây nếu cần
  }

  // Kiểm tra thời gian bắt đầu phải nhỏ hơn thời gian kết thúc
  private timeRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;

    if (startTime !== null && endTime !== null && startTime >= endTime) {
      return { timeRange: true };
    }

    if ((startTime !== null && endTime === null) || (startTime === null && endTime !== null)) {
      return { timeRange: true };
    }

    return null;
  }

  // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc và phải là ngày trong tương lai
  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (startDate !== null && endDate !== null && new Date(startDate) > new Date(endDate)) {
      return { dateRange: true };
    }

    if ((startDate !== null && endDate === null) || (startDate === null && endDate !== null)) {
      return { dateRange: true };
    }

    if (startDate !== null && new Date(startDate) < new Date()) {
      return { startDateFuture: true };
    }

    return null;
  }

  // Kiểm tra ngày cụ thể phải là ngày trong tương lai
  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    const date = control.get('date')?.value;

    if (date !== null && new Date(date) < new Date()) {
      return { dateFuture: true };
    }

    return null;
  }

  // Kiểm tra special day và month phải đi cùng nhau và hợp lệ
  private specialDayMonthValidator(control: AbstractControl): ValidationErrors | null {
    const specialDay = control.get('specialDay')?.value;
    const specialMonth = control.get('specialMonth')?.value;

    if ((specialDay !== null && specialMonth === null) || (specialDay === null && specialMonth !== null)) {
      return { specialDayMonth: true };
    }

    if (specialDay !== null && specialMonth !== null) {
      const daysInMonth = new Date(new Date().getFullYear(), specialMonth, 0).getDate();
      if (specialDay < 1 || specialDay > daysInMonth) {
        return { specialDayMonth: true };
      }
    }

    return null;
  }

  // Kiểm tra các điều kiện không thể tồn tại cùng lúc
  private exclusiveConditionsValidator(control: AbstractControl): ValidationErrors | null {
    const date = control.get('date')?.value;
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    const specialDay = control.get('specialDay')?.value;
    const specialMonth = control.get('specialMonth')?.value;
    const dayOfWeek = control.get('dayOfWeek')?.value;
    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;

    // Kiểm tra có ít nhất một điều kiện được chọn
    const hasDateCondition = date !== null ||
      (startDate !== null && endDate !== null) ||
      (specialDay !== null && specialMonth !== null) ||
      dayOfWeek !== null;
    const hasTimeCondition = startTime !== null && endTime !== null;

    if (!hasDateCondition && !hasTimeCondition) {
      return { noCondition: true };
    }

    // Specific date không thể cùng tồn tại với các điều kiện khác (ngoại trừ time range)
    if (date !== null && (specialDay !== null || specialMonth !== null || startDate !== null || endDate !== null || dayOfWeek !== null)) {
      return { exclusiveDate: true };
    }

    // Date range không thể cùng tồn tại với các điều kiện khác (ngoại trừ time range)
    if ((startDate !== null || endDate !== null) && (specialDay !== null || specialMonth !== null || date !== null || dayOfWeek !== null)) {
      return { exclusiveDateRange: true };
    }

    // Special day/month không thể cùng tồn tại với các điều kiện khác (ngoại trừ time range)
    if ((specialDay !== null || specialMonth !== null) && (startDate !== null || endDate !== null || date !== null || dayOfWeek !== null)) {
      return { exclusiveSpecial: true };
    }

    // Day of week không thể cùng tồn tại với các điều kiện khác (ngoại trừ time range)
    if (dayOfWeek !== null && (startDate !== null || endDate !== null || date !== null || specialDay !== null || specialMonth !== null)) {
      return { exclusiveDayOfWeek: true };
    }

    return null;
  }

  // Kiểm tra day of week phải từ 1-7
  private dayOfWeekValidator(control: AbstractControl): ValidationErrors | null {
    const dayOfWeek = control.get('dayOfWeek')?.value;

    if (dayOfWeek !== null && (dayOfWeek < 1 || dayOfWeek > 7)) {
      return { dayOfWeek: true };
    }

    return null;
  }

  private validateFormData(formData: any): string[] {
    const errors: string[] = [];

    // 1. Kiểm tra các trường bắt buộc
    if (!formData.ruleName || formData.multiplier === null || formData.isDiscount === null) {
      errors.push('Thiếu thông tin bắt buộc (Tên quy tắc, Hệ số, hoặc Loại giảm giá)');
    }

    // 2. Kiểm tra có ít nhất một điều kiện
    if (formData.startTime === null && formData.endTime === null &&
      formData.startDate === null && formData.endDate === null &&
      formData.date === null && formData.specialDay === null &&
      formData.specialMonth === null && formData.dayOfWeek === null) {
      errors.push('Phải có ít nhất một điều kiện về thời gian hoặc ngày');
    }

    // 3. Kiểm tra các cặp thời gian
    if ((formData.startTime !== null && formData.endTime === null) ||
      (formData.startTime === null && formData.endTime !== null)) {
      errors.push('Thời gian bắt đầu và kết thúc phải được nhập đầy đủ');
    }

    // 4. Kiểm tra cặp ngày
    if ((formData.startDate !== null && formData.endDate === null) ||
      (formData.startDate === null && formData.endDate !== null)) {
      errors.push('Ngày bắt đầu và kết thúc phải được nhập đầy đủ');
    }

    // 5. Kiểm tra cặp ngày/tháng đặc biệt
    if ((formData.specialDay !== null && formData.specialMonth === null) ||
      (formData.specialDay === null && formData.specialMonth !== null)) {
      errors.push('Ngày và tháng đặc biệt phải được nhập đầy đủ');
    }

    // 6. Kiểm tra điều kiện loại trừ cho ngày cụ thể
    if (formData.date !== null && (formData.specialDay !== null || formData.specialMonth !== null ||
      formData.startDate !== null || formData.endDate !== null || formData.dayOfWeek !== null)) {
      errors.push('Ngày cụ thể không thể kết hợp với các điều kiện ngày khác');
    }

    // 7. Kiểm tra điều kiện loại trừ cho khoảng ngày
    if ((formData.startDate !== null || formData.endDate !== null) &&
      (formData.specialDay !== null || formData.specialMonth !== null ||
        formData.date !== null || formData.dayOfWeek !== null)) {
      errors.push('Khoảng ngày không thể kết hợp với các điều kiện ngày khác');
    }

    // 8. Kiểm tra điều kiện loại trừ cho ngày/tháng đặc biệt
    if ((formData.specialDay !== null || formData.specialMonth !== null) &&
      (formData.startDate !== null || formData.endDate !== null ||
        formData.date !== null || formData.dayOfWeek !== null)) {
      errors.push('Ngày/tháng đặc biệt không thể kết hợp với các điều kiện ngày khác');
    }

    // 9. Kiểm tra điều kiện loại trừ cho ngày trong tuần
    if (formData.dayOfWeek !== null &&
      (formData.startDate !== null || formData.endDate !== null ||
        formData.date !== null || formData.specialDay !== null || formData.specialMonth !== null)) {
      errors.push('Ngày trong tuần không thể kết hợp với các điều kiện ngày khác');
    }

    // 10. Kiểm tra giá trị thời gian
    if (formData.startTime !== null && formData.endTime !== null && formData.startTime >= formData.endTime) {
      errors.push('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
    }

    // 11. Kiểm tra giá trị ngày
    if (formData.startDate !== null && formData.endDate !== null && formData.startDate > formData.endDate) {
      errors.push('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
    }

    // 12. Kiểm tra ngày trong tương lai
    if (formData.date !== null && new Date(formData.date) < new Date()) {
      errors.push('Ngày cụ thể phải là ngày trong tương lai');
    }

    if (formData.startDate !== null && new Date(formData.startDate) < new Date()) {
      errors.push('Ngày bắt đầu phải là ngày trong tương lai');
    }

    // 13. Kiểm tra hệ số
    if (formData.multiplier <= 0) {
      errors.push('Hệ số phải lớn hơn 0');
    }

    // 14. Kiểm tra ngày trong tuần
    if (formData.dayOfWeek !== null && (formData.dayOfWeek < 1 || formData.dayOfWeek > 7)) {
      errors.push('Ngày trong tuần phải từ 1 đến 7');
    }

    // 15. Kiểm tra ngày hợp lệ với tháng
    if (formData.specialDay !== null && formData.specialMonth !== null) {
      const maxDay = new Date(new Date().getFullYear(), formData.specialMonth, 0).getDate();
      if (formData.specialDay < 1 || formData.specialDay > maxDay) {
        errors.push(`Ngày ${formData.specialDay} không hợp lệ với tháng ${formData.specialMonth}`);
      }
    }

    return errors;
  }

  // Phương thức đóng modal an toàn
  private safeCloseModal(): void {
    const modalElement = document.getElementById('addPricingRuleModal');
    if (!modalElement) return;

    // Xóa tất cả các class và style liên quan đến modal
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');

    // Xóa backdrop
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].remove();
    }

    // Xóa các style và class trên body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('overflow');
  }

  onSubmit(): void {
    if (this.ruleForm.valid && !this.ruleForm.errors?.['noCondition']) {
      const formValue = this.ruleForm.value;

      // Chuẩn hóa dữ liệu để đảm bảo gửi null thay vì chuỗi rỗng hoặc số 0
      // Điều này đặc biệt quan trọng vì SP_PricingRule_Create yêu cầu các tham số
      // không được chọn phải là NULL, không phải chuỗi rỗng hoặc số 0
      const formData: Omit<PricingRule, 'pricingRuleId'> = {
        ruleName: formValue.ruleName.trim() || null,
        multiplier: formValue.multiplier,
        isDiscount: formValue.isDiscount ?? false,

        // Đảm bảo thời gian là null nếu không có giá trị
        startTime: formValue.startTime || null,
        endTime: formValue.endTime || null,

        // Đảm bảo ngày là null nếu không có giá trị
        startDate: formValue.startDate || null,
        endDate: formValue.endDate || null,
        date: formValue.date || null,

        // Đảm bảo các số là null khi không có giá trị hoặc bằng 0
        specialDay: formValue.specialDay ? (formValue.specialDay > 0 ? formValue.specialDay : null) : null,
        specialMonth: formValue.specialMonth ? (formValue.specialMonth > 0 ? formValue.specialMonth : null) : null,
        dayOfWeek: formValue.dayOfWeek !== null ? formValue.dayOfWeek : null
      };

      // Kiểm tra validation
      const validationErrors = this.validateFormData(formData);

      if (validationErrors.length > 0) {
        console.log('Validation Errors:', validationErrors);
        Swal.fire({
          title: 'Lỗi Validation',
          html: validationErrors.map(err => `- ${err}`).join('<br>'),
          icon: 'error',
          confirmButtonText: 'Đóng'
        });
        return;
      }

      this.pricingRuleService.createRule(formData)
        .subscribe({
          next: (response) => {
            console.log('API Response:', response);
            if (response.responseCode === 0 || response.responseCode === 200) {
              // Reset form
              this.ruleForm.reset({
                isDiscount: false,
                multiplier: null,
                ruleName: '',
                startTime: null,
                endTime: null,
                startDate: null,
                endDate: null,
                date: null,
                specialDay: null,
                specialMonth: null,
                dayOfWeek: null
              });

              // Đóng modal
              this.safeCloseModal();

              // Emit sự kiện sau khi đóng modal
              this.ruleAdded.emit();

              // Hiển thị thông báo thành công
              Swal.fire({
                title: 'Thành công',
                text: 'Đã tạo quy tắc giá thành công',
                icon: 'success',
                confirmButtonText: 'Đóng'
              });
            } else {
              Swal.fire({
                title: 'Lỗi',
                text: response.message || 'Có lỗi xảy ra khi tạo quy tắc giá',
                icon: 'error',
                confirmButtonText: 'Đóng'
              });
            }
          },
          error: (error) => {
            console.error('Error creating rule:', error);
            let errorMessage = 'Không thể tạo quy tắc giá. Vui lòng thử lại sau.';
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            }
            Swal.fire({
              title: 'Lỗi',
              text: errorMessage,
              icon: 'error',
              confirmButtonText: 'Đóng'
            });
          }
        });
    } else {
      Object.keys(this.ruleForm.controls).forEach(key => {
        const control = this.ruleForm.get(key);
        control?.markAsTouched();
      });

      if (this.ruleForm.errors?.['noCondition']) {
        Swal.fire({
          title: 'Lỗi',
          text: 'Vui lòng chọn ít nhất một điều kiện',
          icon: 'error',
          confirmButtonText: 'Đóng'
        });
      } else {
        Swal.fire({
          title: 'Lỗi',
          text: 'Vui lòng kiểm tra lại thông tin nhập vào',
          icon: 'error',
          confirmButtonText: 'Đóng'
        });
      }
    }
  }

  // Phương thức xác nhận lựa chọn thời gian
  confirmTimeSelection(field: 'startTime' | 'endTime'): void {
    // Lấy giá trị hiện tại từ form control
    const value = this.ruleForm.get(field)?.value;

    // Cập nhật lại control để trigger validation
    if (value) {
      this.ruleForm.get(field)?.setValue(value);
      this.ruleForm.get(field)?.markAsTouched();

      // Đóng dropdown picker (nếu có)
      if (field === 'startTime' && this.startTimePicker) {
        this.startTimePicker.nativeElement.blur();
      } else if (field === 'endTime' && this.endTimePicker) {
        this.endTimePicker.nativeElement.blur();
      }
    }

    // Hiển thị thông báo nhỏ
    if (value) {
      this.showToast(`Đã chọn thời gian: ${value}`);
    }
  }

  // Phương thức xác nhận lựa chọn ngày
  confirmDateSelection(field: 'startDate' | 'endDate' | 'date'): void {
    // Lấy giá trị hiện tại từ form control
    const value = this.ruleForm.get(field)?.value;

    // Cập nhật lại control để trigger validation
    if (value) {
      this.ruleForm.get(field)?.setValue(value);
      this.ruleForm.get(field)?.markAsTouched();

      // Đóng dropdown picker (nếu có)
      if (field === 'startDate' && this.startDatePicker) {
        this.startDatePicker.nativeElement.blur();
      } else if (field === 'endDate' && this.endDatePicker) {
        this.endDatePicker.nativeElement.blur();
      } else if (field === 'date' && this.specificDatePicker) {
        this.specificDatePicker.nativeElement.blur();
      }
    }

    // Hiển thị thông báo nhỏ
    if (value) {
      // Định dạng ngày sang dạng thân thiện hơn
      const formattedDate = new Date(value).toLocaleDateString('vi-VN');
      this.showToast(`Đã chọn ngày: ${formattedDate}`);
    }
  }

  // Hiển thị thông báo nhỏ khi xác nhận
  private showToast(message: string): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      icon: 'success',
      title: message
    });
  }

  ngOnDestroy() {
    // Cleanup khi component bị hủy
    this.safeCloseModal();
  }
} 