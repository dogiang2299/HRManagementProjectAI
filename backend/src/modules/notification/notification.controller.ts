import {
  ForbiddenException,
  UnauthorizedException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { QueryNotificationDto } from "./dto/query-notification.dto";
import { PrismaService } from "src/prisma.service";
import { extractActorFromRequest } from "src/common/utils/request-actor.util";
import { NOTIFICATION_RECEIVER_ROLE } from "src/constant";

@Controller("notifications")
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("me")
  async findMine(@Req() req: any, @Query() query: QueryNotificationDto) {
    const { receiverId, receiverRole } = await this.getReceiverFromRequest(req);

    return this.notificationService.findMine({
      receiverId,
      receiverRole,
      query,
    });
  }

  @Get("me/unread-count")
  async unreadCount(@Req() req: any) {
    const { receiverId, receiverRole } = await this.getReceiverFromRequest(req);

    return this.notificationService.getUnreadCount(receiverId, receiverRole);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: any) {
    const { receiverId, receiverRole } = await this.getReceiverFromRequest(req);

    return this.notificationService.findOneMine(id, receiverId, receiverRole);
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @Req() req: any) {
    const { receiverId, receiverRole } = await this.getReceiverFromRequest(req);

    return this.notificationService.markAsRead(id, receiverId, receiverRole);
  }

  @Patch("me/read-all")
  async markAllAsRead(@Req() req: any) {
    const { receiverId, receiverRole } = await this.getReceiverFromRequest(req);

    return this.notificationService.markAllAsRead(receiverId, receiverRole);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req: any) {
    const { receiverId, receiverRole } = await this.getReceiverFromRequest(req);

    return this.notificationService.remove(id, receiverId, receiverRole);
  }

  // Endpoint này chỉ nên cho admin/internal dùng.
  @Post()
  async create(@Body() dto: CreateNotificationDto, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    const reqUserRoles = this.normalizeRoles(req?.user);
    const actorRoles = Array.isArray(actor.roles)
      ? actor.roles.map((role) => String(role).toLowerCase())
      : [];
    const mergedRoles = Array.from(new Set([...reqUserRoles, ...actorRoles]));

    if (!mergedRoles.includes("admin")) {
      throw new ForbiddenException("Only admin can create notifications manually");
    }

    return this.notificationService.create(dto);
  }

  private normalizeRoles(user: any): string[] {
    const raw = Array.isArray(user?.roles)
      ? user.roles
      : typeof user?.role === "string"
        ? [user.role]
        : [];

    return raw
      .map((role: any) => {
        if (typeof role === "string") return role;
        if (typeof role?.role === "string") return role.role;
        return role?.role?.name_role || role?.name_role || role?.name || "";
      })
      .filter(Boolean)
      .map((role: string) => role.toLowerCase());
  }

  private async getReceiverFromRequest(req: any) {
    const actor = extractActorFromRequest(req);
    const user = req.user;

    const actorRoles = Array.isArray(actor.roles)
      ? actor.roles.map((role) => String(role).toLowerCase())
      : [];
    const reqUserRoles = this.normalizeRoles(user);
    const roles = Array.from(new Set([...actorRoles, ...reqUserRoles]));

    const employeeId =
      actor.actorEmployeeId ||
      user?.employee_id ||
      user?.id;

    const isCandidate = roles.includes("candidate");
    const isAdmin = roles.includes("admin");
    const isEmployer = roles.includes("employer");
    const isEmployee = roles.includes("employee");

    if (user?.candidate_id || isCandidate) {
      let candidateId = user?.candidate_id;

      if (!candidateId && employeeId) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: employeeId },
          select: {
            email_account: true,
            phone_account: true,
          },
        });

        const candidate = await this.prisma.candidate.findFirst({
          where: {
            OR: [
              { employee_id: employeeId || undefined },
              employee?.email_account ? { email: employee.email_account } : undefined,
              employee?.phone_account ? { phone_number: employee.phone_account } : undefined,
            ].filter(Boolean) as any,
          },
          select: { id: true },
        });
        candidateId = candidate?.id;
      }

      if (candidateId) {
        return {
          receiverId: candidateId,
          receiverRole: NOTIFICATION_RECEIVER_ROLE.CANDIDATE,
        };
      }
    }

    if (employeeId) {
      return {
        receiverId: employeeId,
        receiverRole: isAdmin
          ? NOTIFICATION_RECEIVER_ROLE.ADMIN
          : isEmployer
            ? NOTIFICATION_RECEIVER_ROLE.EMPLOYER
            : isEmployee
              ? NOTIFICATION_RECEIVER_ROLE.EMPLOYEE
              : NOTIFICATION_RECEIVER_ROLE.EMPLOYER,
      };
    }

    throw new UnauthorizedException("Cannot detect notification receiver from request");
  }
}
