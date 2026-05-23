import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseInterceptors, BadRequestException, Req } from '@nestjs/common';
import { CreateInforCompanyDTO } from './dto/created_inforcom';
import { InforCompany } from '@prisma/client';
import { InforcompanyService } from './inforcompany.service';
import { InformCompanyFilterType } from './dto/inforcom_filter_type';
import { InformCompanyPaginType } from './dto/inforcom_pagin_type';
import { UpdateInforCompanyDTO } from './dto/updated_inforcom';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

const logoInterceptor = FileInterceptor('logo', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Invalid file type'), ok);
  },
  storage: diskStorage({
    destination: './uploads/logo',
    filename: (req, file, cb) => {
      const safe = sanitizeFilename(file.originalname);
      const ext = safe.includes('.') ? safe.split('.').pop() : '';
      const base = ext ? safe.slice(0, -(ext.length + 1)) : safe;
      const filename = `${Date.now()}-${base}.${ext || 'jpg'}`;
      cb(null, filename);
    },
  }),
});

@Controller('inforcompany')
export class InforcompanyController {
    constructor(private inforCom: InforcompanyService){}
    @Post()
    createInfor(@Body() data: CreateInforCompanyDTO): Promise<InforCompany>{
        return this.inforCom.createInfor(data);
    }

    @Get()
    getAll(@Query() params: InformCompanyFilterType): Promise<InformCompanyPaginType>{
        return this.inforCom.getAll(params);
    }

    @Get('field/:id')
    getCompanyField(@Param('id') id: string): Promise<InforCompany[]>{
        return this.inforCom.getCompanyField(id);
    }

    @Get(':id')
    getByID(@Param('id') id: string): Promise<InforCompany | null>{
        return this.inforCom.getByID(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: UpdateInforCompanyDTO): Promise<InforCompany>{
        return this.inforCom.updateInform(id, body);
    }

    @Delete(':id') 
    delete (@Param('id') id: string): Promise<InforCompany>{
        return this.inforCom.deleteInform(id);
    }

    @Post(':id/upload-logo')
    @UseInterceptors(logoInterceptor)
    async uploadLogo(
      @Param('id') id: string,
      @UploadedFile() file: Express.Multer.File,
      @Req() req: any,
    ) {
      if (!file) throw new BadRequestException('logo file is required');

      const actor = extractActorFromRequest(req);
      const updated = await this.inforCom.replaceLogo(id, file.filename, actor);

      return {
        message: 'Upload logo success',
        image_logo: updated.image_logo,
        logo_url: updated.image_logo ? `/uploads/logo/${updated.image_logo}` : null,
      };
    }
}
