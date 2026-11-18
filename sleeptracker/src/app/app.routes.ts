import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'today', loadComponent: () => import('./today/today.page').then((m) => m.TodayPage) },
      { path: 'history', loadComponent: () => import('./history/history.page').then((m) => m.HistoryPage) },
      { path: 'settings', loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage) },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/today', pathMatch: 'full' },
];
