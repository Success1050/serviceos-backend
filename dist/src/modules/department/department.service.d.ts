import { PrismaService } from '../../core/prisma/prisma.service';
export declare class DepartmentService {
    private prisma;
    constructor(prisma: PrismaService);
    createDepartment(tenantId: string, name: string): Promise<{
        name: string;
        id: string;
        tenantId: string;
    }>;
    getDepartments(tenantId: string): Promise<({
        _count: {
            users: number;
        };
    } & {
        name: string;
        id: string;
        tenantId: string;
    })[]>;
    deleteDepartment(tenantId: string, id: string): Promise<{
        name: string;
        id: string;
        tenantId: string;
    }>;
}
