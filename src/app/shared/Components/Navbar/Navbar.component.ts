// components/header/header.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './Navbar.html',  // Link tới file HTML riêng
  styleUrls: ['./Navbar.css']    // Link tới file CSS riêng
})
export class NavbarComponent {}