import { observable } from "@legendapp/state";
import { supabase, customSynced } from "../client";

// Export de tous les observables
export * from "./users";
export * from "./seniors";
export * from "./calls";
export * from "./alerts";
export * from "./todos";

// =====================================================
// OBSERVABLE FAMILY REPORTS
// =====================================================

// 📨 FAMILY_REPORTS
export const familyReports$ = observable(
  customSynced({
    supabase,
    collection: "family_reports",
    select: (from) =>
      from.select(
        "id,counter,senior_id,family_member_id,report_type,report_period_start,report_period_end,content,delivery_method,sent_at,opened_at,status,created_at,updated_at,deleted"
      ),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "family_reports",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);