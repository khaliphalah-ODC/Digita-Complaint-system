import router from 'express';
import { createNewOrganization, getAllOrganization } from '../controllers/organization.controller.js';

const OrganizationRouter = router();

OrganizationRouter.route('/')
    .get(getAllOrganization)
    .post(createNewOrganization)

export { OrganizationRouter };