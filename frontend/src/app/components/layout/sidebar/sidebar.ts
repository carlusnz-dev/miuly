import { Component } from '@angular/core';
import {
  LucideActivity,
  LucideBell,
  LucideCalendar,
  LucideHouse,
  LucideListTodo,
  LucideSettings,
  LucideUserRound,
  LucideWallet,
} from '@lucide/angular';
import { Brand } from '../../ui/brand/brand';

@Component({
  selector: 'app-sidebar',
  imports: [
    Brand,
    LucideActivity,
    LucideBell,
    LucideCalendar,
    LucideHouse,
    LucideListTodo,
    LucideSettings,
    LucideUserRound,
    LucideWallet,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {}
