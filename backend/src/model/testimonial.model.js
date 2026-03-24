// testimonial.model.js model: defines SQLite schema and SQL queries for this module.

export const testimonialsQuery = `
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  role_label TEXT DEFAULT 'System User',
  message TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  is_approved INTEGER NOT NULL DEFAULT 0 CHECK(is_approved IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export const createTestimonialQuery = `
INSERT INTO testimonials (user_id, display_name, role_label, message, rating, is_approved)
VALUES (?, ?, ?, ?, ?, 0);
`;

export const fetchApprovedTestimonialsQuery = `
SELECT id, display_name, role_label, message, rating, created_at
FROM testimonials
WHERE is_approved = 1
ORDER BY created_at DESC;
`;

export const fetchAllTestimonialsQuery = `
SELECT
  testimonials.id,
  testimonials.user_id,
  testimonials.display_name,
  testimonials.role_label,
  testimonials.message,
  testimonials.rating,
  testimonials.is_approved,
  testimonials.created_at,
  users.organization_id,
  users.full_name AS user_full_name,
  users.email AS user_email
FROM testimonials
LEFT JOIN users ON users.id = testimonials.user_id
ORDER BY testimonials.created_at DESC;
`;

export const fetchTestimonialsByOrganizationQuery = `
SELECT
  testimonials.id,
  testimonials.user_id,
  testimonials.display_name,
  testimonials.role_label,
  testimonials.message,
  testimonials.rating,
  testimonials.is_approved,
  testimonials.created_at,
  users.organization_id
FROM testimonials
INNER JOIN users ON users.id = testimonials.user_id
WHERE users.organization_id = ?
ORDER BY testimonials.created_at DESC;
`;

export const fetchTestimonialByIdQuery = `
SELECT * FROM testimonials WHERE id = ?;
`;

export const fetchTestimonialByIdWithOrganizationQuery = `
SELECT
  testimonials.*,
  users.organization_id
FROM testimonials
INNER JOIN users ON users.id = testimonials.user_id
WHERE testimonials.id = ?;
`;

export const approveTestimonialQuery = `
UPDATE testimonials SET is_approved = 1 WHERE id = ?;
`;

export const rejectTestimonialQuery = `
UPDATE testimonials SET is_approved = 0 WHERE id = ?;
`;

export const deleteTestimonialQuery = `
DELETE FROM testimonials WHERE id = ?;
`;
