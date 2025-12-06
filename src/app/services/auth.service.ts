// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';

// 🔹 Roles válidos en la plataforma
export type UserRole = 'Universidad' | 'Evaluador';

export interface User {
  email: string;
  password: string;
  name?: string;
  lastName?: string;
  role: UserRole; // siempre uno de los dos roles
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

    // Si después de cargar/migrar no hay usuarios, creamos demos
    if (this.users.length === 0) {
      const demoUniversidad: User = {
        email: 'universidad@uasd.com',
        password: '123',
        name: 'Usuario',
        lastName: 'Universidad',
        role: 'Universidad',
      };

      const demoEvaluador: User = {
        email: 'evaluador@uasd.com',
        password: '123',
        name: 'Usuario',
        lastName: 'Evaluador',
        role: 'Evaluador',
      };

      this.users.push(demoUniversidad, demoEvaluador);
      this.saveUsers();
    }
  }

  // ---------- utilidades de storage ----------

  /**
   * Carga usuarios desde localStorage y MIGRA cualquier rol viejo:
   *  - Si era 'Evaluador' se mantiene.
   *  - Cualquier otro valor (Admin, Profesor, undefined, etc.) pasa a 'Universidad'.
   */
  private loadUsers() {
    try {
      const raw = localStorage.getItem(this.USERS_KEY);
      if (!raw) {
        this.users = [];
        return;
      }

      const data = JSON.parse(raw);

      if (!Array.isArray(data)) {
        this.users = [];
        return;
      }

      this.users = data.map((u: any) => {
        let role: UserRole;

        if (u.role === 'Evaluador') {
          role = 'Evaluador';
        } else {
          // Todo lo demás se normaliza a Universidad
          role = 'Universidad';
        }

        const user: User = {
          email: u.email,
          password: u.password,
          name: u.name,
          lastName: u.lastName,
          role,
        };

        return user;
      });

      // Guardamos ya normalizados para no volver a migrar
      this.saveUsers();
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

  /**
   * Obtiene el usuario actual desde localStorage y NORMALIZA su rol.
   */
  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(this.CURRENT_USER_KEY);
      if (!raw) return null;

      const u = JSON.parse(raw) as any;

      const role: UserRole = u.role === 'Evaluador' ? 'Evaluador' : 'Universidad';

      const user: User = {
        email: u.email,
        password: u.password,
        name: u.name,
        lastName: u.lastName,
        role,
      };

      // sincronizamos con la lista de usuarios
      const idx = this.users.findIndex((x) => x.email === user.email);
      if (idx !== -1) {
        this.users[idx].role = user.role;
        this.saveUsers();
      }

      // Guardamos también la versión normalizada
      this.saveCurrentUser(user);

      return user;
    } catch {
      return null;
    }
  }

  /** Devuelve solo el rol del usuario actual */
  getCurrentRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  /** Helpers para la interfaz / guards */
  isUniversidad(): boolean {
    return this.getCurrentRole() === 'Universidad';
  }

  isEvaluador(): boolean {
    return this.getCurrentRole() === 'Evaluador';
  }

  /**
   * LOGIN: ahora exige que coincida también el rol.
   * Si el usuario es Universidad y elige Evaluador (o viceversa), el login falla.
   */
  login(email: string, password: string, role: UserRole): boolean {
    const user = this.users.find(
      (u) =>
        u.email === email &&
        u.password === password &&
        u.role === role
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
    name: string,
    lastName: string,
    role: UserRole
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
