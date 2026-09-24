import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { useSession } from '../../../auth/session';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly session = useSession();
}
