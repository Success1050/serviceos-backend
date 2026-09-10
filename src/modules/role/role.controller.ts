import { Controller, Post, Get, Delete, Body, Param, Patch } from '@nestjs/common';
import { RoleService } from './role.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Permissions } from '../../core/decorators/permissions.decorator';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions('manage_roles')
  async create(@Body() dto: any, @CurrentUser() user: any) {
    const isHQ = !user.parentId; // If parentId is missing or null, they are HQ
    return this.roleService.createRole(user.tenantId, isHQ, dto);
  }

  @Get()
  @Permissions('manage_roles')
  async findAll(@CurrentUser() user: any) {
    return this.roleService.getAllRolesForTenant(user.tenantId);
  }

  @Patch('assign/:userId')
  @Permissions('manage_users')
  async assignRole(@Param('userId') userId: string, @Body('roleId') roleId: string, @CurrentUser() user: any) {
    return this.roleService.assignRoleToUser(user.tenantId, userId, roleId);
  }

  @Patch('direct-permissions/:userId')
  @Permissions('manage_users')
  async assignDirectPermissions(@Param('userId') userId: string, @Body('permissions') permissions: string[], @CurrentUser() user: any) {
    return this.roleService.assignDirectPermissions(user.tenantId, userId, permissions);
  }

  @Patch(':id/permissions')
  @Permissions('manage_roles')
  async updateRolePermissions(@Param('id') roleId: string, @Body('permissions') permissions: string[], @CurrentUser() user: any) {
    return this.roleService.updateRolePermissions(user.tenantId, roleId, permissions);
  }

  @Delete(':id')
  @Permissions('manage_roles')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roleService.deleteRole(user.tenantId, id);
  }
}
