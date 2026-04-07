<script setup>
import { onMounted, reactive, ref } from 'vue';
import PageHeader from '../../components/superAdmin/PageHeader.vue';
import ErrorState from '../../components/ui/ErrorState.vue';
import FormField from '../../components/ui/FormField.vue';
import LoadingSpinner from '../../components/ui/LoadingSpinner.vue';
import { extractApiError, settingsApi } from '../../services/api';
import { useSessionStore } from '../../stores/session';

const MAX_IMAGE_FILE_SIZE_BYTES = 1024 * 1024 * 2;
const session = useSessionStore();
const loading = ref(false);
const savingProfile = ref(false);
const savingSecurity = ref(false);
const error = ref('');
const success = ref('');
const profileImageError = ref('');

const settingsPayload = ref(null);

const profileForm = reactive({
  full_name: '',
  email: '',
  phone: '',
  profile_image: ''
});

const notificationForm = reactive({
  notify_email_updates: true,
  notify_status_updates: true,
  notify_public_feedback: false
});

const preferenceForm = reactive({
  anonymity_preference: false
});

const securityForm = reactive({
  new_email: '',
  current_password_for_email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
});

const hydratePage = (payload) => {
  settingsPayload.value = payload;
  profileForm.full_name = payload?.profile?.full_name || '';
  profileForm.email = payload?.profile?.email || '';
  profileForm.phone = payload?.profile?.phone || '';
  profileForm.profile_image = payload?.profile?.profile_image || '';

  notificationForm.notify_email_updates = Boolean(payload?.notifications?.notify_email_updates);
  notificationForm.notify_status_updates = Boolean(payload?.notifications?.notify_status_updates);
  notificationForm.notify_public_feedback = Boolean(payload?.notifications?.notify_public_feedback);

  preferenceForm.anonymity_preference = Boolean(payload?.preferences?.anonymity_preference);
  securityForm.new_email = payload?.profile?.email || '';
};

const loadPage = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';
  profileImageError.value = '';
  try {
    const response = await settingsApi.getUserCurrent();
    hydratePage(response);
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to load user settings');
  } finally {
    loading.value = false;
  }
};

const onProfileImageFileChange = (event) => {
  profileImageError.value = '';
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    profileImageError.value = 'Please select an image file.';
    return;
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    profileImageError.value = 'Image is too large. Maximum allowed size is 2MB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    profileForm.profile_image = String(reader.result || '');
  };
  reader.onerror = () => {
    profileImageError.value = 'Failed to read image file.';
  };
  reader.readAsDataURL(file);
};

const saveProfileAndPreferences = async () => {
  savingProfile.value = true;
  error.value = '';
  success.value = '';
  profileImageError.value = '';
  try {
    if (
      profileForm.profile_image &&
      profileForm.profile_image.startsWith('data:') &&
      profileForm.profile_image.length > MAX_IMAGE_FILE_SIZE_BYTES * 1.4
    ) {
      throw new Error('Profile image data is too large. Use a smaller image or a hosted URL.');
    }

    const response = await settingsApi.updateUserCurrent({
      profile: {
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        profile_image: profileForm.profile_image
      },
      notifications: {
        notify_email_updates: notificationForm.notify_email_updates,
        notify_status_updates: notificationForm.notify_status_updates,
        notify_public_feedback: notificationForm.notify_public_feedback
      },
      preferences: {
        anonymity_preference: preferenceForm.anonymity_preference
      }
    });
    hydratePage(response);
    session.currentUser = {
      ...(session.currentUser || {}),
      full_name: response.profile.full_name,
      profile_image: response.profile.profile_image
    };
    success.value = 'User settings updated successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to save user settings');
  } finally {
    savingProfile.value = false;
  }
};

const saveSecurity = async () => {
  savingSecurity.value = true;
  error.value = '';
  success.value = '';
  try {
    if (
      securityForm.new_email &&
      securityForm.new_email.trim().toLowerCase() !== String(settingsPayload.value?.profile?.email || '').toLowerCase()
    ) {
      await session.changeEmail({
        new_email: securityForm.new_email.trim(),
        current_password: securityForm.current_password_for_email
      });
    }

    if (securityForm.new_password || securityForm.confirm_password || securityForm.current_password) {
      if (securityForm.new_password !== securityForm.confirm_password) {
        throw new Error('New password and confirmation do not match');
      }
      await session.changePassword({
        current_password: securityForm.current_password,
        new_password: securityForm.new_password
      });
    }

    securityForm.current_password_for_email = '';
    securityForm.current_password = '';
    securityForm.new_password = '';
    securityForm.confirm_password = '';
    await loadPage();
    success.value = 'Security settings updated successfully.';
  } catch (requestError) {
    error.value = extractApiError(requestError, 'Failed to update security settings');
  } finally {
    savingSecurity.value = false;
  }
};

onMounted(loadPage);
</script>

<template>
  <section class="app-admin-page">
    <div class="app-page-shell app-admin-page-shell">
      <div class="app-workspace-stack">
        <PageHeader
          kicker="User Settings"
          title="Account Settings"
          description="Manage your personal profile, security controls, notification preferences, and account-level privacy preferences without changing organization-level configuration."
        />

        <LoadingSpinner v-if="loading" label="Loading user settings..." />
        <ErrorState v-else-if="error && !settingsPayload" title="Unable to load user settings" :description="error" />

        <template v-else>
          <ErrorState v-if="error" title="Action failed" :description="error" />

          <div
            v-if="success"
            class="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
          >
            {{ success }}
          </div>

          <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr),minmax(0,0.95fr)]">
            <section class="space-y-4">
              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Profile</p>
                  <h2 class="app-section-title">Personal Details</h2>
                  <p class="app-section-description">Update the profile information tied to your own account only.</p>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField v-model="profileForm.full_name" label="Full Name" />
                  <FormField v-model="profileForm.email" label="Email" type="email" disabled help="Use the Security section to change your email." />
                  <FormField v-model="profileForm.phone" label="Phone" />
                </div>

                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[120px,minmax(0,1fr)]">
                  <div class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[var(--app-line)] bg-[var(--app-surface-soft)] text-lg font-semibold text-[var(--app-primary)]">
                    <img v-if="profileForm.profile_image" :src="profileForm.profile_image" alt="Profile image preview" class="h-full w-full object-cover">
                    <span v-else>{{ (profileForm.full_name || 'U').trim().charAt(0).toUpperCase() || 'U' }}</span>
                  </div>

                  <div class="space-y-3">
                    <label class="flex flex-col gap-2">
                      <span class="text-sm font-medium text-[var(--app-title-color)]">Upload Profile Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="w-full rounded-xl border border-[var(--app-line)] bg-white px-4 py-3 text-sm text-slate-900 outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--app-surface-soft)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 focus:border-[var(--app-primary)]"
                        @change="onProfileImageFileChange"
                      >
                    </label>
                    <FormField
                      v-model="profileForm.profile_image"
                      label="Profile Image URL"
                      help="You can upload an image or paste a hosted image URL."
                    />
                    <p v-if="profileImageError" class="text-sm text-red-600">{{ profileImageError }}</p>
                  </div>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Notifications</p>
                  <h2 class="app-section-title">Account Notification Preferences</h2>
                  <p class="app-section-description">Choose which updates should be surfaced to your account.</p>
                </div>

                <div class="grid grid-cols-1 gap-3">
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="notificationForm.notify_email_updates" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Email Notifications</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Receive account-related updates by email when available.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="notificationForm.notify_status_updates" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Status Updates</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Be notified when tracked items or account-related statuses change.</p>
                    </div>
                  </label>
                  <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                    <input v-model="notificationForm.notify_public_feedback" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                    <div>
                      <p class="text-sm font-semibold text-[var(--app-title-color)]">Public Feedback Updates</p>
                      <p class="mt-1 text-xs text-[var(--app-muted-color)]">Opt in if your account should receive public-feedback related updates when applicable.</p>
                    </div>
                  </label>
                </div>
              </section>

              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Preferences</p>
                  <h2 class="app-section-title">Personal Preferences</h2>
                  <p class="app-section-description">Control optional personal behavior like anonymity preference on supported flows.</p>
                </div>

                <label class="flex items-start gap-3 rounded-[20px] border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-4 py-4">
                  <input v-model="preferenceForm.anonymity_preference" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--app-primary)] focus:ring-[var(--app-primary)]">
                  <div>
                    <p class="text-sm font-semibold text-[var(--app-title-color)]">Prefer Anonymous Submission</p>
                    <p class="mt-1 text-xs text-[var(--app-muted-color)]">Use this as your default preference on supported complaint and feedback flows.</p>
                  </div>
                </label>
              </section>

              <div class="flex justify-end">
                <button class="app-btn-primary" :disabled="savingProfile" @click="saveProfileAndPreferences">
                  {{ savingProfile ? 'Saving...' : 'Save Profile and Preferences' }}
                </button>
              </div>
            </section>

            <section class="space-y-4">
              <section class="app-section-card">
                <div class="mb-4">
                  <p class="app-kicker">Security</p>
                  <h2 class="app-section-title">Email and Password</h2>
                  <p class="app-section-description">Security changes apply only to your own account and do not affect organization-level settings.</p>
                </div>

                <div class="space-y-4">
                  <FormField v-model="securityForm.new_email" label="New Email" type="email" help="Changing email requires your current password." />
                  <FormField v-model="securityForm.current_password_for_email" label="Current Password for Email Change" type="password" />
                </div>

                <div class="mt-6 grid grid-cols-1 gap-4">
                  <FormField v-model="securityForm.current_password" label="Current Password" type="password" />
                  <FormField v-model="securityForm.new_password" label="New Password" type="password" />
                  <FormField v-model="securityForm.confirm_password" label="Confirm New Password" type="password" />
                </div>

                <div class="mt-5 flex justify-end">
                  <button class="app-btn-primary" :disabled="savingSecurity" @click="saveSecurity">
                    {{ savingSecurity ? 'Saving...' : 'Save Security Settings' }}
                  </button>
                </div>
              </section>
            </section>
          </section>
        </template>
      </div>
    </div>
  </section>
</template>
