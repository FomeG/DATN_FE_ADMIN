import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payment-result-container">
      <div class="payment-result-card">
        <h2 class="text-center mb-4">Kết quả thanh toán</h2>
        
        @if (isSuccess) {
          <div class="success-content">
            <div class="icon-container mb-3">
              <span class="success-icon">✓</span>
            </div>
            <h3>Thanh toán thành công!</h3>
            <p>Mã đơn hàng: {{ orderId }}</p>
            <p>Cảm ơn bạn đã thực hiện thanh toán.</p>
          </div>
        } @else {
          <div class="error-content">
            <div class="icon-container mb-3">
              <span class="error-icon">✗</span>
            </div>
            <h3>Thanh toán thất bại!</h3>
            <p>Mã lỗi: {{ responseCode }}</p>
            <p>Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
          </div>
        }
        
        <div class="action-buttons mt-4">
          <button class="btn btn-primary" (click)="backToHome()">
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-result-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f8f9fa;
      padding: 20px;
    }
    
    .payment-result-card {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      padding: 30px;
      width: 100%;
      max-width: 500px;
      text-align: center;
    }
    
    .icon-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      margin: 0 auto;
    }
    
    .success-icon {
      font-size: 40px;
      color: white;
      background-color: #28a745;
      border-radius: 50%;
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .error-icon {
      font-size: 40px;
      color: white;
      background-color: #dc3545;
      border-radius: 50%;
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .success-content {
      color: #28a745;
    }
    
    .error-content {
      color: #dc3545;
    }
    
    .action-buttons {
      margin-top: 30px;
    }
    
    .btn {
      padding: 10px 20px;
      border-radius: 5px;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
      border: none;
    }
  `]
})
export class PaymentCallbackComponent implements OnInit {
  isSuccess = false;
  responseCode = '';
  orderId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Lấy kết quả thanh toán từ query parameters
    this.route.queryParams.subscribe(params => {
      this.responseCode = params['vnp_ResponseCode'];
      this.orderId = params['vnp_TxnRef'];
      
      // Kiểm tra kết quả thanh toán
      this.isSuccess = this.responseCode === '00';
      
      // Lưu thông tin thanh toán vào localStorage hoặc thực hiện các hành động khác

      // CHỖ NÀY KHẢ NĂNG LÀ GỌI API RỒI LƯU VÀO TRONG BẢNG ORDER THÔI 
      this.savePaymentResult();
    });
  }

  savePaymentResult() {
    const paymentResult = {
      success: this.isSuccess,
      orderId: this.orderId,
      responseCode: this.responseCode,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('lastPaymentResult', JSON.stringify(paymentResult));
    
    // Nếu cần, bạn có thể gọi API để cập nhật trạng thái đơn hàng ở đây
  }

  backToHome() {
    this.router.navigate(['/']);
  }
}