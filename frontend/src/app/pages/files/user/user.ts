import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, UserDisplay } from '../../../services/auth-service';
import { ToastrService } from 'ngx-toastr';
import strict from 'assert/strict';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  styleUrl: './user.scss',
  templateUrl: './user.html'
})
export class User implements OnInit {

  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastrService);

  // readonly roles = ['Admin', 'Accountant', 'Sales']
  // readonly roles = {
  //   Admin: 2,
  //   Accountant: 1,
  //   Sales: 3
  // } as const
  readonly roles = [
    { name: 'Admin', value: 2 },
    { name: 'Accountant', value: 1 },
    { name: 'Sales', value: 3 }
  ] as const;

  users = signal<UserDisplay[]>([]);
  loading = signal(true);
  error = signal('');
  searchTerm = signal('');

  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.getLoginUser(page, this.pageSize()).subscribe({
      next: (data) => {
        // console.log(data)
        this.users.set(data.items);
        this.currentPage.set(data.pageNumber);
        this.totalCount.set(data.totalCount);
        this.totalPages.set(data.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load user directory');
        this.loading.set(false);
      }
    });
  }

  filteredUsers = computed(() => {
    let list = this.users();
    const search = this.searchTerm().trim().toLowerCase();

    if (search) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.role.toLowerCase().includes(search)
      );
    }

    return list;
  });

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.loadUsers(p);
    }
  }

  //For update and delete

  showModal = signal(false);
  showDeleteModal = signal(false);
  editingId = signal<number | null>(null);
  deletingId = signal<number | null>(null);
  userToDelete = signal<UserDisplay | null>(null);
  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    // role: <string | number>['', [Validators.required]],
    role: this.fb.control< string | number >('', [Validators.required])
  });

  edit(c: UserDisplay): void {
    this.editingId.set(c.id)

    const matchedRole = this.roles.find(r => r.name === c.role)// || r.value === c.role);

    this.form.reset({
      name: c.name || '',
      email: c.email || '',
      role: matchedRole ? matchedRole.value : ''
      // role: c.role != null && c.role != undefined ? String(c.role) : '',
    });
    this.showModal.set(true);
  }

  closeForm(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please enter a valid user name.', 'Validation Error');
      return;
    }

    const id = this.editingId();
    if(id === null) return
    
    this.saving.set(true);
    const v = this.form.getRawValue();

    const payload = {
          name: v.name!.trim(),
          email: v.email?.trim(),
          // role: v.role?.trim(),
          RoleId: Number(v.role)
        };

    this.authService.updateUser(id, payload).subscribe({
      next: (res) => {
        this.toast.success('User updated successfully', 'Success');
        this.saving.set(false)
        this.closeForm()
        this.loadUsers(this.currentPage())
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to update user', 'Error')
        this.saving.set(false)
      }
    })
  }

  confirmDelete(u: UserDisplay): void {
    this.userToDelete.set(u);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  executeDelete(): void {
    const u = this.userToDelete()
    if(!u) return

    this.deletingId.set(u.id)
    this.authService.deleteUser(u.id).subscribe({
      next: (res) => {
        this.toast.success('User deleted successfully', 'Success');
        this.deletingId.set(null)
        this.cancelDelete()
        
        const isLastOnPage = this.users().length === 1 && this.currentPage() > 1;
        this.loadUsers(isLastOnPage ? this.currentPage() - 1 : this.currentPage());
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete user', 'Error');
        this.deletingId.set(null);
      }
    })
  }

}
