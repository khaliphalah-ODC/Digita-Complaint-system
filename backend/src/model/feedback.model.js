export const Feedback = `
 Create table if not exists feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER,
  user_id INTEGER,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`

export const createFeedbackQuery = `INSERT INTO feedback (complaint_id, user_id, rating, comment) VALUES (?, ?, ?, ?);`;
export const fetchAllFeedbackQuery = `SELECT * FROM feedback ORDER BY id DESC;`;
export const fetchFeedbackByIdQuery = `SELECT * FROM feedback WHERE id = ?;`;
export const fetchFeedbackByComplaintIdQuery = `SELECT * FROM feedback WHERE complaint_id = ? ORDER BY created_at DESC;`;
export const updateFeedbackQuery = `
UPDATE feedback
SET rating = ?, comment = ?
WHERE id = ?;
`;
export const deleteFeedbackByComplaintIdQuery = `DELETE FROM feedback WHERE complaint_id = ?;`;
export const deleteFeedbackByIdQuery = `DELETE FROM feedback WHERE id = ?;`;
