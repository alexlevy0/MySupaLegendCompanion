import { supabase } from "../client";
import { Alert } from "../types";
import { authState$ } from "../auth/auth-state";
import { createAlert as createAlertObservable, acknowledgeAlert as acknowledgeAlertObservable } from "../observables/alerts";

// =====================================================
// SERVICE ALERTES
// =====================================================

// Récupérer les alertes d'un senior
export async function getSeniorAlerts(seniorId: string) {
  try {
    console.log("🚨 Loading alerts for senior:", seniorId);

    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get senior alerts:", error);
    return [];
  }
}

// Récupérer les alertes actives (non résolues)
export async function getActiveAlerts(seniorId?: string) {
  try {
    console.log("🚨 Loading active alerts");

    let query = supabase
      .from("alerts")
      .select(
        `
        *,
        seniors (
          id,
          first_name,
          last_name
        ),
        calls (
          id,
          started_at,
          call_type
        )
      `
      )
      .eq("deleted", false)
      .in("status", ["new", "acknowledged"])
      .order("severity", { ascending: false })
      .order("created_at", { ascending: false });

    if (seniorId) {
      query = query.eq("senior_id", seniorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get active alerts:", error);
    return [];
  }
}

// Récupérer une alerte par ID
export async function getAlertById(alertId: string): Promise<Alert | null> {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", alertId)
      .eq("deleted", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error("❌ Failed to get alert by ID:", error);
    return null;
  }
}

// Créer une nouvelle alerte (utilise l'observable)
export { createAlertObservable as createAlert };

// Acquitter une alerte (utilise l'observable)
export { acknowledgeAlertObservable as acknowledgeAlert };

// Résoudre une alerte
export async function resolveAlert(
  alertId: string,
  resolutionNotes?: string
) {
  try {
    console.log("✅ Resolving alert:", alertId);

    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("alerts")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) throw error;

    console.log("✅ Alert resolved successfully");
  } catch (error) {
    console.error("❌ Failed to resolve alert:", error);
    throw error;
  }
}

// Mettre à jour une alerte
export async function updateAlert(
  alertId: string,
  updates: Partial<Alert>
) {
  try {
    console.log("🔄 Updating alert:", alertId);

    const { error } = await supabase
      .from("alerts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) throw error;

    console.log("✅ Alert updated successfully");
  } catch (error) {
    console.error("❌ Failed to update alert:", error);
    throw error;
  }
}

// Récupérer les statistiques d'alertes
export async function getAlertStats(seniorId: string, period: "week" | "month" | "year" = "month") {
  try {
    console.log("📊 Loading alert stats for senior:", seniorId);

    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .gte("created_at", startDate.toISOString());

    if (error) throw error;

    // Calculer les statistiques
    const stats = {
      totalAlerts: alerts?.length || 0,
      byStatus: {
        new: 0,
        acknowledged: 0,
        resolved: 0,
      },
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byType: {} as Record<string, number>,
      averageResolutionTime: 0,
      unresolvedCount: 0,
    };

    if (alerts && alerts.length > 0) {
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      alerts.forEach(alert => {
        // Par statut
        stats.byStatus[alert.status as keyof typeof stats.byStatus]++;
        
        // Par sévérité
        stats.bySeverity[alert.severity as keyof typeof stats.bySeverity]++;
        
        // Par type
        stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1;
        
        // Temps de résolution
        if (alert.status === "resolved" && alert.resolved_at) {
          const createdAt = new Date(alert.created_at);
          const resolvedAt = new Date(alert.resolved_at);
          totalResolutionTime += resolvedAt.getTime() - createdAt.getTime();
          resolvedCount++;
        }
        
        // Non résolues
        if (alert.status !== "resolved") {
          stats.unresolvedCount++;
        }
      });

      // Temps moyen de résolution (en heures)
      if (resolvedCount > 0) {
        stats.averageResolutionTime = Math.round(
          totalResolutionTime / resolvedCount / (1000 * 60 * 60)
        );
      }
    }

    console.log("✅ Alert stats loaded:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Failed to get alert stats:", error);
    return {
      totalAlerts: 0,
      byStatus: { new: 0, acknowledged: 0, resolved: 0 },
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {},
      averageResolutionTime: 0,
      unresolvedCount: 0,
    };
  }
}

// Récupérer les alertes par sévérité
export async function getAlertsBySeverity(
  severity: "low" | "medium" | "high" | "critical",
  limit: number = 10
) {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select(
        `
        *,
        seniors (
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("severity", severity)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get alerts by severity:", error);
    return [];
  }
}

// Marquer plusieurs alertes comme lues
export async function markAlertsAsRead(alertIds: string[]) {
  try {
    console.log("👁️ Marking alerts as read:", alertIds.length);

    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("alerts")
      .update({
        status: "acknowledged",
        acknowledged_by: currentUser.id,
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in("id", alertIds)
      .eq("status", "new");

    if (error) throw error;

    console.log("✅ Alerts marked as read successfully");
  } catch (error) {
    console.error("❌ Failed to mark alerts as read:", error);
    throw error;
  }
}

// Créer une alerte de test
export async function createTestAlert(seniorId: string) {
  try {
    console.log("🧪 Creating test alert for senior:", seniorId);

    const testAlert = {
      senior_id: seniorId,
      alert_type: "test",
      severity: "low" as const,
      title: "Alerte de test",
      description: "Ceci est une alerte de test pour vérifier le système",
      detected_indicators: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
      }),
      confidence_score: 1.0,
      status: "new" as const,
    };

    createAlertObservable(testAlert);

    console.log("✅ Test alert created successfully");
  } catch (error) {
    console.error("❌ Failed to create test alert:", error);
    throw error;
  }
}