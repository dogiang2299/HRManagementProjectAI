//#region: Trích xuất thông tin người đang gửi request (actor) từ JWT token: xác thực người dùng

// FE gửi request đến BE, BE sẽ trích xuất thông tin người gửi (actor) 
// từ JWT token trong header Authorization của request. Nếu token hợp lệ, 
// BE sẽ trả về thông tin actor như employeeId, role, companyId,... Nếu token không hợp 
// lệ hoặc không có token, BE sẽ coi đó là request từ hệ thống (System) và trả về actorType là 'System'.
// Điều này giúp BE biết được ai đang gửi request và có thể áp dụng các quy tắc phân quyền hoặc logic nghiệp vụ dựa trên thông tin đó.


import { JwtService } from '@nestjs/jwt';

export type RequestActor = {
  actorEmployeeId?: string;
  actorRole?: string;
  roles?: string[];
  company_id?: string | null;
  actorType: 'Employee' | 'System';
};

export function extractActorFromRequest(req: any): RequestActor {
  const jwtService = new JwtService(); // request gửi bên backend
  const auth = req?.headers?.authorization || ''; // lấy token từ header Authorization
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''; // tách token khỏi "Bearer "

  if (!token) {
    return { actorType: 'System' };
  }

  try {
    const payload: any = jwtService.verify(token, {
      secret: process.env.ACCESS_TOKEN_SECRET,
    });
    const actorEmployeeId = payload?.id;
    const roles = Array.isArray(payload?.roles)
      ? payload.roles.filter((r: any) => typeof r === 'string')
      : [];
    const roleRaw = roles[0];
    const actorRole =
      typeof roleRaw === 'string'
        ? roleRaw
        : roleRaw?.role?.name_role || roleRaw?.name_role || roleRaw?.name || undefined;

    if (!actorEmployeeId) {
      return { actorType: 'System' };
    }

    return {
      actorType: 'Employee',
      actorEmployeeId,
      actorRole,
      roles,
      company_id: payload?.company_id ?? null,
    };
  } catch {
    return { actorType: 'System' };
  }
}
