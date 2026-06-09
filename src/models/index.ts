import "server-only";

/**
 * Model registry. Import models from here so they are registered exactly once
 * (avoids "OverwriteModelError" / missing-model issues across HMR & serverless).
 * As collections are added in later phases (Invite, RSVP, …) export them here too.
 */
export { User, type UserDoc } from "./User";
export { Settings, type SettingsDoc } from "./Settings";
