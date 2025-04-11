import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { Subscription } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTooltip,
  ApexLegend,
  ApexTheme
} from "ng-apexcharts";

import { StatisticService, StatisticSeatOccupancyRes, CommonResponse } from '../../../services/statistic.service';
import { DashboardService, DateRange } from '../../shared/services/dashboard.service';

export type HeatmapChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
  theme?: ApexTheme;
};

@Component({
  selector: 'app-seat-occupancy-heatmap',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './seat-occupancy-heatmap.component.html',
  styleUrls: ['./seat-occupancy-heatmap.component.css']
})
export class SeatOccupancyHeatmapComponent implements OnInit, OnDestroy {
  public chartOptions: Partial<HeatmapChartOptions> = {};

  private dateRangeSubscription!: Subscription;
  public currentDateRange: DateRange = {} as DateRange;

  isLoading = true;
  hasData = false;
  isSampleData = false;
  occupancyData: StatisticSeatOccupancyRes[] = [];

  constructor(
    private statisticService: StatisticService,
    private dashboardService: DashboardService
  ) {
    this.initChart();
  }

  ngOnInit(): void {
    this.dateRangeSubscription = this.dashboardService.dateRange$.subscribe(dateRange => {
      this.currentDateRange = dateRange;
      this.loadChartData();
    });
  }

  ngOnDestroy(): void {
    if (this.dateRangeSubscription) {
      this.dateRangeSubscription.unsubscribe();
    }
  }

  private initChart(): void {
    this.chartOptions = {
      series: [],
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff']
        },
        formatter: function (val) {
          if (val === null || val === undefined) return '0%';
          if (typeof val === 'number') return val.toFixed(0) + '%';
          return val + '%';
        }
      },
      colors: ["#008FFB"],
      chart: {
        height: 450,
        type: "heatmap",
        toolbar: {
          show: false
        },
        background: '#191c24',
        foreColor: '#ffffff'
      },
      title: {
        text: "Tỷ lệ lấp đầy ghế theo thời gian",
        align: "left",
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#ffffff'
        }
      },
      plotOptions: {
        heatmap: {
          distributed: false,
          enableShades: false,
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 20,
                color: '#0D3B66',
                name: 'Thấp (0-20%)',
              },
              {
                from: 20.01,
                to: 40,
                color: '#1A5BA9',
                name: 'Trung bình thấp (21-40%)',
              },
              {
                from: 40.01,
                to: 60,
                color: '#2978E6',
                name: 'Trung bình (41-60%)',
              },
              {
                from: 60.01,
                to: 80,
                color: '#4A94F3',
                name: 'Trung bình cao (61-80%)',
              },
              {
                from: 80.01,
                to: 100,
                color: '#6AAFFF',
                name: 'Cao (81-100%)',
              }
            ],
            min: 0,
            max: 100,
            inverse: false
          },
          radius: 0,
          useFillColorAsStroke: true
        }
      },

      xaxis: {
        type: "category",
        labels: {
          style: {
            colors: '#ffffff'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#ffffff'
          }
        }
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (value) {
            return value + "% ghế đã được đặt";
          }
        }
      },
      legend: {
        labels: {
          colors: '#ffffff'
        }
      },
      theme: {
        mode: 'dark',
        palette: 'palette1'
      }
    };
  }

  private loadChartData(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.currentDateRange;

    // Chuyển đổi kiểu dữ liệu từ Date | null sang Date | undefined
    const start = startDate || undefined;
    const end = endDate || undefined;

    this.statisticService.getSeatOccupancy(start, end).subscribe({
      next: (response: CommonResponse<StatisticSeatOccupancyRes[]>) => {
        this.isLoading = false;
        console.log('Kết quả API tỷ lệ lấp đầy ghế:', response);

        if (response && response.data && response.data.length > 0) {
          this.hasData = true;
          this.isSampleData = false;
          this.occupancyData = response.data;
          this.updateChart(response.data);
        } else {
          console.log('Không có dữ liệu tỷ lệ lấp đầy ghế, hiển thị dữ liệu mẫu');
          this.hasData = true;
          this.isSampleData = true;
          this.updateChartWithSampleData();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Lỗi khi tải dữ liệu tỷ lệ lấp đầy ghế:', error);
        this.hasData = true;
        this.isSampleData = true;
        this.updateChartWithSampleData();
      }
    });
  }

  private updateChart(data: StatisticSeatOccupancyRes[]): void {
    // Khai báo các ngày trong tuần
    const daysOfWeek = [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ nhật"
    ];

    // Khai báo các giờ trong ngày
    const hours = [
      "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM"
    ];

    // Tạo series cho biểu đồ heatmap
    const series: ApexAxisChartSeries = [];

    // Tạo dữ liệu cho từng ngày trong tuần
    daysOfWeek.forEach(day => {
      const seriesData: { x: string; y: number }[] = [];

      // Tạo dữ liệu cho từng giờ
      hours.forEach(hour => {
        // Tìm các suất chiếu trong ngày và giờ tương ứng
        const matchingShowtimes = data.filter(item => {
          const date = new Date(item.startTime);
          const dayOfWeek = this.getDayOfWeekString(date.getDay());
          const hourStr = this.getHourString(date.getHours());

          return dayOfWeek === day && hourStr === hour;
        });

        // Tính tỷ lệ lấp đầy trung bình nếu có dữ liệu
        let occupancyRate = 0;
        if (matchingShowtimes.length > 0) {
          occupancyRate = matchingShowtimes.reduce((sum, item) => sum + item.occupancyRate, 0) / matchingShowtimes.length;
        }

        seriesData.push({
          x: hour,
          y: Math.round(occupancyRate)
        });
      });

      // Thêm series cho ngày này
      series.push({
        name: day,
        data: seriesData
      });
    });

    // Cập nhật biểu đồ
    this.chartOptions.series = series;
  }

  private getDayOfWeekString(day: number): string {
    const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    return days[day];
  }

  private getHourString(hour: number): string {
    if (hour < 9 || hour > 22) return "";

    if (hour < 12) {
      return `${hour}AM`;
    } else if (hour === 12) {
      return "12PM";
    } else {
      return `${hour - 12}PM`;
    }
  }

  private updateChartWithSampleData(): void {
    const daysOfWeek = [
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ nhật"
    ];

    const hours = [
      "9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM", "10PM"
    ];

    const series: ApexAxisChartSeries = [];

    daysOfWeek.forEach(day => {
      const data: { x: string; y: number }[] = hours.map(hour => {
        return {
          x: hour,
          y: Math.floor(Math.random() * 100)
        };
      });

      series.push({
        name: day,
        data: data
      });
    });

    this.chartOptions.series = series;
  }


}
