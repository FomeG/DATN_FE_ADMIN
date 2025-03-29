import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DateRange } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Xuất dữ liệu ra file Excel
   * @param data Dữ liệu cần xuất
   * @param fileName Tên file (không cần đuôi .xlsx)
   * @param sheetName Tên sheet
   * @param dateRange Thông tin khoảng thời gian để thêm vào header
   */
  exportToExcel(data: any[], fileName: string, sheetName: string, dateRange?: DateRange): void {
    try {
      if (!data || data.length === 0) {
        console.warn('Không có dữ liệu để xuất');
        return;
      }

      // Thêm thông tin khoảng thời gian vào đầu file nếu có
      let exportData = [...data];
      if (dateRange) {
        const startDateStr = dateRange.startDate ? this.formatDateForDisplay(dateRange.startDate) : 'N/A';
        const endDateStr = dateRange.endDate ? this.formatDateForDisplay(dateRange.endDate) : 'N/A';
        
        // Thêm metadata vào đầu file
        const metadata = [
          { 'Thông tin': 'Khoảng thời gian', 'Giá trị': `${startDateStr} - ${endDateStr}` },
          { 'Thông tin': 'Thời gian xuất file', 'Giá trị': this.formatDateForDisplay(new Date()) }
        ];
        
        // Thêm dòng trống để phân cách
        const emptyRow: Record<string, string> = {};
        Object.keys(data[0]).forEach(key => emptyRow[key] = '');
        
        exportData = [...metadata, emptyRow, ...data];
      }

      // Tạo workbook và worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Style cho header (đối với các file thông thường, style có thể bị giới hạn)
      // Đối với style phức tạp, cần sử dụng thư viện như exceljs

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Tạo file và download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}_${this.getFormattedDate()}.xlsx`);
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
    }
  }

  /**
   * Xuất dữ liệu ra file Excel với nhiều sheet
   * @param dataSheets Object chứa dữ liệu cho từng sheet, key là tên sheet
   * @param fileName Tên file (không cần đuôi .xlsx)
   * @param dateRange Thông tin khoảng thời gian
   */
  exportMultiSheetExcel(dataSheets: Record<string, any[]>, fileName: string, dateRange?: DateRange): void {
    try {
      // Kiểm tra dữ liệu
      if (!dataSheets || Object.keys(dataSheets).length === 0) {
        console.warn('Không có dữ liệu để xuất');
        return;
      }

      // Tạo workbook mới
      const wb = XLSX.utils.book_new();
      
      // Thêm các sheet vào workbook
      for (const [sheetName, data] of Object.entries(dataSheets)) {
        if (data && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      }
      
      // Thêm thuộc tính cho workbook
      wb.Props = {
        Title: fileName,
        Subject: 'Báo cáo thống kê',
        Author: 'Hệ thống quản lý rạp chiếu phim',
        CreatedDate: new Date()
      };

      // Tạo file và download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${fileName}_${this.getFormattedDate()}.xlsx`);
    } catch (error) {
      console.error('Lỗi khi xuất Excel nhiều sheet:', error);
      throw error;
    }
  }

  /**
   * Xuất dữ liệu dưới dạng CSV
   * @param data Dữ liệu cần xuất
   * @param fileName Tên file (không cần đuôi .csv)
   */
  exportToCsv(data: any[], fileName: string): void {
    try {
      if (!data || data.length === 0) {
        console.warn('Không có dữ liệu để xuất');
        return;
      }

      // Lấy headers từ object đầu tiên
      const headers = Object.keys(data[0]);
      
      // Tạo dòng header
      const headerRow = headers.join(',');
      
      // Tạo các dòng dữ liệu
      const rows = data.map(item => 
        headers.map(header => {
          // Xử lý các giá trị đặc biệt (chuỗi có dấu phẩy, xuống dòng, v.v.)
          const cell = item[header];
          if (cell === null || cell === undefined) {
            return '';
          }
          const cellStr = cell.toString();
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      );
      
      // Tạo nội dung CSV
      const csv = [headerRow, ...rows].join('\n');
      
      // Tạo blob và download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${fileName}_${this.getFormattedDate()}.csv`);
    } catch (error) {
      console.error('Lỗi khi xuất CSV:', error);
    }
  }

  /**
   * Xuất chart dưới dạng PNG
   * @param chartElement Element chứa chart (là một div hoặc canvas)
   * @param fileName Tên file (không cần đuôi .png)
   */
  exportChartAsPng(chartElement: HTMLElement, fileName: string): void {
    try {
      // Sử dụng html2canvas (cần cài thêm thư viện)
      // Đây chỉ là pseudo code, cần import html2canvas để sử dụng
      /*
      html2canvas(chartElement).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${fileName}_${this.getFormattedDate()}.png`;
        link.click();
      });
      */
      
      // Nếu chart là ApexChart, có thể dùng phương thức exportToSVG hoặc exportToPng của ApexCharts
      // Ví dụ: chart.exportToSVG()
      
      console.log('Chức năng xuất PNG đang được phát triển');
    } catch (error) {
      console.error('Lỗi khi xuất PNG:', error);
    }
  }

  /**
   * Format ngày tháng cho tên file
   */
  private getFormattedDate(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${day}_${month}_${year}`;
  }

  /**
   * Format ngày tháng để hiển thị
   */
  private formatDateForDisplay(date: Date): string {
    if (!date) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
} 