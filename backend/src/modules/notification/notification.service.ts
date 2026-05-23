import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { QueryNotificationDto } from "./dto/query-notification.dto";
import { PrismaService } from "src/prisma.service";
import { NOTIFICATION_TYPE, NOTIFICATION_RELATED_TYPE, NOTIFICATION_RECEIVER_ROLE } from "src/constant";




@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        receiver_id: dto.receiver_id,
        receiver_role: dto.receiver_role,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        related_type: dto.related_type,
        related_id: dto.related_id,
        is_read: dto.is_read ?? false,
      },
    });
  }

  async findMine(params: {
    receiverId: string;
    receiverRole: string;
    query: QueryNotificationDto;
  }) {
    const page = Number(params.query.page || 1);
    const limit = Number(params.query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {
      receiver_id: params.receiverId,
      receiver_role: params.receiverRole,
    };

    if (params.query.type) {
      where.type = params.query.type;
    }

    if (params.query.is_read !== undefined) {
      where.is_read = params.query.is_read === "true";
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          receiver_id: params.receiverId,
          receiver_role: params.receiverRole,
          is_read: false,
        },
      }),
    ]);

    // Normalize legacy notifications that stored application_id instead of recruitment_infor_id.
    const legacyApplicationRelatedIds = items
      .filter(
        (item) =>
          (item.type === NOTIFICATION_TYPE.NEW_APPLICATION ||
            item.type === NOTIFICATION_TYPE.APPLICATION_REMINDER) &&
          item.related_type === NOTIFICATION_RELATED_TYPE.APPLICATION &&
          Boolean(item.related_id),
      )
      .map((item) => item.related_id as string);

    let recruitmentIdByApplicationId = new Map<string, string>();
    if (legacyApplicationRelatedIds.length > 0) {
      const applications = await this.prisma.application.findMany({
        where: { id: { in: legacyApplicationRelatedIds } },
        select: { id: true, recruitment_infor_id: true },
      });
      recruitmentIdByApplicationId = new Map(
        applications
          .filter((app) => Boolean(app.recruitment_infor_id))
          .map((app) => [app.id, app.recruitment_infor_id as string]),
      );
    }

    const normalizedItems = items.map((item) => {
      const shouldNormalize =
        (item.type === NOTIFICATION_TYPE.NEW_APPLICATION ||
          item.type === NOTIFICATION_TYPE.APPLICATION_REMINDER) &&
        item.related_type === NOTIFICATION_RELATED_TYPE.APPLICATION &&
        Boolean(item.related_id);

      if (!shouldNormalize) {
        return item;
      }

      const normalizedRelatedId = recruitmentIdByApplicationId.get(item.related_id as string);
      if (!normalizedRelatedId) {
        return item;
      }

      return {
        ...item,
        related_type: NOTIFICATION_RELATED_TYPE.RECRUITMENT_INFOR,
        related_id: normalizedRelatedId,
      };
    });

    return {
      total,
      page,
      limit,
      unreadCount,
      items: normalizedItems,
    };
  }

  async getUnreadCount(receiverId: string, receiverRole: string) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        receiver_id: receiverId,
        receiver_role: receiverRole,
        is_read: false,
      },
    });

    return { count: unreadCount };
  }

  async findOneMine(id: string, receiverId: string, receiverRole: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        receiver_id: receiverId,
        receiver_role: receiverRole,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    return notification;
  }

  async markAsRead(id: string, receiverId: string, receiverRole: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        receiver_id: receiverId,
        receiver_role: receiverRole,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  async markAllAsRead(receiverId: string, receiverRole: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        receiver_id: receiverId,
        receiver_role: receiverRole,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async remove(id: string, receiverId: string, receiverRole: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        receiver_id: receiverId,
        receiver_role: receiverRole,
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return {
      message: "Notification deleted successfully",
    };
  }

  async notifyNewApplication(params: {
    employerId: string;
    candidateName?: string | null;
    jobTitle?: string | null;
    recruitmentId: string;
  }) {
    return this.create({
      receiver_id: params.employerId,
      receiver_role: NOTIFICATION_RECEIVER_ROLE.EMPLOYER,
      type: NOTIFICATION_TYPE.NEW_APPLICATION,
      title: "Có ứng viên mới ứng tuyển",
      content: `${params.candidateName || "Một ứng viên"} vừa ứng tuyển vào vị trí ${
        params.jobTitle || "tin tuyển dụng"
      }.`,
      related_type: NOTIFICATION_RELATED_TYPE.RECRUITMENT_INFOR,
      related_id: params.recruitmentId,
    });
  }

  async notifyApplicationStatusChanged(params: {
    candidateId: string;
    jobTitle?: string | null;
    applicationId: string;
    newStatus: string;
  }) {
    const normalizedStatus = params.newStatus
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

    if (normalizedStatus === "REVIEWING") {
      return null;
    }

    const titleByStatus: Record<string, string> = {
      CONTACTED: "Nhà tuyển dụng đã liên hệ với bạn",
      INTERVIEWING: "Bạn đã được chuyển sang vòng phỏng vấn",
      WAITING_RESPONSE: "Hồ sơ đang chờ phản hồi",
      ACCEPTED: "Chúc mừng! Hồ sơ của bạn đã được chấp nhận",
      REJECTED: "Cập nhật kết quả ứng tuyển",
    };

    const contentByStatus: Record<string, string> = {
      CONTACTED: `Nhà tuyển dụng đã liên hệ với bạn cho vị trí ${
        params.jobTitle || "đã ứng tuyển"
      }`,
      INTERVIEWING: `Hồ sơ của bạn đã được chuyển sang vòng phỏng vấn cho vị trí ${
        params.jobTitle || "đã ứng tuyển"
      }`,
      WAITING_RESPONSE: "Hồ sơ của bạn đang chờ phản hồi từ nhà tuyển dụng",
      ACCEPTED: `Chúc mừng! Hồ sơ của bạn đã được chấp nhận cho vị trí ${
        params.jobTitle || "đã ứng tuyển"
      }`,
      REJECTED: `Hồ sơ của bạn chưa phù hợp với vị trí ${
        params.jobTitle || "đã ứng tuyển"
      }`,
    };

    const title =
      titleByStatus[normalizedStatus] || "Trạng thái hồ sơ đã được cập nhật";
    const content =
      contentByStatus[normalizedStatus] ||
      `Hồ sơ ứng tuyển ${params.jobTitle || "của bạn"} đã chuyển sang trạng thái ${
        params.newStatus
      }.`;

    return this.create({
      receiver_id: params.candidateId,
      receiver_role: NOTIFICATION_RECEIVER_ROLE.CANDIDATE,
      type: NOTIFICATION_TYPE.APPLICATION_STATUS,
      title,
      content,
      related_type: NOTIFICATION_RELATED_TYPE.APPLICATION,
      related_id: params.applicationId,
    });
  }

  async notifyApplicationReminder(params: {
    employerId: string;
    recruitmentId: string;
    tab: "APPLIED" | "CONTACTED" | "INTERVIEWING" | "WAITING_RESPONSE";
    content?: string;
  }) {
    const titleByTab = {
      APPLIED: "Nhắc xử lý hồ sơ mới ứng tuyển",
      CONTACTED: "Nhắc cập nhật hồ sơ đã liên hệ",
      INTERVIEWING: "Nhắc cập nhật kết quả phỏng vấn",
      WAITING_RESPONSE: "Nhắc phản hồi hồ sơ đang chờ",
    } as const;

    const defaultContentByTab = {
      APPLIED: "Có hồ sơ đã ứng tuyển quá 24 giờ chưa được xử lý.",
      CONTACTED: "Có hồ sơ đã liên hệ quá 2 ngày chưa cập nhật vòng phỏng vấn.",
      INTERVIEWING: "Có hồ sơ phỏng vấn quá 2 ngày chưa cập nhật kết quả.",
      WAITING_RESPONSE: "Có hồ sơ chờ phản hồi quá 2 ngày chưa cập nhật kết quả.",
    } as const;

    return this.create({
      receiver_id: params.employerId,
      receiver_role: NOTIFICATION_RECEIVER_ROLE.EMPLOYER,
      type: NOTIFICATION_TYPE.APPLICATION_REMINDER,
      title: titleByTab[params.tab],
      content: params.content || defaultContentByTab[params.tab],
      related_type: NOTIFICATION_RELATED_TYPE.RECRUITMENT_INFOR,
      related_id: params.recruitmentId,
    });
  }

  async notifyChatMessage(params: {
    receiverId: string;
    receiverRole: string;
    conversationId: string;
    senderName?: string | null;
  }) {
    return this.create({
      receiver_id: params.receiverId,
      receiver_role: params.receiverRole,
      type: NOTIFICATION_TYPE.CHAT_MESSAGE,
      title: "Bạn có tin nhắn mới",
      content: `${params.senderName || "Người dùng"} vừa gửi tin nhắn cho bạn.`,
      related_type: NOTIFICATION_RELATED_TYPE.CHAT_CONVERSATION,
      related_id: params.conversationId,
    });
  }

  async notifyJobRecommendation(params: {
    candidateId: string;
    recruitmentId: string;
    jobTitle?: string | null;
  }) {
    return this.create({
      receiver_id: params.candidateId,
      receiver_role: NOTIFICATION_RECEIVER_ROLE.CANDIDATE,
      type: NOTIFICATION_TYPE.JOB_RECOMMENDATION,
      title: "Có việc làm phù hợp với bạn",
      content: `Hệ thống tìm thấy vị trí ${
        params.jobTitle || "mới"
      } có thể phù hợp với hồ sơ của bạn.`,
      related_type: NOTIFICATION_RELATED_TYPE.RECRUITMENT_INFOR,
      related_id: params.recruitmentId,
    });
  }

  private formatInterviewTime(interviewTime?: Date | null) {
    if (!interviewTime) return null;

    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(interviewTime);
  }

  async notifyInterviewScheduleCreated(params: {
    candidateId: string;
    applicationId?: string | null;
    jobTitle?: string | null;
    interviewTime?: Date | null;
    interviewLocation?: string | null;
    interviewRoom?: string | null;
    meetingLink?: string | null;
    action?: "created" | "updated";
  }) {
    const formattedInterviewTime = this.formatInterviewTime(
      params.interviewTime,
    );
    const isUpdated = params.action === "updated";
    const actionText = isUpdated ? "cập nhật" : "lên";
    const detailLines = [
      params.jobTitle ? `- Vị trí: ${params.jobTitle}` : null,
      formattedInterviewTime ? `- Thời gian: ${formattedInterviewTime}` : null,
      params.interviewLocation ? `- Địa điểm: ${params.interviewLocation}` : null,
      params.interviewRoom ? `- Phòng: ${params.interviewRoom}` : null,
      params.meetingLink ? `- Link phỏng vấn: ${params.meetingLink}` : null,
    ].filter(Boolean);
    const contentLines = [
      `Nhà tuyển dụng đã ${actionText} lịch phỏng vấn${
        params.jobTitle ? ` cho vị trí ${params.jobTitle}` : ""
      }.`,
      detailLines.length ? "" : null,
      detailLines.length ? "Thông tin lịch phỏng vấn:" : null,
      ...detailLines,
      "",
      "Vui lòng kiểm tra thông tin và phản hồi đúng hạn.",
    ];

    return this.create({
      receiver_id: params.candidateId,
      receiver_role: NOTIFICATION_RECEIVER_ROLE.CANDIDATE,
      type: NOTIFICATION_TYPE.APPLICATION_STATUS,
      title: isUpdated
        ? "Lịch phỏng vấn của bạn đã được cập nhật"
        : "Bạn có lịch phỏng vấn mới",
      content: contentLines.filter((line) => line !== null).join("\n"),
      related_type: params.applicationId
        ? NOTIFICATION_RELATED_TYPE.APPLICATION
        : NOTIFICATION_RELATED_TYPE.SYSTEM,
      related_id: params.applicationId || undefined,
    });
  }

  async notifySystem(params: {
    receiverId: string;
    receiverRole: string;
    title: string;
    content?: string;
  }) {
    return this.create({
      receiver_id: params.receiverId,
      receiver_role: params.receiverRole,
      type: NOTIFICATION_TYPE.SYSTEM,
      title: params.title,
      content: params.content,
      related_type: NOTIFICATION_RELATED_TYPE.SYSTEM,
    });
  }
}
