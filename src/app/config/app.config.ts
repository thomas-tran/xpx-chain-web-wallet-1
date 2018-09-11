import { InjectionToken } from '@angular/core';

export const APP_CONFIG = new InjectionToken('app.config');
export const AppConfig: Config = {
  routes: {
    home: 'home',
    login: 'login',
    notFound: 'not-found'
  },
};

export interface Config {
  routes: {
    home: string;
    login: string;
    notFound: string;
  };
}
