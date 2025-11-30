// src/app/personal/personal-layout.ts
import { Component } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-personal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './personal-layout.html',
  styleUrls: ['./personal-layout.css'],
})
export class PersonalLayoutComponent {}
