import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { InforcompanyModule } from './modules/inforcompany/inforcompany.module';
import { RoleModule } from './modules/role/role.module';
import { RecinformModule } from './modules/recinform/recinform.module';
import { PositionPostModule } from './modules/setting/position_post/position_post.module';
import { PositionGroupModule } from './modules/setting/position_group/position_group.module';
import { RankModule } from './modules/setting/rank/rank.module';
import { TrainlevModule } from './modules/setting/trainlev/trainlev.module';
import { PotcanModule } from './modules/setting/potcan/potcan.module';
import { SendEmailModule } from './modules/setting/send_email/send_email.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { InterviewScheModule } from './modules/interview_sche/interview_sche.module';
import { JobModule } from './modules/job/job.module';
import { SkillModule } from './modules/skill/skill.module';
import { CompanyRegisterModule } from './modules/company_register/company_register.module';
import { CandidateReviewModule } from './modules/candidate_review/candidate_review.module';
import { ApplicationModule } from './modules/application/application.module';
import { AuditLogModule } from './modules/audit_log/audit_log.module';
import { SavejobModule } from './modules/savejob/savejob.module';
import { MailModule } from './modules/mail/mail.module';
import { CandidateEmailModule } from './modules/candidate_email/candidate_email.module';
import { CompanyFollowModule } from './modules/company-follow/company-follow.module';
import { JobChatModule } from './modules/job-chat/job-chat.module';
import { RecommendationModule } from './modules/recommend/recommend.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CandidateCvModule } from './modules/candidate-cv/candidate-cv.module';
import { BlogPostModule } from './modules/blog-post/blog-post.module';
import { CompanySkillModule } from './modules/company-skill/company-skill.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule,
    PrismaModule,
    EmployeeModule,
    InforcompanyModule,
    RoleModule,
    RecinformModule,
    PositionPostModule,
    PositionGroupModule,
    RankModule,
    TrainlevModule,
    PotcanModule,
    SendEmailModule,
    CandidateModule,
    InterviewScheModule,
    JobModule,
    SkillModule,
    CompanyRegisterModule,
    SavejobModule,
    CandidateReviewModule,
    ApplicationModule,
    AuditLogModule,
    DashboardModule,
    MailModule,
    CandidateEmailModule,
    CompanyFollowModule,
    JobChatModule,
    RecommendationModule,
    ConversationModule,
    NotificationModule,
    CandidateCvModule,
    BlogPostModule,
    CompanySkillModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
