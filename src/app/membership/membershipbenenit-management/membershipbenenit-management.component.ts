import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MembershipBenefit } from '../models/membership-benefit.model';
import { MembershipBenefitService } from '../../services/membership-benefit.service';
import { MembershipService } from '../../services/membership.service';
import { ServiceManagementService } from '../../services/service.service';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-membershipbenenit-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule
  ],
  templateUrl: './membershipbenenit-management.component.html',
  styleUrls: ['./membershipbenenit-management.component.css']
})
export class MembershipbenenitManagementComponent implements OnInit {
  benefits: MembershipBenefit[] = [];
  memberships: any[] = [];
  services: any[] = [];
  selectedBenefit: MembershipBenefit | null = null;
  benefitForm: FormGroup;
  isLoading = false;
  isEditing = false;
  selectedFile: File | null = null;
  previewImageUrl: string | null = null;

  // Các loại benefit
  benefitTypes = [
    { value: 'Discount', label: 'Giảm giá' },
    { value: 'PointBonus', label: 'Thưởng điểm' },
    { value: 'Service', label: 'Dịch vụ miễn phí' },
    { value: 'UsePoint', label: 'Quy đổi điểm' }
  ];

  // Các target cho Discount
  discountTargets = [
    { value: 'Ticket', label: 'Vé' },
    { value: 'Order', label: 'Đơn hàng' }
  ];

  constructor(
    private benefitService: MembershipBenefitService,
    private membershipService: MembershipService,
    private serviceService: ServiceManagementService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    this.benefitForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadMemberships();
    this.loadServices();
    this.loadBenefits();
  }

  createForm(): FormGroup {
    return this.fb.group({
      membershipId: [null, Validators.required],
      benefitType: [null, Validators.required],
      description: ['', Validators.required],

      // Cho Discount
      target: [null],
      value: [null],

      // Cho PointBonus
      multiplier: [null],

      // Cho Service
      serviceId: [null],
      quantity: [null],
      limit: [null],

      // Cho UsePoint
      usePointValue: [null]
    });
  }

  loadBenefits(): void {
    this.isLoading = true;
    this.benefitService.getAllBenefits().subscribe({
      next: (res: any) => {
        if (res.responseCode === 200) {
          this.benefits = res.data;
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Không thể tải danh sách quyền lợi',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Đã xảy ra lỗi khi tải danh sách quyền lợi',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        this.isLoading = false;
      }
    });
  }

  loadMemberships(): void {
    this.membershipService.getAllMemberships().subscribe({
      next: (res: any) => {
        if (res.responseCode === 200) {
          this.memberships = res.data;
        }
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Đã xảy ra lỗi khi tải danh sách gói thành viên',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    });
  }

  loadServices(): void {
    this.serviceService.getServices(1, 100).subscribe({
      next: (res: any) => {
        if (res.responseCode === 200) {
          this.services = res.data;
        }
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Đã xảy ra lỗi khi tải danh sách dịch vụ',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
    });
  }

  openModal(content: any, benefit?: MembershipBenefit, membershipId?: number, benefitType?: string): void {
    // Kiểm tra xem đã có quyền lợi cùng loại chưa (trừ Service)
    if (!benefit && benefitType && benefitType !== 'Service' && membershipId) {
      const existingBenefits = this.getBenefitsByType(membershipId, benefitType);
      if (existingBenefits.length > 0) {
        Swal.fire({
          title: 'Không thể thêm mới',
          text: `Mỗi loại thành viên chỉ được phép có 1 quyền lợi ${this.getBenefitTypeLabel(benefitType)}`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    this.isEditing = !!benefit;
    this.selectedBenefit = benefit || null;
    this.previewImageUrl = benefit?.logoUrl || null;
    this.selectedFile = null; // Reset selected file

    if (benefit) {
      this.benefitForm.patchValue({
        membershipId: benefit.membershipId,
        benefitType: benefit.benefitType,
        description: benefit.description,
        target: benefit.target,
        value: benefit.value,
        multiplier: benefit.multiplier,
        serviceId: benefit.serviceId,
        quantity: benefit.quantity,
        limit: benefit.limit,
        usePointValue: benefit.usePointValue
      });
    } else {
      this.benefitForm.reset();
      // Nếu có membershipId và benefitType được truyền vào, thiết lập giá trị mặc định
      if (membershipId) {
        this.benefitForm.patchValue({ membershipId: membershipId });
      }
      if (benefitType) {
        this.benefitForm.patchValue({ benefitType: benefitType });
        this.onBenefitTypeChange(); // Cập nhật validators dựa trên loại quyền lợi
      }
    }

    // Mở modal với các tùy chỉnh
    const modalRef = this.modalService.open(content, {
      size: 'md', // Giảm kích thước modal
      centered: true,
      backdrop: 'static', // Ngăn người dùng đóng modal bằng cách nhấp bên ngoài
      keyboard: true, // Cho phép đóng bằng phím Escape
      windowClass: 'benefit-modal', // Thêm class để có thể tùy chỉnh thêm
      animation: true
    });

    // Xử lý sau khi modal đóng
    modalRef.result.then(
      () => {
        // Modal đóng bằng close (thành công)
      },
      () => {
        // Modal đóng bằng dismiss (hủy)
        this.selectedBenefit = null;
        this.previewImageUrl = null;
        this.selectedFile = null;
      }
    );
  }

  onBenefitTypeChange(): void {
    const benefitType = this.benefitForm.get('benefitType')?.value;

    // Reset các trường không liên quan
    this.benefitForm.get('target')?.setValue(null);
    this.benefitForm.get('value')?.setValue(null);
    this.benefitForm.get('multiplier')?.setValue(null);
    this.benefitForm.get('serviceId')?.setValue(null);
    this.benefitForm.get('quantity')?.setValue(null);
    this.benefitForm.get('limit')?.setValue(null);
    this.benefitForm.get('usePointValue')?.setValue(null);

    // Thêm validators cho các trường tương ứng
    if (benefitType === 'Discount') {
      this.benefitForm.get('target')?.setValidators([Validators.required]);
      this.benefitForm.get('value')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
    } else if (benefitType === 'PointBonus') {
      this.benefitForm.get('multiplier')?.setValidators([Validators.required, Validators.min(0)]);
    } else if (benefitType === 'Service') {
      this.benefitForm.get('serviceId')?.setValidators([Validators.required]);
      this.benefitForm.get('quantity')?.setValidators([Validators.required, Validators.min(1)]);
      this.benefitForm.get('limit')?.setValidators([Validators.required, Validators.min(1)]);
    } else if (benefitType === 'UsePoint') {
      this.benefitForm.get('usePointValue')?.setValidators([Validators.required, Validators.min(0)]);
    }

    // Cập nhật trạng thái của form
    this.benefitForm.get('target')?.updateValueAndValidity();
    this.benefitForm.get('value')?.updateValueAndValidity();
    this.benefitForm.get('multiplier')?.updateValueAndValidity();
    this.benefitForm.get('serviceId')?.updateValueAndValidity();
    this.benefitForm.get('quantity')?.updateValueAndValidity();
    this.benefitForm.get('limit')?.updateValueAndValidity();
    this.benefitForm.get('usePointValue')?.updateValueAndValidity();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Tạo preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveBenefit(): void {
    if (this.benefitForm.invalid) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Vui lòng điền đầy đủ thông tin',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    const formData = new FormData();
    const formValue = this.benefitForm.value;

    // Thêm các trường cơ bản
    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== null && formValue[key] !== undefined) {
        formData.append(key, formValue[key]);
      }
    });

    // Thêm file nếu có
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    this.isLoading = true;

    if (this.isEditing && this.selectedBenefit) {
      // Cập nhật
      this.benefitService.updateBenefit(this.selectedBenefit.id, formData).subscribe({
        next: (res: any) => {
          if (res.responseCode === 200) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Cập nhật quyền lợi thành công',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            this.modalService.dismissAll();
            this.loadBenefits();
          } else {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: res.message || 'Cập nhật quyền lợi thất bại',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error(err);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Đã xảy ra lỗi khi cập nhật quyền lợi',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          this.isLoading = false;
        }
      });
    } else {
      // Tạo mới
      this.benefitService.createBenefit(formData).subscribe({
        next: (res: any) => {
          if (res.responseCode === 200) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Thêm quyền lợi thành công',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            this.modalService.dismissAll();
            this.loadBenefits();
          } else {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: res.message || 'Thêm quyền lợi thất bại',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error(err);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Đã xảy ra lỗi khi thêm quyền lợi',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          this.isLoading = false;
        }
      });
    }
  }

  deleteBenefit(benefit: MembershipBenefit): void {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: `Bạn có chắc chắn muốn xóa quyền lợi "${benefit.description}" không?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.benefitService.deleteBenefit(benefit.id).subscribe({
          next: (res: any) => {
            if (res.responseCode === 200) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Xóa quyền lợi thành công',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
              });
              this.loadBenefits();
            } else {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: res.message || 'Xóa quyền lợi thất bại',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
              });
            }
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: 'Đã xảy ra lỗi khi xóa quyền lợi',
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            this.isLoading = false;
          }
        });
      }
    });
  }

  getMembershipName(membershipId: number): string {
    const membership = this.memberships.find(m => m.id === membershipId);
    return membership ? membership.name : '';
  }

  getServiceName(serviceId: string | undefined): string {
    if (!serviceId) return '';
    const service = this.services.find(s => s.id === serviceId);
    return service ? service.name : '';
  }

  getBenefitTypeLabel(type: string): string {
    const benefitType = this.benefitTypes.find(t => t.value === type);
    return benefitType ? benefitType.label : type;
  }

  getDiscountTargetLabel(target: string | undefined): string {
    if (!target) return '';
    const discountTarget = this.discountTargets.find(t => t.value === target);
    return discountTarget ? discountTarget.label : target;
  }

  getBenefitsByType(membershipId: number, benefitType: string): MembershipBenefit[] {
    return this.benefits.filter(b => b.membershipId === membershipId && b.benefitType === benefitType);
  }
}
