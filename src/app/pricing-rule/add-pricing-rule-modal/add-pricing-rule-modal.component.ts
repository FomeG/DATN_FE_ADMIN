import { Component, EventEmitter, OnInit, Output, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-pricing-rule-modal.component.html',
  styleUrl: './add-pricing-rule-modal.component.css'
})
export class AddPricingRuleModalComponent implements OnDestroy, AfterViewInit {
  @Output() ruleAdded = new EventEmitter<void>();
  @ViewChild('startTimePicker') startTimePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('endTimePicker') endTimePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('startDatePicker') startDatePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('endDatePicker') endDatePicker!: ElementRef<HTMLInputElement>;
  @ViewChild('specificDatePicker') specificDatePicker!: ElementRef<HTMLInputElement>;

  ruleForm: FormGroup;
  selectedDiscountType: string | null = null;

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

  // Reset form fields based on discount type selection
  resetFormFields(): void {
    // Reset all fields first
    this.ruleForm.patchValue({
      startTime: null,
      endTime: null,
      startDate: null,
      endDate: null,
      date: null,
      specialDay: null,
      specialMonth: null,
      dayOfWeek: null
    });

    // Xóa các trạng thái touched để không hiển thị cảnh báo
    this.ruleForm.get('startTime')?.markAsUntouched();
    this.ruleForm.get('endTime')?.markAsUntouched();
    this.ruleForm.get('startDate')?.markAsUntouched();
    this.ruleForm.get('endDate')?.markAsUntouched();
    this.ruleForm.get('date')?.markAsUntouched();
    this.ruleForm.get('specialDay')?.markAsUntouched();
    this.ruleForm.get('specialMonth')?.markAsUntouched();
    this.ruleForm.get('dayOfWeek')?.markAsUntouched();
  }

  // Xử lý khi thay đổi loại giảm giá
  onDiscountTypeChange(): void {
    // Reset tất cả các trường trước khi thiết lập loại mới
    this.resetFormFields();

    // Không cần làm gì thêm vì các trường sẽ hiển thị dựa vào selectedDiscountType trong template
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

    // 2. Kiểm tra có ít nhất một điều kiện dựa vào loại giảm giá đã chọn
    if (!this.selectedDiscountType) {
      errors.push('Vui lòng chọn kiểu giảm giá');
      return errors; // Trả về ngay vì không thể kiểm tra các điều kiện khác nếu chưa chọn loại
    }

    // Kiểm tra dựa trên loại giảm giá đã chọn
    switch (this.selectedDiscountType) {
      case 'hourly':
        // Kiểm tra thời gian
        if (!formData.startTime || !formData.endTime) {
          errors.push('Thời gian bắt đầu và kết thúc phải được nhập đầy đủ');
        } else if (formData.startTime >= formData.endTime) {
          errors.push('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
        }
        break;

      case 'dateRange':
        // Kiểm tra khoảng ngày
        if (!formData.startDate || !formData.endDate) {
          errors.push('Ngày bắt đầu và kết thúc phải được nhập đầy đủ');
        } else {
          if (new Date(formData.startDate) > new Date(formData.endDate)) {
            errors.push('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
          }
          if (new Date(formData.startDate) < new Date()) {
            errors.push('Ngày bắt đầu phải là ngày trong tương lai');
          }
        }
        break;

      case 'specificDate':
        // Kiểm tra ngày cụ thể
        if (!formData.date) {
          errors.push('Vui lòng chọn ngày cụ thể');
        } else if (new Date(formData.date) < new Date()) {
          errors.push('Ngày cụ thể phải là ngày trong tương lai');
        }
        break;

      case 'specialDay':
        // Kiểm tra ngày/tháng đặc biệt
        if (!formData.specialDay || !formData.specialMonth) {
          errors.push('Ngày và tháng đặc biệt phải được nhập đầy đủ');
        } else {
          const maxDay = new Date(new Date().getFullYear(), formData.specialMonth, 0).getDate();
          if (formData.specialDay < 1 || formData.specialDay > maxDay) {
            errors.push(`Ngày ${formData.specialDay} không hợp lệ với tháng ${formData.specialMonth}`);
          }
        }
        break;

      case 'weekday':
        // Kiểm tra ngày trong tuần
        if (!formData.dayOfWeek) {
          errors.push('Vui lòng chọn ngày trong tuần');
        } else if (formData.dayOfWeek < 1 || formData.dayOfWeek > 7) {
          errors.push('Ngày trong tuần phải từ 1 đến 7');
        }
        break;
    }

    // Kiểm tra hệ số
    if (formData.multiplier <= 0) {
      errors.push('Hệ số phải lớn hơn 0');
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
    // Kiểm tra xem đã chọn loại giảm giá chưa
    if (!this.selectedDiscountType) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Vui lòng chọn kiểu giảm giá',
        icon: 'error',
        confirmButtonText: 'Đóng'
      });
      return;
    }

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
        startTime: this.selectedDiscountType === 'hourly' ? formValue.startTime || null : null,
        endTime: this.selectedDiscountType === 'hourly' ? formValue.endTime || null : null,

        // Đảm bảo ngày là null nếu không có giá trị
        startDate: this.selectedDiscountType === 'dateRange' ? formValue.startDate || null : null,
        endDate: this.selectedDiscountType === 'dateRange' ? formValue.endDate || null : null,
        date: this.selectedDiscountType === 'specificDate' ? formValue.date || null : null,

        // Đảm bảo các số là null khi không có giá trị hoặc bằng 0
        // Chuyển đổi sang string vì backend yêu cầu kiểu string
        specialDay: this.selectedDiscountType === 'specialDay' ? (formValue.specialDay > 0 ? formValue.specialDay.toString() : null) : null,
        specialMonth: this.selectedDiscountType === 'specialDay' ? (formValue.specialMonth > 0 ? formValue.specialMonth.toString() : null) : null,
        dayOfWeek: this.selectedDiscountType === 'weekday' ? (formValue.dayOfWeek ? formValue.dayOfWeek.toString() : null) : null
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

              // Reset loại giảm giá
              this.selectedDiscountType = null;

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