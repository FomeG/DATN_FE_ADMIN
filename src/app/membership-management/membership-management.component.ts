import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MembershipService, Membership } from '../services/membership.service';
import 'bootstrap';

@Component({
  selector: 'app-membership-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './membership-management.component.html',
  styleUrl: './membership-management.component.css'
})
export class MembershipManagementComponent implements OnInit {
  @ViewChild('closeBtn') closeBtn!: ElementRef;
  memberships: Membership[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  membershipForm: FormGroup;
  selectedMembership: Membership | null = null;
  isEditing = false;
  totalPages = 0;

  constructor(
    private membershipService: MembershipService,
    private fb: FormBuilder
  ) {
    this.membershipForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      discountPercentage: ['', [Validators.required, Validators.min(0)]],
      monthlyFee: ['', [Validators.required, Validators.min(0)]],
      durationMonths: ['', [Validators.required, Validators.min(1)]],
      status: [1]
    });
  }

  ngOnInit(): void {
    this.loadMemberships();
  }

  loadMemberships() {
    this.membershipService.getMemberships(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (response) => {
          this.memberships = response.data;
          this.totalRecords = response.totalRecord;
          this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
        },
        error: (error) => {
          console.error('Error loading memberships:', error);
        }
      });
  }

  onSubmit() {
    if (this.membershipForm.valid) {
      const membershipData = this.membershipForm.value;
      
      if (this.isEditing && this.selectedMembership) {
        const updateData = {
          ...membershipData,
          id: this.selectedMembership.id,
          createdDate: this.selectedMembership.createdDate
        };
        
        this.membershipService.updateMembership(updateData)
          .subscribe({
            next: () => {
              this.loadMemberships();
              this.resetForm();
              this.closeBtn.nativeElement.click();
            },
            error: (error) => console.error('Error updating membership:', error)
          });
      } else {
        this.membershipService.createMembership(membershipData)
          .subscribe({
            next: () => {
              this.loadMemberships();
              this.resetForm();
              this.closeBtn.nativeElement.click();
            },
            error: (error) => console.error('Error creating membership:', error)
          });
      }
    }
  }

  editMembership(membership: Membership) {
    this.selectedMembership = membership;
    this.isEditing = true;
    this.membershipForm.patchValue({
      name: membership.name,
      description: membership.description,
      discountPercentage: membership.discountPercentage,
      monthlyFee: membership.monthlyFee,
      durationMonths: membership.durationMonths,
      status: membership.status
    });
  }

  deleteMembership(id: string) {
    if (confirm('Are you sure you want to delete this membership?')) {
      this.membershipService.deleteMembership(id)
        .subscribe({
          next: () => {
            this.loadMemberships();
          },
          error: (error) => console.error('Error deleting membership:', error)
        });
    }
  }

  resetForm() {
    this.membershipForm.reset({ status: 1 });
    this.selectedMembership = null;
    this.isEditing = false;
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMemberships();
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}