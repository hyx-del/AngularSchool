

import { MenuManager } from './global/menu'
import {
    AuthGuard,
    FileService,
    ClassService,
    RoleService,
    HeadQuartersResolve,
    HandleResponse,
    SchoolResolve,
    ClassResolve
} from './providers'
import { PacService, GroupResolver } from './providers/permission';
export const Provider: any[] = [
    MenuManager,
    AuthGuard,
    FileService,
    ClassService,
    RoleService,
    HandleResponse,
    SchoolResolve,
    ClassResolve,
    PacService,
    { provide: GroupResolver, useExisting: ClassService},
    HeadQuartersResolve
]
