import "server-only";

/**
 * Model registry. Import models from here so they are registered exactly once
 * (avoids OverwriteModelError across HMR & serverless).
 */
export { User, type UserDoc } from "./User";
export { Settings, type SettingsDoc } from "./Settings";
export { Template, type TemplateDoc } from "./Template";
export { Invite, type InviteDoc } from "./Invite";
export { Rsvp, type RsvpDoc } from "./Rsvp";
export { GuestLink, type GuestLinkDoc } from "./GuestLink";
export { Guestbook, type GuestbookDoc } from "./Guestbook";
export { InviteView, type InviteViewDoc } from "./InviteView";
export { AnalyticsDaily, type AnalyticsDailyDoc } from "./AnalyticsDaily";
