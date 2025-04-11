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
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';
import { StatisticService, CommonResponse } from '../../../services/statistic.service';
import { ExportService } from '../../shared/services/export.service';

// Interface cho dữ liệu thống kê vé
interface TicketStatisticsData {
  date: string;
  received: number;
  resolved: number;
  unresolved: number;
}

// Interface cho options của biểu đồ
export type TicketChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title?: ApexTitleSubtitle;
  legend: ApexLegend;
  fill: ApexFill;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

// Interface cho thống kê tổng hợp
interface TicketSummary {
  title: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-ticket-statistics-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="card">
      <div class="card-body">
        <h4 class="card-title">Thống kê vé theo thời gian</h4>

        <!-- Thống kê tổng hợp -->
        <div class="row mb-4">
          <div *ngFor="let summary of summaryData" class="col-md-4 mb-3">
            <div class="d-flex align-items-center">
              <div class="me-3">
                <h5 class="mb-0">{{ summary.title }}</h5>
                <h2 [style.color]="summary.color" class="mb-0">{{ summary.value | number }}</h2>
                <span [style.color]="summary.color" class="text-muted">
                  <i class="mdi mdi-arrow-up-bold"></i> {{ summary.percentage }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="d-flex justify-content-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>

        <!-- No data message -->
        <div *ngIf="!isLoading && !hasData" class="text-center p-5">
          <p class="text-muted">Không có dữ liệu trong khoảng thời gian đã chọn</p>
        </div>

        <!-- Chart -->
        <div *ngIf="!isLoading && hasData">
          <div id="ticket-statistics-chart">
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
              [colors]="chartOptions.colors"
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

    .spinner-border {
      width: 3rem;
      height: 3rem;
    }
  `]
})
export class TicketStatisticsChartComponent implements OnInit, OnDestroy {
  chartOptions!: TicketChartOptions;
  isLoading = true;
  hasData = false;
  isSampleData = true;

  // Dữ liệu tổng hợp
  summaryData: TicketSummary[] = [
    { title: 'Tổng vé đã nhận', value: 19000, percentage: 16, color: '#1F77B4' },
    { title: 'Tổng vé đã giải quyết', value: 17000, percentage: 13, color: '#2CA02C' },
    { title: 'Tổng vé chưa giải quyết', value: 19000, percentage: 17, color: '#FF7F0E' }
  ];

  private dateRangeSubscription!: Subscription;
  private currentDateRange: DateRange = {} as DateRange;

  constructor(
    private statisticService: StatisticService,
    private dashboardService: DashboardService,
    private exportService: ExportService
  ) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    // Đăng ký lắng nghe sự thay đổi khoảng thời gian
    this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(dateRange => {
      this.currentDateRange = dateRange;
      this.loadTicketStatisticsData();
    });

    // Tải dữ liệu ban đầu
    this.loadTicketStatisticsData();
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  /**
   * Khởi tạo tùy chọn biểu đồ
   */
  private initChartOptions(): void {
    this.chartOptions = {
      series: [
        {
          name: 'Đã nhận',
          data: []
        },
        {
          name: 'Đã giải quyết',
          data: []
        },
        {
          name: 'Chưa giải quyết',
          data: []
        }
      ],
      chart: {
        height: 350,
        type: 'bar',
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
          },
          export: {
            csv: {
              filename: 'Thống kê vé theo thời gian',
              columnDelimiter: ',',
              headerCategory: 'Thời gian',
              headerValue: 'Số lượng',
            },
            svg: {
              filename: 'Thống kê vé theo thời gian',
            },
            png: {
              filename: 'Thống kê vé theo thời gian',
            }
          },
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Thời gian'
        }
      },
      yaxis: {
        title: {
          text: 'Số lượng vé'
        },
        labels: {
          formatter: (val: number) => {
            return val.toFixed(0);
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            return val.toFixed(0) + " vé";
          }
        }
      },
      colors: ['#1F77B4', '#2CA02C', '#FF7F0E'],
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        offsetX: 0,
        offsetY: 0
      }
    };
  }

  /**
   * Tải dữ liệu thống kê vé
   */
  loadTicketStatisticsData(): void {
    this.isLoading = true;
    this.hasData = false;

    // Trong thực tế, bạn sẽ gọi API để lấy dữ liệu
    // Ví dụ: this.statisticService.getTicketStatistics(startDate, endDate)

    // Giả lập việc gọi API bằng cách tạo dữ liệu mẫu sau một khoảng thời gian
    setTimeout(() => {
      this.isLoading = false;
      this.hasData = true;
      this.isSampleData = true;
      this.updateChartWithSampleData();

      // Cập nhật dữ liệu tổng hợp
      this.updateSummaryData();
    }, 1000);
  }

  /**
   * Cập nhật biểu đồ với dữ liệu mẫu
   */
  private updateChartWithSampleData(): void {
    // Tạo dữ liệu mẫu
    const sampleData: TicketStatisticsData[] = [
      { date: '16 Jun', received: 2500, resolved: 2200, unresolved: 15000 },
      { date: '20 Jun', received: 3800, resolved: 3000, unresolved: 15500 },
      { date: '27 Jun', received: 4500, resolved: 3800, unresolved: 16000 },
      { date: '04 Jul', received: 4300, resolved: 3500, unresolved: 16200 },
      { date: '11 Jul', received: 3200, resolved: 3300, unresolved: 16000 }
    ];

    // Cập nhật biểu đồ với dữ liệu mẫu
    this.updateChart(sampleData);
  }

  /**
   * Cập nhật biểu đồ với dữ liệu
   */
  private updateChart(data: TicketStatisticsData[]): void {
    const categories: string[] = [];
    const receivedData: number[] = [];
    const resolvedData: number[] = [];
    const unresolvedData: number[] = [];

    data.forEach(item => {
      categories.push(item.date);
      receivedData.push(item.received);
      resolvedData.push(item.resolved);
      unresolvedData.push(item.unresolved);
    });

    this.chartOptions.series = [
      {
        name: 'Đã nhận',
        data: receivedData
      },
      {
        name: 'Đã giải quyết',
        data: resolvedData
      },
      {
        name: 'Chưa giải quyết',
        data: unresolvedData
      }
    ];

    this.chartOptions.xaxis.categories = categories;
  }

  /**
   * Cập nhật dữ liệu tổng hợp
   */
  private updateSummaryData(): void {
    // Trong thực tế, bạn sẽ lấy dữ liệu này từ API
    this.summaryData = [
      { title: 'Tổng vé đã nhận', value: 19000, percentage: 16, color: '#1F77B4' },
      { title: 'Tổng vé đã giải quyết', value: 17000, percentage: 13, color: '#2CA02C' },
      { title: 'Tổng vé chưa giải quyết', value: 19000, percentage: 17, color: '#FF7F0E' }
    ];
  }

  /**
   * Xuất dữ liệu thống kê vé ra Excel
   */
  exportTicketStatisticsToExcel(): void {
    if (!this.hasData) return;

    // Chuẩn bị dữ liệu xuất Excel
    const exportData = this.chartOptions.xaxis.categories.map((category: string, index: number) => {
      return {
        'Thời gian': category,
        'Vé đã nhận': this.chartOptions.series[0].data[index],
        'Vé đã giải quyết': this.chartOptions.series[1].data[index],
        'Vé chưa giải quyết': this.chartOptions.series[2].data[index]
      };
    });

    this.exportService.exportToExcel(
      exportData,
      'thong_ke_ve',
      'Thống kê vé theo thời gian',
      this.currentDateRange
    );
  }
}
