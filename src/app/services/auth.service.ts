// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';

export interface User {
  email: string;
  password: string;
  name?: string;
  lastName?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USERS_KEY = 'app-users';
  private readonly CURRENT_USER_KEY = 'app-current-user';

  private users: User[] = [];

  constructor() {
    this.loadUsers();

    // Usuario de ejemplo por si no hay ninguno guardado
    if (this.users.length === 0) {
      const demo: User = {
        email: 'david@uasd.com',
        password: '123',
        name: 'David',
        lastName: 'Almánzar',
        role: 'Universidad',
      };
      this.users.push(demo);
      this.saveUsers();
    }
  }

  // ---------- utilidades de storage ----------

  private loadUsers() {
    try {
      const raw = localStorage.getItem(this.USERS_KEY);
      this.users = raw ? (JSON.parse(raw) as User[]) : [];
    } catch {
      this.users = [];
    }
  }

  private saveUsers() {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(this.users));
  }

  private saveCurrentUser(user: User | null) {
    if (!user) {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    } else {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    }
  }

  // ---------- API pública ----------

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(this.CURRENT_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): boolean {
    const user = this.users.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) {
      return false;
    }

    this.saveCurrentUser(user);
    return true;
  }

  logout() {
    this.saveCurrentUser(null);
  }

  /**
   * Registrar usuario nuevo
   */
  register(
    email: string,
    password: string,
    name?: string,
    lastName?: string,
    role?: string
  ): { ok: boolean; message: string } {
    const exists = this.users.some((u) => u.email === email);
    if (exists) {
      return { ok: false, message: 'El correo ya está registrado.' };
    }

    const newUser: User = {
      email,
      password,
      name,
      lastName,
      role,
    };

    this.users.push(newUser);
    this.saveUsers();

    return { ok: true, message: 'Usuario creado correctamente.' };
  }

  /**
   * Cambiar clave de un usuario
   */
  recoverPassword(email: string, newPassword: string): boolean {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      return false;
    }
    user.password = newPassword;
    this.saveUsers();
    return true;
  }

  /**
   * Actualizar datos del usuario logueado (para el panel de perfil)
   */
  updateCurrentUser(updated: User, originalEmail?: string) {
    const keyEmail = originalEmail || updated.email;

    const idx = this.users.findIndex((u) => u.email === keyEmail);
    if (idx !== -1) {
      this.users[idx] = { ...updated };
      this.saveUsers();
    }

    this.saveCurrentUser(updated);
  }
}
