import router from 'express';
import { createNewDepartment, getAllDepartment } from '../controllers/department.controller.js';

const DepartmentRouter = router();

DepartmentRouter.route('/')
    .get(getAllDepartment)
    .post(createNewDepartment)

export { DepartmentRouter };