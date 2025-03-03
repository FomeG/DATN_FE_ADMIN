import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActorService, Actor } from '../services/actor.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actor-management',
  templateUrl: './actor-management.component.html',
  styleUrls: ['./actor-management.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
  providers: [DatePipe]
})
export class ActorManagementComponent implements OnInit {
  actors: Actor[] = [];
  currentPage = 1;
  recordPerPage = 10;
  totalRecords = 0;
  actorForm: FormGroup;
  selectedActor: Actor | null = null;
  selectedFile: File | null = null;
  isEditing = false;


  totalPages = 0;
  pages: number[] = [];

  constructor(
    private actorService: ActorService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.actorForm = this.fb.group({
      name: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      biography: ['', Validators.required],
      status: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadActors();
  }

  loadActors() {
    this.actorService.getActors(this.currentPage, this.recordPerPage)
      .subscribe({
        next: (res) => {
          this.actors = res.data;
          this.totalRecords = res.totalRecord;
          this.calculateTotalPages();
        },
        error: (error) => {
          console.error('Error loading actors:', error);
        }
      });
  }

  onFileSelect(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }



  calculateTotalPages() {
    this.totalPages = Math.ceil(this.totalRecords / this.recordPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onPageChange(page: number) {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadActors();
    }
  }

  // onPageChange(page: number) {
  //   if (page >= 1 && (page - 1) * this.recordPerPage < this.totalRecords) {
  //     this.currentPage = page;
  //     this.loadActors();
  //   }
  // }






  onSubmit() {
    if (this.actorForm.valid) {
      const formData = new FormData();
      Object.keys(this.actorForm.value).forEach(key => {
        if (key !== 'photo') {
          formData.append(key, this.actorForm.value[key]);
        }
      });

      if (this.selectedFile) {
        formData.append('photo', this.selectedFile);
      }

      if (this.isEditing && this.selectedActor) {
        this.actorService.updateActor(this.selectedActor.id, formData)
          .subscribe({
            next: () => {
              this.loadActors();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error updating actor:', error);
            }
          });
      } else {
        this.actorService.createActor(formData)
          .subscribe({
            next: () => {
              this.loadActors();
              this.resetForm();
            },
            error: (error) => {
              console.error('Error creating actor:', error);
            }
          });
      }
    }
  }

  editActor(actor: Actor) {
    this.isEditing = true;
    this.selectedActor = actor;
    this.actorForm.patchValue({
      name: actor.name,
      dateOfBirth: new Date(actor.dateOfBirth).toISOString().split('T')[0],
      biography: actor.biography,
      status: actor.status
    });
  }

  // deleteActor(id: string) {
  //   if (confirm('Are you sure you want to delete this actor?')) {
  //     this.actorService.deleteActor(id)
  //       .subscribe({
  //         next: () => {
  //           this.loadActors();
  //         },
  //         error: (error) => {
  //           console.error('Error deleting actor:', error);
  //         }
  //       });
  //   }
  // }


  deleteActor(actorID: string) {
    Swal.fire({
      title: 'Bạn có chắc chắn xoá phim?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xoá',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actorService.deleteActor(actorID).subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              Swal.fire(
                'Đã xóa!',
                'Diễn viên đã được xóa thành công.',
                'success'
              );
              this.loadActors();
            } else {
              Swal.fire(
                'Lỗi!',
                response.message || 'Có lỗi xảy ra khi xóa diễn viên.',
                'error'
              );
            }
          },
          error: (error) => {
            Swal.fire(
              'Lỗi!',
              'Có lỗi xảy ra khi diễn viên.' + error.message,
              'error'
            );
          }
        });
      }
    });
  }





  resetForm() {
    this.actorForm.reset();
    this.selectedActor = null;
    this.isEditing = false;
    this.selectedFile = null;
    this.actorForm.patchValue({ status: 1 });
  }

}