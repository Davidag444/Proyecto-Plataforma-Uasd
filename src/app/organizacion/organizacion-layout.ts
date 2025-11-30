import { Component } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organizacion-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './organizacion-layout.html',
  styleUrls: ['./organizacion.css'],
})
export class OrganizacionLayoutComponent {}
