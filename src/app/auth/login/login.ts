// src/app/auth/login/login.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;

  showPassword = false;

  createMode = false;

  // mensajes de feedback
  loginError = '';
  registerOk = false;
  registerMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      role: ['Universidad', Validators.required],
    });

    this.registerForm = this.fb.group({
      name: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      role: ['Universidad', Validators.required],
    });
  }

  // ---------- LOGIN ----------

  onSubmitLogin() {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginError = 'Completa correo y clave.';
      return;
    }

    const { email, password } = this.loginForm.value;

    const ok = this.auth.login(email, password);
    if (!ok) {
      this.loginError = 'Correo o clave incorrectos.';
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  // ---------- REGISTRO ----------

  onSubmitRegister() {
    this.registerOk = false;
    this.registerMessage = '';

    if (this.registerForm.invalid) {
      this.registerMessage = 'Completa los datos requeridos.';
      return;
    }

    const { name, lastName, email, password, role } = this.registerForm.value;

    const res = this.auth.register(email, password, name, lastName, role);

    this.registerOk = res.ok;
    this.registerMessage = res.message;

    if (res.ok) {
      // Opcional: loguear directo después de crear
      this.auth.login(email, password);
      this.router.navigate(['/dashboard']);
    }
  }

  // ---------- OLVIDÉ MI CLAVE ----------

  onRecoverPassword() {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.loginError = 'Escribe tu correo para recuperar la clave.';
      return;
    }

    const nueva = prompt(
      'Escribe tu nueva clave (esto es solo una prueba local):'
    );
    if (!nueva) {
      return;
    }

    const ok = this.auth.recoverPassword(email, nueva);
    this.loginError = ok
      ? 'Clave actualizada. Intenta ingresar de nuevo.'
      : 'No existe un usuario con ese correo.';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // 🔹 Abre / cierra el panel de registro (coincide con *ngIf="createMode")
  toggleCreateUser() {
    this.createMode = !this.createMode;
    this.registerOk = false;
    this.registerMessage = '';
  }

  // 🔹 Alias para el (click)="toggleCreateMode()" del HTML
  toggleCreateMode() {
    this.toggleCreateUser();
  }
}
