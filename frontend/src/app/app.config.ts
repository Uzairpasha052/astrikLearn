import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptor/auth-interceptor';

// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideToastr } from 'ngx-toastr';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(),
    provideRouter(routes), 
    provideHttpClient(
      withInterceptors([ authInterceptor ])
    ),

    // provideAnimationAsync(),
    provideToastr({
      timeOut: 4000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
      newestOnTop: true,
      easing: 'ease-in',
      easeTime: 300,
      tapToDismiss: true,
      enableHtml: true
    }),

  ]
};
