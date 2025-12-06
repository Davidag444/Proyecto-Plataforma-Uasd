// src/app/layout/main-layout/main-layout.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css'],
})
export class MainLayoutComponent {
  showProfile = false;
  isEditingProfile = false;
  editableUser: User | null = null;
  private originalEmail: string | null = null;

  // submenú PERSONAL
  isPersonalMenuOpen = false;
  // submenú COMPETENCIAS
  isCompetenciasMenuOpen = false;

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  get currentUser(): User | null {
    return this.auth.getCurrentUser();
  }

  get esEvaluador(): boolean {
    return this.auth.isEvaluador();
  }

  // --- Perfil ---
  openProfile() {
    this.showProfile = true;
    this.isEditingProfile = false;
    this.editableUser = null;
    this.originalEmail = null;
  }

  startEditProfile() {
    const u = this.currentUser;
    if (!u) return;

    this.isEditingProfile = true;
    this.originalEmail = u.email;
    this.editableUser = { ...u };
  }

  saveProfile() {
    if (!this.editableUser) return;

    const updated: User = { ...this.editableUser };
    this.auth.updateCurrentUser(updated, this.originalEmail || undefined);

    this.isEditingProfile = false;
    this.editableUser = null;
    this.originalEmail = null;
  }

  closeProfile() {
    this.showProfile = false;
    this.isEditingProfile = false;
    this.editableUser = null;
    this.originalEmail = null;
  }

  // --- Logout ---
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // --- Menú PERSONAL ---
  togglePersonalMenu(event: Event) {
    event.preventDefault();
    this.isPersonalMenuOpen = !this.isPersonalMenuOpen;
  }

  // --- Menú COMPETENCIAS ---
  toggleCompetenciasMenu(event: Event) {
    event.preventDefault();
    this.isCompetenciasMenuOpen = !this.isCompetenciasMenuOpen;
  }
}
