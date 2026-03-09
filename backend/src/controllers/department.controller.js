// department.controller controller: handles HTTP request/response flow for this module.
import complaintDB from '../model/connect.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  Department,
  deleteDepartmentById,
  insertDepartment,
  selectPublicDepartmentsByOrganizationId,
  selectDepartments,
  selectDepartmentsByOrganizationId,
  selectDepartmentById,
  updateDepartmentById
} from '../model/department.model.js';
import { selectOrganizationById } from '../model/organization.model.js';
import { denySuperAdminInternalAccess } from '../utils/tenantScope.js';

export const CreateDepartmentTable = () => {
  complaintDB.get(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'department'",
    [],
    (inspectErr, row) => {
      if (inspectErr) {
        console.error('Error checking department table schema:', inspectErr.message);
        return;
      }

      const schemaSql = row?.sql || '';
      const needsMigration =
        schemaSql.includes('REFERENCES accessment(') || schemaSql.includes('assessment_id');

      if (!needsMigration) {
        complaintDB.run(Department, (createErr) => {
          if (createErr) {
            console.error('Error creating department table:', createErr.message);
          } else {
            console.log('Department table created or already exists');
          }
        });
        return;
      }

      complaintDB.serialize(() => {
        complaintDB.run('PRAGMA foreign_keys = OFF');
        complaintDB.run('BEGIN TRANSACTION');
        complaintDB.run('ALTER TABLE department RENAME TO department_old', (renameErr) => {
          if (renameErr) {
            console.error('Error preparing department migration:', renameErr.message);
            complaintDB.run('ROLLBACK');
            complaintDB.run('PRAGMA foreign_keys = ON');
            return;
          }

          complaintDB.run(Department, (createErr) => {
            if (createErr) {
              console.error('Error creating migrated department table:', createErr.message);
              complaintDB.run('ROLLBACK');
              complaintDB.run('PRAGMA foreign_keys = ON');
              return;
            }

            complaintDB.run(
              `INSERT INTO department (id, organization_id, name, description, accessment_id, created_at)
               SELECT id, organization_id, name, description, accessment_id, created_at
               FROM department_old`,
              (copyErr) => {
                if (copyErr) {
                  console.error('Error copying department data during migration:', copyErr.message);
                  complaintDB.run('ROLLBACK');
                  complaintDB.run('PRAGMA foreign_keys = ON');
                  return;
                }

                complaintDB.run('DROP TABLE department_old', (dropErr) => {
                  if (dropErr) {
                    console.error('Error finalizing department migration:', dropErr.message);
                    complaintDB.run('ROLLBACK');
                    complaintDB.run('PRAGMA foreign_keys = ON');
                    return;
                  }

                  complaintDB.run('COMMIT', (commitErr) => {
                    if (commitErr) {
                      console.error('Error committing department migration:', commitErr.message);
                      complaintDB.run('ROLLBACK');
                    } else {
                      console.log('Department table migrated successfully');
                    }
                    complaintDB.run('PRAGMA foreign_keys = ON');
                  });
                });
              }
            );
          });
        });
      });
    }
  );
};

export const createDepartment = (req, res) => {
  const {
    name,
    description = null,
    accessment_id = null,
    assessment_id = null
  } = req.body;
  const normalizedAccessmentId = accessment_id ?? assessment_id;

  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage departments directly')) {
    return;
  }
  if (req.user?.role !== 'org_admin') {
    return sendError(res, 403, 'Only org_admin can manage departments');
  }
  if (!req.user?.organization_id || !name) {
    return sendError(res, 400, 'organization_id and name are required');
  }

  complaintDB.run(
    insertDepartment,
    [req.user.organization_id, name, description, normalizedAccessmentId],
    function onCreate(err) {
      if (err) {
        return sendError(res, 500, 'Failed to create department', err.message);
      }

      complaintDB.get(selectDepartmentById, [this.lastID], (getErr, row) => {
        if (getErr) {
          return sendError(res, 500, 'Failed to fetch department', getErr.message);
        }
        return sendSuccess(res, 201, 'Department created successfully', row);
      });
    }
  );
};

export const getAllDepartments = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access department records directly')) {
    return;
  }
  if (req.user?.role !== 'org_admin') {
    return sendError(res, 403, 'Only org_admin can access departments');
  }

  complaintDB.all(selectDepartmentsByOrganizationId, [req.user.organization_id], (err, rows) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch departments', err.message);
    }
    return sendSuccess(res, 200, 'Departments retrieved successfully', rows);
  });
};

export const getDepartmentById = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot access department records directly')) {
    return;
  }
  if (req.user?.role !== 'org_admin') {
    return sendError(res, 403, 'Only org_admin can access departments');
  }

  complaintDB.get(selectDepartmentById, [req.params.id], (err, row) => {
    if (err) {
      return sendError(res, 500, 'Failed to fetch department', err.message);
    }
    if (!row) {
      return sendError(res, 404, 'Department not found');
    }
    if (String(row.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }
    return sendSuccess(res, 200, 'Department retrieved successfully', row);
  });
};

export const getPublicDepartmentsByOrganization = (req, res) => {
  const organizationId = Number(req.params.organizationId);

  if (!Number.isInteger(organizationId) || organizationId <= 0) {
    return sendError(res, 400, 'organizationId must be a valid organization id');
  }

  complaintDB.get(selectOrganizationById, [organizationId], (orgErr, organizationRow) => {
    if (orgErr) {
      return sendError(res, 500, 'Failed to validate organization', orgErr.message);
    }
    if (!organizationRow) {
      return sendError(res, 404, 'Organization not found');
    }
    if (String(organizationRow.status || '').toLowerCase() !== 'active') {
      return sendError(res, 400, 'Selected organization is not active');
    }

    complaintDB.all(selectPublicDepartmentsByOrganizationId, [organizationId], (err, rows) => {
      if (err) {
        return sendError(res, 500, 'Failed to fetch departments', err.message);
      }
      return sendSuccess(res, 200, 'Departments retrieved successfully', rows);
    });
  });
};

export const updateDepartment = (req, res) => {
  const {
    name,
    description = null,
    accessment_id = null,
    assessment_id = null
  } = req.body;
  const normalizedAccessmentId = accessment_id ?? assessment_id;

  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage departments directly')) {
    return;
  }
  if (req.user?.role !== 'org_admin') {
    return sendError(res, 403, 'Only org_admin can manage departments');
  }
  if (!req.user?.organization_id || !name) {
    return sendError(res, 400, 'organization_id and name are required');
  }

  complaintDB.get(selectDepartmentById, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch department', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Department not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(
      updateDepartmentById,
      [req.user.organization_id, name, description, normalizedAccessmentId, req.params.id],
      function onUpdate(err) {
        if (err) {
          return sendError(res, 500, 'Failed to update department', err.message);
        }

        complaintDB.get(selectDepartmentById, [req.params.id], (getErr, row) => {
          if (getErr) {
            return sendError(res, 500, 'Failed to fetch updated department', getErr.message);
          }
          return sendSuccess(res, 200, 'Department updated successfully', row);
        });
      }
    );
  });
};

export const deleteDepartment = (req, res) => {
  if (denySuperAdminInternalAccess(req, res, 'Super admin cannot manage departments directly')) {
    return;
  }
  if (req.user?.role !== 'org_admin') {
    return sendError(res, 403, 'Only org_admin can manage departments');
  }

  complaintDB.get(selectDepartmentById, [req.params.id], (findErr, existing) => {
    if (findErr) {
      return sendError(res, 500, 'Failed to fetch department', findErr.message);
    }
    if (!existing) {
      return sendError(res, 404, 'Department not found');
    }
    if (String(existing.organization_id) !== String(req.user.organization_id)) {
      return sendError(res, 403, 'Access denied');
    }

    complaintDB.run(deleteDepartmentById, [req.params.id], function onDelete(err) {
      if (err) {
        return sendError(res, 500, 'Failed to delete department', err.message);
      }
      return sendSuccess(res, 200, 'Department deleted successfully', { id: req.params.id });
    });
  });
};
