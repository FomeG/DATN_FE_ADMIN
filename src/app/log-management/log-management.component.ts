import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Log {
  Id: number;
  Action: string;
  TableName: string;
  RecordId: string;
  BeforeChange: string;
  AfterChange: string;
  ChangeDateTime: string;
  parsedBeforeChange?: any[];
  parsedAfterChange?: any[];
}

@Component({
  selector: 'app-log-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log-management.component.html',
  styleUrl: './log-management.component.css'
})
export class LogManagementComponent implements OnInit {
  logs: Log[] = [];

  sampleData: Log[] = [
    {
      "Id": 1,
      "Action": "INSERT",
      "TableName": "Rooms",
      "RecordId": "BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC",
      "BeforeChange": "{}",
      "AfterChange": "[{\"Id\":\"BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC\",\"CinemaId\":\"E2131050-D219-4523-B480-2F517D8BAFD0\",\"Name\":\"Phòng A\",\"Status\":1,\"TotalColNumber\":11,\"TotalRowNumber\":11,\"SeatPrice\":11}]",
      "ChangeDateTime": "2025-02-17T09:10:00",
    },
    {
      "Id": 2,
      "Action": "UPDATE",
      "TableName": "Rooms",
      "RecordId": "BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC",
      "BeforeChange": "[{\"Id\":\"BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC\",\"CinemaId\":\"E2131050-D219-4523-B480-2F517D8BAFD0\",\"Name\":\"Phòng A\",\"Status\":1,\"TotalColNumber\":11,\"TotalRowNumber\":11,\"SeatPrice\":11}]",
      "AfterChange": "[{\"Id\":\"BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC\",\"CinemaId\":\"E2131050-D219-4523-B480-2F517D8BAFD0\",\"Name\":\"Phòng B\",\"Status\":1,\"TotalColNumber\":11,\"TotalRowNumber\":11,\"SeatPrice\":11}]",
      "ChangeDateTime": "2025-02-17T09:12:00",
    },
    {
      "Id": 3,
      "Action": "DELETE",
      "TableName": "Rooms",
      "RecordId": "BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC",
      "BeforeChange": "[{\"Id\":\"BF1EAF7A-25D4-4F07-AFC6-B1A290B08BCC\",\"CinemaId\":\"E2131050-D219-4523-B480-2F517D8BAFD0\",\"Name\":\"Phòng B\",\"Status\":1,\"TotalColNumber\":11,\"TotalRowNumber\":11,\"SeatPrice\":11}]",
      "AfterChange": "{}",
      "ChangeDateTime": "2025-02-17T09:15:00",
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Sử dụng dữ liệu mẫu thay vì HTTP request
    this.logs = this.sampleData.map(log => ({
      ...log,
      parsedBeforeChange: this.parseJsonString(log.BeforeChange),
      parsedAfterChange: this.parseJsonString(log.AfterChange)
    }));
    
  }

  parseJsonString(jsonString: string): any[] {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : (parsed && Object.keys(parsed).length > 0 ? [parsed] : []);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return [];
    }
  }

  getKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}