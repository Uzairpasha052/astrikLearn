import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environment/environment';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const platformId = inject(PLATFORM_ID)

  if(isPlatformBrowser(platformId)){
    const token = localStorage.getItem('token')

    if(token && req.url.startsWith(environment.apiUrl)){
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}`}
      })
    }
  }

  return next(req)
  // const token = localStorage.getItem('token')

  // if(token && req.url.startsWith(environment.apiUrl))
  // {
  //   const authReq = req.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`
  //     }
  //   })
  //   return next(authReq)
  // }
  // return next(req);
};
