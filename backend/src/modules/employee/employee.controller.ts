import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { CreateEmployeeDTO } from './dto/created_employee';
import {EmployeeService} from './employee.service';
import { Employee } from '@prisma/client';
import { EmployeeFilterType } from './dto/employee_filter_type';
import { EmployeePaginType } from './dto/employee_pagin_type';
import { UpdatedEmployeeDTO } from './dto/updated_employee';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
@Controller('employee')
export class EmployeeController {
    constructor(private employeeService: EmployeeService) {}
    @Post()
    create(@Body() body: CreateEmployeeDTO): Promise<Employee> {
        return this.employeeService.createEmployee(body);
    }

    @Get()
    getAll(@Query() params: EmployeeFilterType, @Req() req: any): Promise<EmployeePaginType> {
        const actor = extractActorFromRequest(req);
        return this.employeeService.getAll(params, actor as any);
    }

    @Get(':id')
    getByID(@Param('id') id: string, @Req() req: any): Promise<Employee | null> {
        const actor = extractActorFromRequest(req);
        return this.employeeService.getByID(id, actor as any);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() body: UpdatedEmployeeDTO): Promise<Employee> {
        return this.employeeService.updateEmployee(id, body);
    }

    @Delete(':id')
    delete (@Param('id') id:string): Promise<Employee>{
        return this.employeeService.deleteEmployee(id);
    }

    @Put(':id/avatar')
    @UseInterceptors(FileInterceptor('avatar', {
        storage: diskStorage({
            destination: './uploads/avatar',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = file.originalname.split('.').pop();
                cb(null, `employee-${uniqueSuffix}.${ext}`);
            }
        })
    }))
    uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File): Promise<Employee> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        return this.employeeService.updateEmployeeAvatar(id, file.filename);
    }
}