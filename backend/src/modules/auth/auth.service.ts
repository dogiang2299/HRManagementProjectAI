import { PrismaService } from "src/prisma.service";
import { RegisterDTO } from "./dto/auth.dto";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { hash, compare } from "bcrypt";
import { Employee } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';
import { generateCode } from "src/common/utils/generate-code.util";
import { CandidateLoginDTO, CandidateRegisterDTO } from "./dto/candidate-auth.dto";
import { MailService } from "../mail/mail.service";


@Injectable() // => class này là server và NestJS có quyền quản lý nó 
export class AuthService {
    constructor (private prismaService: PrismaService, private jwtService: JwtService, private mailService: MailService) {}

    async register(userData: RegisterDTO): Promise<Employee> {
      const email = userData.email_account.trim().toLowerCase();
      const phone = userData.phone_account.trim();

      // 1) check unique email/phone trước (ngoài tx cho nhẹ)
      const existing = await this.prismaService.employee.findFirst({
        where: { OR: [{ email_account: email }, { phone_account: phone }] },
        select: { id: true },
      });
      if (existing) {
        throw new HttpException('Email or phone number already exists', HttpStatus.BAD_REQUEST);
      }

      const passwordHash = await hash(userData.password, 10);

      // 2) tạo user + gán emp_code trong transaction để giảm race condition
      const createdUser = await this.prismaService.$transaction(async (tx) => {
        const lastEmp = await tx.employee.findFirst({
          where: { emp_code: { not: null, startsWith: 'EC_' } },
          orderBy: { emp_code: 'desc' },
          select: { emp_code: true },
        });

        let nextNumber = 1;
        const last = lastEmp?.emp_code;
        if (last) {
          const m = last.match(/^EC_(\d+)$/);
          if (m) nextNumber = Number(m[1]) + 1;
        }

        const empCode = generateCode('EC', nextNumber);

        return tx.employee.create({
          data: {
            emp_code: empCode, 
            email_account: email,
            phone_account: phone,
            password: passwordHash,
            status: userData.status ?? 'Active',
            is_active: true,
          },
        });
      });

      return createdUser;
    }

async login(userData: { phone_account: string; password: string }) {
  const phone = userData.phone_account.trim();

  const user = await this.prismaService.employee.findUnique({
    where: { phone_account: phone },
    include: { roles: { include: { role: true } }, company: true }, // nếu bạn cần roles
  });

  if (!user) throw new HttpException('Phone number does not exist', HttpStatus.UNAUTHORIZED);

  const ok = await compare(userData.password, user.password);
  if (!ok) throw new HttpException('Password is incorrect', HttpStatus.UNAUTHORIZED);

  const roles = user.roles?.map((x) => x.role?.name_role).filter(Boolean) ?? [];
  const payload = {
    id: user.id,
    phone_account: user.phone_account,
    roles,
    company_id: user.company_id ?? null,
  };

  const accessToken = await this.jwtService.signAsync(payload, {
    secret: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: '8h',
  });

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: '7d',
  });

  // ❗ bỏ password trước khi trả về
  const { password, ...safeUser } = user;

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
}

async checkUserByPhone (phoneAccount: string){
  const employee = await this.prismaService.employee.findFirst({
    where: {
      phone_account: phoneAccount,
    },
    select: {
      id: true, employee_name: true
    }
    
  })
  if(!employee){
    throw new HttpException('User not found with this phone number', HttpStatus.BAD_REQUEST);
  }

  return {
    message: 'User found',
    data: {
      id: employee.id,
      name: employee.employee_name
    }
  }
}

async changePassword (userId: string, newPassword: string){
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(newPassword, salt);
  await this.prismaService.employee.update({
    where: {id: userId},
    data: {
      password: hashPassword
    }
  })
  return { message: 'Password changed successfully' };
}

async registerCandidate(userData: CandidateRegisterDTO) {
  const email = userData.email_account.trim().toLowerCase();
  const phone = userData.phone_account.trim();

  const existing = await this.prismaService.employee.findFirst({
    where: { OR: [{ email_account: email }, { phone_account: phone }] },
    select: { id: true },
  });
  if (existing) {
    throw new HttpException('Email or phone number already exists', HttpStatus.BAD_REQUEST);
  }

  const candidateRole = await this.prismaService.role.findFirst({
    where: {
      name_role: 'Candidate',
      is_active: true,
      status: { not: 'Inactive' },
    },
    select: { id: true },
  });

  if (!candidateRole) {
    throw new HttpException('Role Candidate is not configured', HttpStatus.BAD_REQUEST);
  }

  const passwordHash = await hash(userData.password, 10);

  const created = await this.prismaService.$transaction(async (tx) => {
    const lastEmp = await tx.employee.findFirst({
      where: { emp_code: { not: null, startsWith: 'EC_' } },
      orderBy: { emp_code: 'desc' },
      select: { emp_code: true },
    });

    let nextNumber = 1;
    const last = lastEmp?.emp_code;
    if (last) {
      const m = last.match(/^EC_(\d+)$/);
      if (m) nextNumber = Number(m[1]) + 1;
    }

    const empCode = generateCode('EC', nextNumber);

    const employee = await tx.employee.create({
      data: {
        emp_code: empCode,
        employee_name: userData.employee_name?.trim() || null,
        email_account: email,
        phone_account: phone,
        password: passwordHash,
        status: 'Active',
        is_active: true,
      },
    });

    await tx.employeeRole.create({
      data: {
        id_employee: employee.id,
        id_role: candidateRole.id,
      },
    });

    return employee;
  });

  const { password, ...safeUser } = created;
  return {
    message: 'Candidate account created successfully',
    user: safeUser,
  };
}

async loginCandidate(userData: CandidateLoginDTO) {
  const phone = userData.phone_account.trim();

  const user = await this.prismaService.employee.findUnique({
    where: { phone_account: phone },
    include: { roles: { include: { role: true } } },
  });

  if (!user) throw new HttpException('Phone number does not exist', HttpStatus.UNAUTHORIZED);

  const ok = await compare(userData.password, user.password);
  if (!ok) throw new HttpException('Password is incorrect', HttpStatus.UNAUTHORIZED);

  const roles = user.roles?.map((x) => x.role?.name_role).filter(Boolean) ?? [];
  if (!roles.includes('Candidate')) {
    throw new HttpException('This account is not a Candidate account', HttpStatus.FORBIDDEN);
  }

  const payload = {
    id: user.id,
    phone_account: user.phone_account,
    roles,
    company_id: user.company_id ?? null,
  };

  const accessToken = await this.jwtService.signAsync(payload, {
    secret: process.env.ACCESS_TOKEN_SECRET,
    expiresIn: '8h',
  });

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiresIn: '7d',
  });

  const { password, ...safeUser } = user;

  return {
    accessToken,
    refreshToken,
    user: safeUser,
  };
}
private generateOtp(length = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

async forgotPassword(emailAccount: string) {
  const email = emailAccount.trim().toLowerCase();

  const employee = await this.prismaService.employee.findFirst({
    where: {
      email_account: email,
      is_active: true,
    },
    select: {
      id: true,
      email_account: true,
      employee_name: true,
    },
  });

  if (!employee) {
    throw new HttpException('Email does not exist', HttpStatus.BAD_REQUEST);
  }

  const otpCode = this.generateOtp(6);
  const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

  // Đánh dấu các OTP cũ chưa dùng của email này thành used để tránh rối
  await this.prismaService.passwordResetOtp.updateMany({
    where: {
      email,
      is_used: false,
    },
    data: {
      is_used: true,
    },
  });

  await this.prismaService.passwordResetOtp.create({
    data: {
      employee_id: employee.id,
      email,
      otp_code: otpCode,
      expired_at: expiredAt,
      is_used: false,
    },
  });

  await this.mailService.sendMail({
    to: email,
    subject: 'OTP Password Reset - ITJob',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 12px;">Password Reset OTP</h2>
        <p>Xin chào${employee.employee_name ? ` ${employee.employee_name}` : ''},</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản ITJob.</p>
        <p>Mã OTP của bạn là:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0; color: #334371;">
          ${otpCode}
        </div>
        <p>Mã OTP có hiệu lực trong <b>5 phút</b>.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
      </div>
    `,
    text: `Your OTP code is ${otpCode}. It will expire in 5 minutes.`,
  });

  return {
    message: 'OTP has been sent to your email',
  };
}

async verifyForgotPasswordOtp(emailAccount: string, otpCode: string) {
  const email = emailAccount.trim().toLowerCase();
  const otp = otpCode.trim();

  const record = await this.prismaService.passwordResetOtp.findFirst({
    where: {
      email,
      otp_code: otp,
      is_used: false,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!record) {
    throw new HttpException('OTP is invalid', HttpStatus.BAD_REQUEST);
  }

  if (record.expired_at.getTime() < Date.now()) {
    throw new HttpException('OTP has expired', HttpStatus.BAD_REQUEST);
  }

  return {
    message: 'OTP is valid',
  };
}

async resetPasswordByOtp(emailAccount: string, otpCode: string, newPassword: string) {
  const email = emailAccount.trim().toLowerCase();
  const otp = otpCode.trim();

  const record = await this.prismaService.passwordResetOtp.findFirst({
    where: {
      email,
      otp_code: otp,
      is_used: false,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  if (!record) {
    throw new HttpException('OTP is invalid', HttpStatus.BAD_REQUEST);
  }

  if (record.expired_at.getTime() < Date.now()) {
    throw new HttpException('OTP has expired', HttpStatus.BAD_REQUEST);
  }

  const employee = await this.prismaService.employee.findFirst({
    where: {
      email_account: email,
      is_active: true,
    },
    select: {
      id: true,
    },
  });

  if (!employee) {
    throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(newPassword, salt);

  await this.prismaService.$transaction([
    this.prismaService.employee.update({
      where: { id: employee.id },
      data: {
        password: hashPassword,
      },
    }),
    this.prismaService.passwordResetOtp.update({
      where: { id: record.id },
      data: {
        is_used: true,
      },
    }),
  ]);

  return {
    message: 'Password reset successfully',
  };
}
}