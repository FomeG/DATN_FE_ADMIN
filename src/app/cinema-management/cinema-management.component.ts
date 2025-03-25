import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CinemaService, Cinema, CreateCinemaRequest, UpdateCinemaRequest } from '../services/cinema.service';
import Swal from 'sweetalert2';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { CinemaMapComponent } from '../cinema-map/cinema-map.component';

declare var bootstrap: any;

@Component({
    selector: 'app-cinema-management',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        NgxPaginationModule,
        CinemaMapComponent
    ],
    templateUrl: './cinema-management.component.html',
    styleUrl: './cinema-management.component.css',
    styles: [`
    ::ng-deep .modal-backdrop {
      display: none !important;
    }
    ::ng-deep body {
      overflow: auto !important;
      padding-right: 0 !important;
    }
  `]
})
export class CinemaManagementComponent implements OnInit, OnDestroy {
    cinemas: Cinema[] = [];
    filteredCinemas: Cinema[] = [];
    allCinemas: Cinema[] = [];
    currentPage = 1;
    recordPerPage = 10;
    totalRecords = 0;
    totalPages = 0;
    pages: number[] = [];
    createForm: FormGroup;
    updateForm: FormGroup;
    selectedCinema: Cinema | undefined = undefined;
    isEditing = false;
    searchTerm = '';
    statusFilter = '-1';
    private modalInstance: any;
    showAddModal = false;
    showEditModal = false;
    isSubmitting = false;
    private mapModalInstance: any;

    constructor(
        private cinemaService: CinemaService,
        private fb: FormBuilder
    ) {
        // Form validation based on stored procedure requirements
        this.createForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
            address: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
            phoneNumber: ['', [
                Validators.required,
                Validators.pattern(/^(0|84)[0-9]{9}$/),
                Validators.minLength(10),
                Validators.maxLength(11)
            ]],
            totalRooms: ['', [Validators.required, Validators.min(1)]],
            status: [1],
            createdDate: [new Date()],
            latitude: [10.8231], // Mặc định là TP.HCM
            longitude: [106.6297]
        });

        this.updateForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
            address: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
            phoneNumber: ['', [
                Validators.required,
                Validators.pattern(/^(0|84)[0-9]{9}$/),
                Validators.minLength(10),
                Validators.maxLength(11)
            ]],
            totalRooms: ['', [Validators.required, Validators.min(1)]],
            status: [1],
            createdDate: [new Date()],
            latitude: [null],
            longitude: [null]
        });
    }

    ngOnInit(): void {
        this.loadCinemas();
        this.addBackdropFixStylesheet();

        // Setup modal event listeners
        setTimeout(() => {
            this.setupModalEventListeners();
        }, 500);

        // Clean up any existing modal effects
        this.cleanupModalEffects();
    }

    ngOnDestroy(): void {
        // Clean up when component is destroyed
        this.cleanupModalEffects();

        // Remove the added stylesheet
        const styleEl = document.getElementById('cinema-backdrop-fix-style');
        if (styleEl) {
            document.head.removeChild(styleEl);
            console.log('Removed backdrop fix stylesheet');
        }
    }

    // Add stylesheet to fix modal backdrop issues
    private addBackdropFixStylesheet(): void {
        try {
            const styleEl = document.createElement('style');
            styleEl.id = 'cinema-backdrop-fix-style';
            styleEl.innerHTML = `
                .modal-backdrop {
                    display: none !important;
                    opacity: 0 !important;
                    z-index: -9999 !important;
                }
                body.modal-open {
                    overflow: auto !important;
                    padding-right: 0 !important;
                }
            `;
            document.head.appendChild(styleEl);
            console.log('Added backdrop fix stylesheet for cinema component');
        } catch (error) {
            console.error('Error adding backdrop fix stylesheet:', error);
        }
    }

    // Set up event listeners for modals
    private setupModalEventListeners(): void {
        try {
            const modalEl = document.getElementById('cinemaModal');
            if (modalEl) {
                modalEl.addEventListener('hidden.bs.modal', () => {
                    console.log('Cinema modal hidden event triggered');
                    this.cleanupModalEffects();
                });
                console.log('Cinema modal event listener registered');
            }
        } catch (error) {
            console.error('Error setting up modal event listeners:', error);
        }
    }

    // Clean up modal effects
    cleanupModalEffects(): void {
        console.log('Cleaning up cinema modal effects');

        // Remove all backdrop elements
        document.querySelectorAll('.modal-backdrop').forEach(el => {
            console.log('Removing backdrop element:', el);
            el.remove();
        });

        // Try using HTMLCollection for more thorough cleanup
        const backdrops = document.getElementsByClassName('modal-backdrop');
        while (backdrops.length > 0) {
            console.log('Removing backdrop via HTMLCollection:', backdrops[0]);
            backdrops[0].parentNode?.removeChild(backdrops[0]);
        }

        // Remove modal-open class from body
        if (document.body.classList.contains('modal-open')) {
            console.log('Removing modal-open class from body');
            document.body.classList.remove('modal-open');
        }

        // Reset body styles
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Force reset data attributes
        document.body.removeAttribute('data-bs-overflow');
        document.body.removeAttribute('data-bs-padding-right');

        console.log('Cinema modal cleanup completed');
    }

    loadCinemas(): void {
        // Luôn tải tất cả các rạp phim, sau đó sẽ lọc ở client
        this.cinemaService.getCinemas(1, 100).subscribe({
            next: (response) => {
                if (response.responseCode === 200) {
                    this.allCinemas = response.data;
                    // Áp dụng bộ lọc tìm kiếm và trạng thái
                    this.filterCinemas();
                } else {
                    Swal.fire({
                        title: 'Lỗi!',
                        text: response.message || 'Có lỗi xảy ra khi tải danh sách rạp',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                }
            },
            error: (error) => {
                Swal.fire({
                    title: 'Lỗi!',
                    text: 'Có lỗi xảy ra khi tải danh sách rạp',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    }

    filterCinemas(): void {
        // Bước 1: Lọc theo chuỗi tìm kiếm (tên hoặc địa chỉ)
        let filteredData = this.allCinemas;
        
        if (this.searchTerm && this.searchTerm.trim() !== '') {
            const searchTermLower = this.searchTerm.toLowerCase().trim();
            filteredData = filteredData.filter(cinema => 
                cinema.name.toLowerCase().includes(searchTermLower) || 
                cinema.address.toLowerCase().includes(searchTermLower)
            );
        }
        
        // Bước 2: Lọc theo trạng thái
        if (this.statusFilter !== '-1') {
            const status = parseInt(this.statusFilter, 10);
            filteredData = filteredData.filter(cinema => cinema.status === status);
        }
        
        // Cập nhật kết quả lọc
        this.cinemas = filteredData;
        this.totalRecords = this.cinemas.length;
        this.calculateTotalPages();
        
        // Nếu trang hiện tại lớn hơn tổng số trang, quay lại trang 1
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = 1;
        }
        
        // Phân trang kết quả
        const startIndex = (this.currentPage - 1) * this.recordPerPage;
        const endIndex = startIndex + this.recordPerPage;
        this.cinemas = filteredData.slice(startIndex, endIndex);
    }

    onSearch(): void {
        this.currentPage = 1;
        this.filterCinemas();
    }

    openAddModal(): void {
        try {
            console.log('Opening Add Cinema Modal');

            // Clean up any existing modal effects
            this.cleanupModalEffects();

            this.showAddModal = true;
            this.isEditing = false;
            this.selectedCinema = undefined;

            this.createForm.reset({
                status: 1,
                createdDate: new Date().toISOString().slice(0, 16)
            });

            const modalEl = document.getElementById('cinemaModal');
            if (modalEl) {
                // Dispose existing modal if any
                try {
                    const existingModal = bootstrap.Modal.getInstance(modalEl);
                    if (existingModal) {
                        existingModal.dispose();
                    }
                } catch (e) {
                    console.log('No existing modal to dispose');
                }

                // Create new modal with specific options
                this.modalInstance = new bootstrap.Modal(modalEl, {
                    backdrop: 'static', // Don't close when clicking outside
                    keyboard: true,     // Allow closing with Esc key
                    focus: true         // Auto-focus the modal
                });

                // Setup event listeners
                modalEl.addEventListener('shown.bs.modal', () => {
                    console.log('Cinema add modal shown');
                }, { once: true });

                modalEl.addEventListener('hidden.bs.modal', () => {
                    console.log('Cinema add modal hidden');
                    this.cleanupModalEffects();
                }, { once: true });

                // Show the modal
                this.modalInstance.show();
                console.log('Cinema add modal opened');
            } else {
                console.error('Modal element #cinemaModal not found');
            }
        } catch (error) {
            console.error('Error opening add cinema modal:', error);
            this.cleanupModalEffects();
        }
    }

    openEditModal(cinema: Cinema): void {
        try {
            console.log('Opening Edit Cinema Modal for cinema:', cinema.name);

            // Clean up any existing modal effects
            this.cleanupModalEffects();

            this.showEditModal = true;
            this.isEditing = true;
            this.selectedCinema = cinema;

            this.updateForm.patchValue({
                name: cinema.name,
                address: cinema.address,
                phoneNumber: cinema.phoneNumber,
                totalRooms: cinema.totalRooms,
                status: cinema.status,
                createdDate: new Date().toISOString().slice(0, 16),
                latitude: cinema.latitude || 10.8231,
                longitude: cinema.longitude || 106.6297
            });

            const modalEl = document.getElementById('cinemaModal');
            if (modalEl) {
                // Dispose existing modal if any
                try {
                    const existingModal = bootstrap.Modal.getInstance(modalEl);
                    if (existingModal) {
                        existingModal.dispose();
                    }
                } catch (e) {
                    console.log('No existing modal to dispose');
                }

                // Create new modal with specific options
                this.modalInstance = new bootstrap.Modal(modalEl, {
                    backdrop: 'static', // Don't close when clicking outside
                    keyboard: true,     // Allow closing with Esc key
                    focus: true         // Auto-focus the modal
                });

                // Setup event listeners
                modalEl.addEventListener('shown.bs.modal', () => {
                    console.log('Cinema edit modal shown');
                }, { once: true });

                modalEl.addEventListener('hidden.bs.modal', () => {
                    console.log('Cinema edit modal hidden');
                    this.cleanupModalEffects();
                }, { once: true });

                // Show the modal
                this.modalInstance.show();
                console.log('Cinema edit modal opened');
            } else {
                console.error('Modal element #cinemaModal not found');
            }
        } catch (error) {
            console.error('Error opening edit cinema modal:', error);
            this.cleanupModalEffects();
        }
    }

    closeModal(): void {
        try {
            console.log('Closing cinema modal');

            if (this.modalInstance) {
                this.modalInstance.hide();
                console.log('Modal instance hidden');
            } else {
                // Try to find and close the modal using Bootstrap API
                const modalEl = document.getElementById('cinemaModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) {
                        modal.hide();
                        console.log('Modal hidden via Bootstrap API');
                    }
                }
            }

            // Reset forms and state
            this.createForm.reset({
                status: 1
            });
            this.updateForm.reset();
            this.selectedCinema = undefined;
            this.isEditing = false;
            this.showAddModal = false;
            this.showEditModal = false;

            // Ensure modal effects are cleaned up
            setTimeout(() => {
                this.cleanupModalEffects();
            }, 100);
        } catch (error) {
            console.error('Error closing cinema modal:', error);
            this.cleanupModalEffects();
        }
    }

    onSubmit(): void {
        if (this.isEditing && this.selectedCinema) {
            if (this.updateForm.valid) {
                const updateData: UpdateCinemaRequest = {
                    ...this.updateForm.value,
                    createdDate: new Date().toISOString().slice(0, 16)
                };
                this.cinemaService.updateCinema(this.selectedCinema.cinemasId, updateData).subscribe({
                    next: (response) => {
                        if (response.responseCode === 200) {
                            Swal.fire({
                                title: 'Thành công!',
                                text: 'Cập nhật thông tin rạp thành công',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            });
                            this.closeModal();
                            this.loadCinemas();
                        } else {
                            Swal.fire({
                                title: 'Lỗi!',
                                text: response.message || 'Có lỗi xảy ra khi cập nhật thông tin rạp',
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    },
                    error: (error) => {
                        Swal.fire({
                            title: 'Lỗi!',
                            text: 'Có lỗi xảy ra khi cập nhật thông tin rạp',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                });
            }
        } else {
            if (this.createForm.valid) {
                const createData: CreateCinemaRequest = {
                    ...this.createForm.value,
                    createdDate: new Date().toISOString().slice(0, 16)
                };
                this.cinemaService.createCinema(createData).subscribe({
                    next: (response) => {
                        if (response.responseCode === 200) {
                            Swal.fire({
                                title: 'Thành công!',
                                text: 'Thêm rạp mới thành công',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            });
                            this.closeModal();
                            this.loadCinemas();
                        } else {
                            Swal.fire({
                                title: 'Lỗi!',
                                text: response.message || 'Có lỗi xảy ra khi thêm rạp mới',
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    },
                    error: (error) => {
                        Swal.fire({
                            title: 'Lỗi!',
                            text: 'Có lỗi xảy ra khi thêm rạp mới',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                });
            }
        }
    }

    onPageChange(page: number): void {
        if (page !== this.currentPage) {
            this.currentPage = page;
            this.filterCinemas();
        }
    }

    calculateTotalPages(): void {
        this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    getStatusText(status: number): string {
        switch (status) {
            case 1:
                return 'Đang hoạt động';
            case 2:
                return 'Đang bảo trì';
            case 3:
                return 'Đã đóng';
            default:
                return 'Không xác định';
        }
    }

    getStatusBadgeClass(status: number): string {
        switch (status) {
            case 1:
                return 'badge bg-success';
            case 2:
                return 'badge bg-warning';
            case 3:
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    }

    isFormValid(): boolean {
        if (this.isEditing) {
            return this.updateForm.valid;
        }
        return this.createForm.valid;
    }

    getFieldError(fieldName: string): string {
        const form = this.isEditing ? this.updateForm : this.createForm;
        const field = form.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'Trường này là bắt buộc';
            if (field.errors['minlength']) return `Độ dài tối thiểu là ${field.errors['minlength'].requiredLength} ký tự`;
            if (field.errors['maxlength']) return `Độ dài tối đa là ${field.errors['maxlength'].requiredLength} ký tự`;
            if (field.errors['min']) return `Giá trị tối thiểu là ${field.errors['min'].min}`;
            if (field.errors['pattern']) return 'Số điện thoại không hợp lệ (bắt đầu bằng 0 hoặc 84, 9-10 số)';
        }
        return '';
    }

    isFieldInvalid(fieldName: string): boolean {
        const form = this.isEditing ? this.updateForm : this.createForm;
        const field = form.get(fieldName);
        return field ? field.invalid && (field.dirty || field.touched) : false;
    }

    deleteCinema(id: string): void {
        Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Bạn không thể hoàn tác sau khi xóa!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Có, xóa nó!',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                this.cinemaService.deleteCinema(id).subscribe({
                    next: (response) => {
                        if (response.responseCode === 200) {
                            Swal.fire(
                                'Đã xóa!',
                                'Rạp chiếu phim đã được xóa.',
                                'success'
                            );
                            this.loadCinemas();
                        } else {
                            Swal.fire(
                                'Lỗi!',
                                response.message || 'Có lỗi xảy ra khi xóa',
                                'error'
                            );
                        }
                    },
                    error: (error) => {
                        Swal.fire(
                            'Lỗi!',
                            'Có lỗi xảy ra khi xóa',
                            'error'
                        );
                    }
                });
            }
        });
    }

    // Phương thức để xóa tất cả bộ lọc
    clearAllFilters(): void {
        this.searchTerm = '';
        this.statusFilter = '-1';
        this.currentPage = 1;
        this.filterCinemas();
        console.log('Đã xóa tất cả bộ lọc');
    }

    openMapModal(cinema: Cinema): void {
        try {
            console.log('Opening Map Modal for cinema:', cinema.name);

            // Clean up any existing modal effects
            this.cleanupModalEffects();

            this.selectedCinema = cinema;

            const modalEl = document.getElementById('cinemaMapModal');
            if (modalEl) {
                // Dispose existing modal if any
                try {
                    const existingModal = bootstrap.Modal.getInstance(modalEl);
                    if (existingModal) {
                        existingModal.dispose();
                    }
                } catch (e) {
                    console.log('No existing modal to dispose');
                }

                // Create new modal with specific options
                this.mapModalInstance = new bootstrap.Modal(modalEl, {
                    backdrop: 'static',
                    keyboard: true,
                    focus: true
                });

                // Setup event listeners
                modalEl.addEventListener('shown.bs.modal', () => {
                    console.log('Cinema map modal shown');
                }, { once: true });

                modalEl.addEventListener('hidden.bs.modal', () => {
                    console.log('Cinema map modal hidden');
                    this.cleanupModalEffects();
                }, { once: true });

                // Show the modal
                this.mapModalInstance.show();
                console.log('Cinema map modal opened');
            } else {
                console.error('Modal element #cinemaMapModal not found');
            }
        } catch (error) {
            console.error('Error opening cinema map modal:', error);
            this.cleanupModalEffects();
        }
    }

    getLatitude(): number {
        const form = this.isEditing ? this.updateForm : this.createForm;
        return form.get('latitude')?.value || 10.8231;
    }

    getLongitude(): number {
        const form = this.isEditing ? this.updateForm : this.createForm;
        return form.get('longitude')?.value || 106.6297;
    }

    onLocationChanged(location: { lat: number, lng: number }): void {
        console.log('Location changed from map:', location);
        
        // Lấy form hiện tại (createForm hoặc updateForm)
        const form = this.isEditing ? this.updateForm : this.createForm;
        
        // Lấy giá trị hiện tại
        const currentLat = form.get('latitude')?.value;
        const currentLng = form.get('longitude')?.value;
        
        // So sánh để tránh cập nhật lặp lại khi giá trị không thay đổi
        if (currentLat !== location.lat || currentLng !== location.lng) {
            console.log(`Updating form: from (${currentLat}, ${currentLng}) to (${location.lat}, ${location.lng})`);
            
            // Cập nhật giá trị trên form
            form.patchValue({
                latitude: location.lat,
                longitude: location.lng
            });
            
            // Đánh dấu form đã thay đổi
            form.get('latitude')?.markAsDirty();
            form.get('longitude')?.markAsDirty();
            
            // Hiển thị thông báo nhỏ
            this.showLocationUpdateToast();
            
            // Thực hiện reverse geocoding để tìm địa chỉ từ tọa độ
            this.reverseGeocode(location.lat, location.lng);
        }
    }
    
    // Tìm địa chỉ từ tọa độ (reverse geocoding)
    private reverseGeocode(lat: number, lng: number): void {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    const form = this.isEditing ? this.updateForm : this.createForm;
                    const currentAddress = form.get('address')?.value;
                    
                    // Định dạng địa chỉ từ kết quả
                    let formattedAddress = '';
                    if (data.address) {
                        formattedAddress = this.formatAddressFromNominatim(data.address);
                    } else {
                        formattedAddress = data.display_name;
                    }
                    
                    // Chỉ đề xuất cập nhật nếu địa chỉ hiện tại khác với địa chỉ tìm được
                    if (formattedAddress && (!currentAddress || formattedAddress !== currentAddress)) {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: true,
                            showCancelButton: true,
                            confirmButtonText: 'Cập nhật',
                            cancelButtonText: 'Bỏ qua',
                            timer: 10000,
                            timerProgressBar: true
                        });
                        
                        Toast.fire({
                            icon: 'question',
                            title: 'Cập nhật địa chỉ từ vị trí?',
                            text: formattedAddress
                        }).then((result) => {
                            if (result.isConfirmed) {
                                form.patchValue({ address: formattedAddress });
                                form.get('address')?.markAsDirty();
                            }
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error in reverse geocoding:', error);
            });
    }
    
    // Lấy vị trí hiện tại của người dùng
    getCurrentLocation(): void {
        if (navigator.geolocation) {
            Swal.fire({
                title: 'Đang xác định vị trí...',
                text: 'Vui lòng chờ trong giây lát',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                    
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            
                            Swal.close();
                            
                            // Cập nhật vị trí
                            this.onLocationChanged({ lat, lng });
                            
                            Swal.fire({
                                title: 'Thành công!',
                                text: 'Đã cập nhật vị trí hiện tại',
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false
                            });
                        },
                        (error) => {
                            Swal.close();
                            
                            let errorMessage = 'Không thể xác định vị trí';
                            switch (error.code) {
                                case error.PERMISSION_DENIED:
                                    errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
                                    break;
                                case error.POSITION_UNAVAILABLE:
                                    errorMessage = 'Thông tin vị trí không khả dụng';
                                    break;
                                case error.TIMEOUT:
                                    errorMessage = 'Yêu cầu xác định vị trí đã hết thời gian';
                                    break;
                            }
                            
                            Swal.fire({
                                title: 'Lỗi!',
                                text: errorMessage,
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        },
                        { 
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                }
            });
        } else {
            Swal.fire({
                title: 'Không hỗ trợ',
                text: 'Trình duyệt của bạn không hỗ trợ xác định vị trí',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    }
    
    // Mở Google Maps với tọa độ đã chọn
    openGoogleMaps(): void {
        const form = this.isEditing ? this.updateForm : this.createForm;
        const lat = form.get('latitude')?.value;
        const lng = form.get('longitude')?.value;
        
        if (lat && lng) {
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            window.open(url, '_blank');
        } else {
            Swal.fire({
                title: 'Lỗi',
                text: 'Vui lòng chọn vị trí trước khi xem trên Google Maps',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
        }
    }
    
    // Tìm kiếm địa chỉ và chuyển thành tọa độ
    searchAddressToCoordinates(): void {
        const form = this.isEditing ? this.updateForm : this.createForm;
        const address = form.get('address')?.value;
        
        if (!address || address.trim() === '') {
            Swal.fire({
                title: 'Lỗi',
                text: 'Vui lòng nhập địa chỉ trước khi tìm kiếm',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Đang tìm kiếm...',
            text: 'Vui lòng chờ trong giây lát',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
                
                // Sử dụng Nominatim API của OpenStreetMap để tìm tọa độ từ địa chỉ
                // API này miễn phí nhưng có giới hạn tần suất sử dụng
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1`)
                    .then(response => response.json())
                    .then(data => {
                        Swal.close();
                        
                        if (data && data.length > 0) {
                            const result = data[0];
                            const lat = parseFloat(result.lat);
                            const lng = parseFloat(result.lon);
                            
                            // Cập nhật tọa độ
                            this.onLocationChanged({ lat, lng });
                            
                            // Kiểm tra xem có thông tin địa chỉ chi tiết không và đề xuất cập nhật
                            if (result.address) {
                                let formattedAddress = this.formatAddressFromNominatim(result.address);
                                if (formattedAddress && formattedAddress !== address) {
                                    Swal.fire({
                                        title: 'Cập nhật địa chỉ?',
                                        text: `Bạn có muốn cập nhật địa chỉ thành "${formattedAddress}"?`,
                                        icon: 'question',
                                        showCancelButton: true,
                                        confirmButtonText: 'Cập nhật',
                                        cancelButtonText: 'Giữ nguyên'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            form.patchValue({ address: formattedAddress });
                                        }
                                    });
                                }
                            } else {
                                Swal.fire({
                                    title: 'Thành công!',
                                    text: 'Đã tìm thấy vị trí từ địa chỉ',
                                    icon: 'success',
                                    timer: 2000,
                                    showConfirmButton: false
                                });
                            }
                        } else {
                            Swal.fire({
                                title: 'Không tìm thấy',
                                text: 'Không tìm thấy tọa độ cho địa chỉ này, vui lòng thử địa chỉ khác hoặc chọn trực tiếp trên bản đồ',
                                icon: 'warning',
                                confirmButtonText: 'OK'
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error searching address:', error);
                        Swal.fire({
                            title: 'Lỗi',
                            text: 'Không thể tìm kiếm địa chỉ, vui lòng thử lại sau',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    });
            }
        });
    }
    
    // Định dạng địa chỉ từ kết quả Nominatim
    private formatAddressFromNominatim(addressObj: any): string {
        if (!addressObj) return '';
        
        // Tạo danh sách các thành phần của địa chỉ theo thứ tự từ chi tiết đến tổng quát
        const addressParts = [];
        
        // Thêm số nhà và đường
        if (addressObj.house_number) addressParts.push(addressObj.house_number);
        if (addressObj.road) addressParts.push(addressObj.road);
        
        // Thêm phường/xã, quận/huyện
        if (addressObj.suburb) addressParts.push(addressObj.suburb);
        if (addressObj.quarter) addressParts.push(addressObj.quarter);
        if (addressObj.neighbourhood) addressParts.push(addressObj.neighbourhood);
        if (addressObj.district) addressParts.push(addressObj.district);
        
        // Thêm thành phố/tỉnh
        if (addressObj.city) addressParts.push(addressObj.city);
        else if (addressObj.town) addressParts.push(addressObj.town);
        else if (addressObj.county) addressParts.push(addressObj.county);
        
        // Thêm tỉnh nếu khác với thành phố
        if (addressObj.state && 
            addressObj.state !== addressObj.city && 
            addressObj.state !== addressObj.town) {
            addressParts.push(addressObj.state);
        }
        
        // Thêm quốc gia
        if (addressObj.country) addressParts.push(addressObj.country);
        
        // Ghép các thành phần lại với nhau
        return addressParts.join(', ');
    }
    
    // Kiểm tra xem địa chỉ có thay đổi không
    onAddressChange(): void {
        console.log('Address changed, suggest to update coordinates');
        const form = this.isEditing ? this.updateForm : this.createForm;
        const addressControl = form.get('address');
        
        if (addressControl && addressControl.dirty && addressControl.valid) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: true,
                showCancelButton: true,
                confirmButtonText: 'Cập nhật',
                cancelButtonText: 'Bỏ qua',
                timer: 5000,
                timerProgressBar: true
            });
            
            Toast.fire({
                icon: 'question',
                title: 'Cập nhật tọa độ từ địa chỉ mới?'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.searchAddressToCoordinates();
                }
            });
        }
    }
    
    // Hàm hiển thị thông báo khi cập nhật vị trí
    private showLocationUpdateToast(): void {
        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: 'success',
            title: 'Vị trí đã được cập nhật'
        });
    }
} 