// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home';
import { PlanCreateComponent } from './plan-create/plan-create';
import { PlanListComponent } from './plan-list/plan-list';
import { AsignaturasComponent } from './asignaturas/asignaturas';

// === PERSONAL ===
import { PersonalLayoutComponent } from './personal/personal-layout';
import { AutoridadesComponent } from './personal/autoridades/autoridades';
import { ProfesoresComponent } from './personal/profesores/profesores';
import { ContactosComponent } from './personal/contactos/contactos';

// === ORGANIZACIÓN ===
import { OrganizacionLayoutComponent } from './organizacion/organizacion-layout';
import { RecintosComponent } from './recintos/recintos';
import { DepartamentosComponent } from './departamentos/departamentos';

// === COMPETENCIAS ===
import { CompetenciasFundamentalesComponent } from './competencias/competencias.fundamentales';
import { CompetenciasEspecificasComponent } from './competencias/competencias-especificas';

// === EDUCACIÓN VIRTUAL ===
import { EducacionVirtualComponent } from './educacion-virtual/educacion-virtual';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: MainLayoutComponent,
    children: [
      { path: '', component: DashboardHomeComponent },

      // planes
      { path: 'planes-nuevo', component: PlanCreateComponent },
      { path: 'planes-mis', component: PlanListComponent },

      // asignaturas
      { path: 'asignaturas', component: AsignaturasComponent },

      // --- PERSONAL ---
      {
        path: 'personal',
        component: PersonalLayoutComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'autoridades' },
          { path: 'autoridades', component: AutoridadesComponent },
          { path: 'profesores', component: ProfesoresComponent },
          { path: 'contactos', component: ContactosComponent },
        ],
      },

      // --- ORGANIZACIÓN ---
      {
        path: 'organizacion',
        component: OrganizacionLayoutComponent,
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'recintos' },
          { path: 'recintos', component: RecintosComponent },
          { path: 'departamentos', component: DepartamentosComponent },
        ],
      },

      // --- COMPETENCIAS ---
      {
        path: 'competencias',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'fundamentales' },
          {
            path: 'fundamentales',
            component: CompetenciasFundamentalesComponent,
          },
          {
            path: 'especificas',
            component: CompetenciasEspecificasComponent,
          },
        ],
      },

      // --- EDUCACIÓN VIRTUAL ---
      { path: 'educacion-virtual', component: EducacionVirtualComponent },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
