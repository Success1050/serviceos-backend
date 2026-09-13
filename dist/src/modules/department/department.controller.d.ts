import { DepartmentService } from './department.service';
export declare class DepartmentController {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    create(name: string, user: any): Promise<{
        name: string;
        id: string;
        tenantId: string;
    }>;
    findAll(user: any): Promise<({
        _count: {
            users: number;
        };
    } & {
        name: string;
        id: string;
        tenantId: string;
    })[]>;
    remove(id: string, user: any): Promise<{
        name: string;
        id: string;
        tenantId: string;
    }>;
}
