import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Permissions('admin_access')
  async create(@Body('name') name: string, @CurrentUser() user: any) {
    return this.departmentService.createDepartment(user.tenantId, name);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.departmentService.getDepartments(user.tenantId);
  }

  @Delete(':id')
  @Permissions('admin_access')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.departmentService.deleteDepartment(user.tenantId, id);
  }
}
