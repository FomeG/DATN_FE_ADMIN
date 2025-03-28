import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexFill,
  ApexTooltip,
  ApexPlotOptions,
  NgApexchartsModule
} from 'ng-apexcharts';

import { StatisticService, StatisticSeatOccupancyRes } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { ExportService } from '../../shared/services/export.service';

// Define the chart options interface
export type SeatOccupancyChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  labels: string[];
};

interface CommonResponse<T> {
  responseCode: number;
  message: string;
  data: T;
  totalRecord?: number;
}

@Component({
  selector: 'app-seat-occupancy-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title">Tỷ lệ lấp đầy ghế</h5>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" data-bs-toggle="tooltip" title="Xuất Excel" (click)="exportSeatOccupancyToExcel()">
            <i class="mdi mdi-microsoft-excel"></i> Xuất Excel
          </button>
          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="tooltip" title="Tải lại" (click)="loadSeatOccupancyData()">
            <i class="mdi mdi-refresh"></i> Tải lại
          </button>
        </div>
      </div>
      <div class="card-body">
        <div *ngIf="isLoading" class="text-center p-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        
        <div *ngIf="!isLoading && !hasData" class="text-center p-5">
          <p class="text-muted">Không có dữ liệu trong khoảng thời gian đã chọn</p>
        </div>

        <div *ngIf="isSampleData" class="sample-data-warning">
          <div class="alert alert-warning mb-3">
            <i class="mdi mdi-information-outline me-2"></i>
            Đang hiển thị dữ liệu mẫu do không có dữ liệu thực từ API
          </div>
        </div>
        
        <div *ngIf="!isLoading && hasData">
          <div id="seat-occupancy-chart">
            <apx-chart
              [series]="chartOptions.series"
              [chart]="chartOptions.chart"
              [xaxis]="chartOptions.xaxis"
              [stroke]="chartOptions.stroke"
              [dataLabels]="chartOptions.dataLabels"
              [yaxis]="chartOptions.yaxis"
              [plotOptions]="chartOptions.plotOptions"
              [legend]="chartOptions.legend"
              [fill]="chartOptions.fill"
              [tooltip]="chartOptions.tooltip"
            ></apx-chart>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 1.5rem;
    }
    
    .card {
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    .card-header {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background-color: transparent;
    }
    
    .card-title {
      margin-bottom: 0;
      color: #333;
      font-weight: 600;
    }
    
    .btn-group .btn {
      border-radius: 4px;
      margin-left: 5px;
      transition: all 0.2s;
    }
    
    .btn-group .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .btn-group .btn-outline-primary {
      color: #4e73df;
      border-color: #4e73df;
    }
    
    .btn-group .btn-outline-primary:hover {
      background-color: #4e73df;
      color: white;
    }
    
    .btn-group .btn-outline-secondary {
      color: #6c757d;
      border-color: #6c757d;
    }
    
    .btn-group .btn-outline-secondary:hover {
      background-color: #6c757d;
      color: white;
    }

    /* CSS cho tooltip tùy chỉnh */
    :global(.custom-tooltip) {
      background: #1a202c !important;
      border: 1px solid #4a5568 !important;
      border-radius: 8px !important;
      padding: 12px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
    }
    
    :global(.tooltip-title) {
      color: #90cdf4 !important;
      font-weight: bold !important;
      font-size: 14px !important;
      display: block !important;
      margin-bottom: 8px !important;
      text-align: left !important;
    }
    
    :global(.tooltip-value) {
      color: #f7fafc !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      text-align: left !important;
    }
    
    /* CSS cho menu xuất dữ liệu của ApexCharts */
    :global(.apexcharts-menu) {
      background-color: #1a202c !important;
      border: 2px solid #4299e1 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
      border-radius: 8px !important;
      padding: 8px 4px !important;
      z-index: 999999 !important;
    }
    
    :global(.apexcharts-menu-item) {
      color: white !important;
      font-weight: 500 !important;
      padding: 12px 16px !important;
      border-radius: 4px !important;
      margin: 4px 0 !important;
      transition: all 0.2s ease !important;
      font-size: 14px !important;
    }
    
    :global(.apexcharts-menu-item:hover) {
      background-color: #4299e1 !important;
      color: white !important;
      transform: translateX(4px) !important;
    }
    
    /* CSS dark mode */
    @media (prefers-color-scheme: dark) {
      .card {
        background-color: #2d3748;
        color: #e2e8f0;
      }
      
      .card-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .card-title {
        color: #e2e8f0;
      }
      
      .text-muted {
        color: #a0aec0 !important;
      }
      
      .btn-group .btn-outline-primary {
        color: #90cdf4;
        border-color: #90cdf4;
      }
      
      .btn-group .btn-outline-primary:hover {
        background-color: #90cdf4;
        color: #1a202c;
      }
      
      .btn-group .btn-outline-secondary {
        color: #cbd5e0;
        border-color: #cbd5e0;
      }
      
      .btn-group .btn-outline-secondary:hover {
        background-color: #cbd5e0;
        color: #1a202c;
      }
      
      /* Dark mode tooltip styles */
      :global(.custom-tooltip) {
        background: #2d3748 !important;
        border: 1px solid #4a5568 !important;
      }
      
      :global(.tooltip-title) {
        color: #90cdf4 !important;
      }
      
      :global(.tooltip-value) {
        color: #f7fafc !important;
      }

      /* Dark mode menu styles */
      :global(.apexcharts-menu) {
        background-color: #2d3748 !important;
        border: 1px solid #4a5568 !important;
      }
      
      :global(.apexcharts-menu-item) {
        color: #f7fafc !important;
      }
      
      :global(.apexcharts-menu-item:hover) {
        background-color: #4a5568 !important;
        color: #90cdf4 !important;
      }
      
      /* ApexCharts dark mode styling */
      :global(.apexcharts-canvas) {
        background-color: #2d3748 !important;
      }
      
      :global(.apexcharts-text) {
        fill: #e2e8f0 !important;
      }
      
      :global(.apexcharts-legend-text) {
        color: #e2e8f0 !important;
      }
      
      :global(.apexcharts-tooltip) {
        background: #2d3748 !important;
        border: 1px solid #4a5568 !important;
      }
      
      :global(.apexcharts-tooltip-title) {
        background: #1a202c !important;
        border-bottom: 1px solid #4a5568 !important;
      }
    }

    .sample-data-warning {
      margin-bottom: 1rem;
    }
  `]
})
export class SeatOccupancyChartComponent implements OnInit, OnDestroy {
  chartOptions!: SeatOccupancyChartOptions;
  isLoading = true;
  hasData = false;
  isSampleData = false;

  private dateRangeSubscription!: Subscription;
  private currentDateRange: DateRange = {} as DateRange;

  constructor(
    private statisticService: StatisticService,
    private dashboardService: DashboardService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    this.initChartOptions();
    this.currentDateRange = this.dashboardService.getCurrentDateRange();
    this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(dateRange => {
      this.currentDateRange = dateRange;
      this.loadSeatOccupancyData();
    });
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  loadSeatOccupancyData(): void {
    this.isLoading = true;
    this.hasData = false;
    this.isSampleData = false;
    
    // Chuyển đổi null thành undefined
    const startDate = this.currentDateRange.startDate ?? undefined;
    const endDate = this.currentDateRange.endDate ?? undefined;
    
    this.statisticService.getSeatOccupancy(startDate, endDate)
      .subscribe({
        next: (response: CommonResponse<StatisticSeatOccupancyRes[]>) => {
          this.isLoading = false;
          if (response && response.data && response.data.length > 0) {
            this.hasData = true;
            this.isSampleData = false;
            this.updateChart(response.data);
          } else {
            // Nếu không có dữ liệu thực, sử dụng dữ liệu mẫu
            this.hasData = true;
            this.isSampleData = true;
            this.updateChartWithSampleData();
          }
        },
        error: (error: any) => {
          console.error('Error loading seat occupancy data:', error);
          this.isLoading = false;
          this.hasData = true;
          this.isSampleData = true;
          // Hiển thị dữ liệu mẫu khi gặp lỗi
          this.updateChartWithSampleData();
        }
      });
  }

  private updateChart(data: StatisticSeatOccupancyRes[]): void {
    // Tạo dữ liệu cho heatmap
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const timeSlots = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'];
    
    // Khởi tạo mảng dữ liệu cho heatmap
    const heatmapData: { name: string; data: { x: string; y: number; }[] }[] = [];
    
    // Tạo mảng 2 chiều để lưu trữ tỷ lệ lấp đầy theo ngày và giờ
    const occupancyByDayAndTime: { [day: string]: { [time: string]: { count: number; total: number; } } } = {};
    
    // Khởi tạo dữ liệu trống cho tất cả các ô trong heatmap
    daysOfWeek.forEach(day => {
      occupancyByDayAndTime[day] = {};
      timeSlots.forEach(time => {
        occupancyByDayAndTime[day][time] = { count: 0, total: 0 };
      });
    });
    
    // Phân loại dữ liệu vào các ô tương ứng
    data.forEach(item => {
      const date = new Date(item.startTime);
      const dayIndex = date.getDay(); // 0 = Chủ nhật, 1-6 = Thứ 2-Chủ nhật
      const day = daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1]; // Chuyển đổi sang mảng daysOfWeek
      
      // Lấy giờ và phút
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // Tìm khung giờ gần nhất
      let closestTime = timeSlots[0];
      let minDiff = Number.MAX_VALUE;
      
      timeSlots.forEach(timeSlot => {
        const [h, m] = timeSlot.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        const currentMinutes = hours * 60 + minutes;
        const diff = Math.abs(currentMinutes - slotMinutes);
        
        if (diff < minDiff) {
          minDiff = diff;
          closestTime = timeSlot;
        }
      });
      
      // Cập nhật số liệu cho ô tương ứng
      occupancyByDayAndTime[day][closestTime].count += item.bookedSeats;
      occupancyByDayAndTime[day][closestTime].total += item.totalSeats;
    });
    
    // Tạo dữ liệu cho từng ngày trong tuần
    daysOfWeek.forEach(day => {
      const dayData: { x: string; y: number; }[] = [];
      
      timeSlots.forEach(time => {
        const cell = occupancyByDayAndTime[day][time];
        const occupancyRate = cell.total > 0 ? Math.round((cell.count / cell.total) * 100) : 0;
        
        dayData.push({
          x: time,
          y: occupancyRate
        });
      });
      
      heatmapData.push({
        name: day,
        data: dayData
      });
    });
    
    // Cập nhật tùy chọn biểu đồ
    this.chartOptions.series = heatmapData;
    this.chartOptions.tooltip = {
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        const day = w.globals.seriesNames[seriesIndex];
        const time = w.globals.labels[dataPointIndex];
        
        return `<div class="custom-tooltip">
          <span class="tooltip-title">${day} - ${time}</span>
          <span class="tooltip-value">Tỷ lệ lấp đầy: ${value}%</span>
        </div>`;
      }
    };
    
    this.hasData = true;
  }

  private updateChartWithSampleData(): void {
    // Tạo dữ liệu mẫu cho heatmap
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const timeSlots = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'];
    
    // Tạo mẫu dữ liệu cho biểu đồ nhiệt
    const sampleHeatmapData: { name: string; data: { x: string; y: number; }[] }[] = [];
    
    // Tạo dữ liệu mẫu với tỷ lệ lấp đầy cao hơn vào cuối tuần và buổi tối
    daysOfWeek.forEach((day, dayIndex) => {
      const dayData: { x: string; y: number; }[] = [];
      
      timeSlots.forEach((time, timeIndex) => {
        let occupancyRate = 30; // Tỷ lệ cơ bản
        
        // Buổi tối có tỷ lệ cao hơn
        if (timeIndex >= 3) {
          occupancyRate += 20;
        }
        
        // Cuối tuần có tỷ lệ cao hơn
        if (dayIndex >= 4) {
          occupancyRate += 25;
        }
        
        // Thêm một chút biến động ngẫu nhiên
        occupancyRate += Math.floor(Math.random() * 15);
        
        // Giới hạn tỷ lệ trong khoảng 0-100
        occupancyRate = Math.min(100, Math.max(0, occupancyRate));
        
        dayData.push({
          x: time,
          y: occupancyRate
        });
      });
      
      sampleHeatmapData.push({
        name: day,
        data: dayData
      });
    });
    
    // Cập nhật tùy chọn biểu đồ
    this.chartOptions.series = sampleHeatmapData;
    this.chartOptions.tooltip = {
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        const day = w.globals.seriesNames[seriesIndex];
        const time = w.globals.labels[dataPointIndex];
        
        return `<div class="custom-tooltip">
          <span class="tooltip-title">${day} - ${time}</span>
          <span class="tooltip-value">Tỷ lệ lấp đầy: ${value}%</span>
        </div>`;
      }
    };
    
    this.hasData = true;
  }

  private initChartOptions(): void {
    this.chartOptions = {
      series: [],
      chart: {
        height: 400,
        type: 'heatmap',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        background: 'transparent',
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val + '%';
        },
        style: {
          colors: ['#fff']
        }
      },
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 20,
                color: '#2C3E50',
                name: 'Rất thấp'
              },
              {
                from: 21,
                to: 40,
                color: '#3498DB',
                name: 'Thấp'
              },
              {
                from: 41,
                to: 60,
                color: '#2ECC71',
                name: 'Trung bình'
              },
              {
                from: 61,
                to: 80,
                color: '#F39C12',
                name: 'Cao'
              },
              {
                from: 81,
                to: 100,
                color: '#E74C3C',
                name: 'Rất cao'
              }
            ]
          }
        }
      },
      stroke: {
        width: 1
      },
      xaxis: {
        type: 'category',
        labels: {
          style: {
            colors: '#fff'
          }
        },
        title: {
          text: 'Giờ',
          style: {
            color: '#fff'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Ngày trong tuần',
          style: {
            color: '#fff'
          }
        },
        labels: {
          style: {
            colors: '#fff'
          }
        }
      },
      title: {
        text: 'Tỷ lệ lấp đầy ghế theo ngày và giờ',
        align: 'center',
        style: {
          color: '#e2e8f0',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      tooltip: {
        enabled: true
      },
      legend: {
        position: 'right',
        labels: {
          colors: '#fff'
        }
      },
      fill: {
        opacity: 1
      },
      labels: []
    };
  }

  exportSeatOccupancyToExcel(): void {
    if (!this.hasData) return;
    
    const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const timeSlots = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'];
    
    // Tạo dữ liệu xuất Excel
    const exportData: any[] = [];
    
    // Tạo dữ liệu từ series của biểu đồ
    this.chartOptions.series.forEach((series: any) => {
      const day = series.name;
      
      series.data.forEach((dataPoint: any, index: number) => {
        const time = timeSlots[index];
        const occupancyRate = dataPoint.y;
        
        exportData.push({
          'Ngày trong tuần': day,
          'Khung giờ': time,
          'Tỷ lệ lấp đầy (%)': occupancyRate
        });
      });
    });
    
    // Gọi service xuất Excel
    this.exportService.exportToExcel(
      exportData,
      'ty_le_lap_day_ghe',
      'Tỷ lệ lấp đầy ghế theo ngày và giờ',
      this.currentDateRange
    );
  }
} 