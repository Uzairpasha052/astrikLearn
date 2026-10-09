import { inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { isPlatformBrowser } from '@angular/common';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

  const authService = inject(AuthService)
  const router = inject(Router)
  const platformId = inject(PLATFORM_ID)

  if(!isPlatformBrowser(platformId)){
    return true
  }

  const allowedRoles = (route.data['roles'] as string[]) ?? []
  const userRole = authService.getRole()

  if(allowedRoles.includes(userRole ?? '')){
    return true
  }

  return router.createUrlTree(['/unauthorized']);
  
};
