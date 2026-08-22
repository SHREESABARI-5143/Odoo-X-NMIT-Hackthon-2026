import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { employeeQuerySchema } from '../validators/employee.validator';

export class EmployeeController {
  /**
   * POST /employees — Admin/HR only.
   * Creates employee with auto-generated login ID + temp password.
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmployeeService.createEmployee(req.body);
      sendSuccess(res, result, 'Employee created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /employees — Authenticated.
   * Search + pagination + filters.
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const queryParsed = employeeQuerySchema.parse(req.query);
      const page = parseInt(queryParsed.page, 10) || 1;
      const limit = parseInt(queryParsed.limit, 10) || 10;

      const result = await EmployeeService.getEmployees({
        search: queryParsed.search,
        department: queryParsed.department,
        jobPosition: queryParsed.jobPosition,
        location: queryParsed.location,
        status: queryParsed.status,
        joiningYear: queryParsed.joiningYear,
        page,
        limit,
      });

      sendPaginated(res, result.employees, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /employees/:id — Authenticated.
   * Strips sensitive fields based on requester role.
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
      }

      const employee = await EmployeeService.getEmployeeById(
        id,
        req.user!.employeeId,
        req.user!.role
      );
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /employees/:id — Admin/HR or self (limited fields).
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid employee ID.' });
      }

      const employee = await EmployeeService.updateEmployee(
        id,
        req.body,
        req.user!.employeeId,
        req.user!.role
      );
      sendSuccess(res, employee, 'Employee updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
