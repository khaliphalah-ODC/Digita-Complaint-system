const PASSWORD_RESET_WEBHOOK_URL = process.env.PASSWORD_RESET_WEBHOOK_URL;
const PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || '';
const PASSWORD_RESET_EMAIL_SUBJECT = process.env.PASSWORD_RESET_EMAIL_SUBJECT || 'Password reset instructions';
const canCallWebhook = Boolean(PASSWORD_RESET_WEBHOOK_URL);

const callWebhook = async (url, payload, description, email) => {
  if (!url) return;
  if (typeof fetch !== 'function') {
    console.warn(`Fetch is unavailable; cannot call ${description} webhook for`, email);
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`${description} webhook returned non-OK status`, response.status, 'for', email);
    }
  } catch (error) {
    console.error(`Failed to call ${description} webhook for`, email, error?.message || error);
  }
};

export const sendPasswordResetNotification = async ({ email, token, expiresAt, metadata = {} }) => {
  if (!canCallWebhook) {
    console.warn('PASSWORD_RESET_WEBHOOK_URL is not set; skipping password reset notification for', email);
    return;
  }

  const payload = {
    email,
    token,
    expires_at: expiresAt,
    subject: PASSWORD_RESET_EMAIL_SUBJECT,
    reset_url: PASSWORD_RESET_URL,
    metadata
  };

  await callWebhook(PASSWORD_RESET_WEBHOOK_URL, payload, 'password reset', email);
};
