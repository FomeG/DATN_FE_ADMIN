// components/header/header.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',  // Link tới file HTML riêng
  styleUrls: ['./header.css']    // Link tới file CSS riêng
})
export class HeaderComponent {}