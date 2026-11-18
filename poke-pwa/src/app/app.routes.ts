import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pokemon' },
  {
    path: 'pokemon',
    loadComponent: () =>
      import('./features/pokemon-list/pokemon-list').then((m) => m.PokemonList),
  },
  {
    path: 'push-test',
    loadComponent: () =>
      import('./features/push-test/push-test').then((m) => m.PushTest),
  },
  {
    path: 'acerca',
    loadComponent: () => import('./pages/acerca/acerca').then((m) => m.Acerca),
  },
  { path: '**', redirectTo: 'pokemon' },
];
