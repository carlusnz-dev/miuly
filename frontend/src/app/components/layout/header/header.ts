import { Component } from '@angular/core';
import { Brand } from '../../ui/brand/brand';

@Component({
  selector: 'app-header',
  imports: [Brand],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
