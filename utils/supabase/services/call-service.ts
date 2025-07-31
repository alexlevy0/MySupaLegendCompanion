import { supabase } from "../client";
import { Call } from "../types";
import { authState$ } from "../auth/auth-state";

// =====================================================
// SERVICE APPELS
// =====================================================

// Récupérer les appels d'un senior
export async function getSeniorCalls(seniorId: string) {
  try {
    console.log("📞 Loading calls for senior:", seniorId);
    console.log("📏 Senior ID length:", seniorId?.length);
    console.log("📏 Senior ID type:", typeof seniorId);

    // Vérifier l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    console.log("👤 Current user:", user?.id, user?.email);

    // D'abord, vérifier si ce senior existe
    const { data: seniorExists, error: seniorError } = await supabase
      .from("seniors")
      .select("id, first_name, last_name")
      .eq("id", seniorId)
      .single();
    
    console.log("👴 Senior exists?", seniorExists ? `Yes: ${seniorExists.first_name} ${seniorExists.last_name}` : "No", "Error:", seniorError);

    // Ensuite, chercher tous les appels pour voir les senior_ids
    const { data: allCalls, error: allError } = await supabase
      .from("calls")
      .select("senior_id")
      .eq("deleted", false)
      .limit(5);
    
    console.log("🔍 Sample senior_ids from calls:", allCalls?.map(c => c.senior_id));

    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .order("started_at", { ascending: false });

    console.log("📊 Query result - data:", data?.length || 0, "error:", error);
    
    if (error) {
      console.error("❌ Supabase error details:", error.message, error.details, error.hint);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get senior calls:", error);
    return [];
  }
}

// Récupérer un appel par ID
export async function getCallById(callId: string): Promise<Call | null> {
  try {
    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("id", callId)
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
    console.error("❌ Failed to get call by ID:", error);
    return null;
  }
}

// Créer un nouvel appel
export async function createCall(callData: {
  senior_id: string;
  call_type: string;
  status?: string;
  started_at?: string;
}) {
  try {
    console.log("📞 Creating new call:", callData);

    const { data, error } = await supabase
      .from("calls")
      .insert({
        ...callData,
        status: callData.status || "scheduled",
        started_at: callData.started_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Call created successfully:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Failed to create call:", error);
    throw error;
  }
}

// Mettre à jour un appel
export async function updateCall(
  callId: string,
  updates: Partial<Call>
) {
  try {
    console.log("🔄 Updating call:", callId);

    const { error } = await supabase
      .from("calls")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", callId);

    if (error) throw error;

    console.log("✅ Call updated successfully");
  } catch (error) {
    console.error("❌ Failed to update call:", error);
    throw error;
  }
}

// Terminer un appel
export async function endCall(
  callId: string,
  endData: {
    quality_score?: number;
    conversation_summary?: string;
    mood_detected?: string;
  }
) {
  try {
    console.log("📞 Ending call:", callId);

    // Récupérer l'appel pour calculer la durée
    const { data: call, error: fetchError } = await supabase
      .from("calls")
      .select("started_at")
      .eq("id", callId)
      .single();

    if (fetchError) throw fetchError;

    const startedAt = new Date(call.started_at);
    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000
    );

    const { error } = await supabase
      .from("calls")
      .update({
        status: "completed",
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        ...endData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", callId);

    if (error) throw error;

    console.log("✅ Call ended successfully");
    return { durationSeconds };
  } catch (error) {
    console.error("❌ Failed to end call:", error);
    throw error;
  }
}

// Annuler un appel
export async function cancelCall(callId: string, reason?: string) {
  try {
    console.log("❌ Cancelling call:", callId);

    const { error } = await supabase
      .from("calls")
      .update({
        status: "cancelled",
        conversation_summary: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", callId);

    if (error) throw error;

    console.log("✅ Call cancelled successfully");
  } catch (error) {
    console.error("❌ Failed to cancel call:", error);
    throw error;
  }
}

// Récupérer les statistiques d'appels
export async function getCallStats(seniorId: string, period: "week" | "month" | "year" = "month") {
  try {
    console.log("📊 Loading call stats for senior:", seniorId);

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

    const { data: calls, error } = await supabase
      .from("calls")
      .select("*")
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .eq("status", "completed")
      .gte("started_at", startDate.toISOString());

    if (error) throw error;

    // Calculer les statistiques
    const stats = {
      totalCalls: calls?.length || 0,
      totalDuration: calls?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0,
      averageDuration: 0,
      averageQuality: 0,
      moodDistribution: {} as Record<string, number>,
    };

    if (calls && calls.length > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / calls.length);
      
      const qualityCalls = calls.filter(c => c.quality_score);
      if (qualityCalls.length > 0) {
        stats.averageQuality = qualityCalls.reduce((sum, c) => sum + c.quality_score, 0) / qualityCalls.length;
      }

      // Distribution des humeurs
      calls.forEach(call => {
        if (call.mood_detected) {
          stats.moodDistribution[call.mood_detected] = (stats.moodDistribution[call.mood_detected] || 0) + 1;
        }
      });
    }

    console.log("✅ Call stats loaded:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Failed to get call stats:", error);
    return {
      totalCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
      averageQuality: 0,
      moodDistribution: {},
    };
  }
}

// Récupérer le prochain appel planifié
export async function getNextScheduledCall(seniorId: string) {
  try {
    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("senior_id", seniorId)
      .eq("status", "scheduled")
      .eq("deleted", false)
      .gte("started_at", new Date().toISOString())
      .order("started_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to get next scheduled call:", error);
    return null;
  }
}

// Planifier un appel récurrent
export async function scheduleRecurringCalls(
  seniorId: string,
  pattern: {
    frequency: "daily" | "weekly" | "monthly";
    time: string; // Format HH:MM
    daysOfWeek?: number[]; // 0-6 pour weekly
    dayOfMonth?: number; // 1-31 pour monthly
  },
  numberOfCalls: number = 4
) {
  try {
    console.log("📅 Scheduling recurring calls:", seniorId, pattern);

    const calls = [];
    const now = new Date();
    let nextCallDate = new Date();

    // Définir l'heure de l'appel
    const [hours, minutes] = pattern.time.split(":").map(Number);
    nextCallDate.setHours(hours, minutes, 0, 0);

    // Si l'heure est déjà passée aujourd'hui, commencer demain
    if (nextCallDate <= now) {
      nextCallDate.setDate(nextCallDate.getDate() + 1);
    }

    for (let i = 0; i < numberOfCalls; i++) {
      // Calculer la prochaine date selon le pattern
      switch (pattern.frequency) {
        case "daily":
          if (i > 0) nextCallDate.setDate(nextCallDate.getDate() + 1);
          break;
          
        case "weekly":
          if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
            // Trouver le prochain jour de la semaine dans la liste
            let daysToAdd = 1;
            while (!pattern.daysOfWeek.includes(nextCallDate.getDay())) {
              nextCallDate.setDate(nextCallDate.getDate() + 1);
              daysToAdd++;
              if (daysToAdd > 7) break; // Sécurité
            }
            if (i > 0) {
              nextCallDate.setDate(nextCallDate.getDate() + 7);
            }
          } else {
            if (i > 0) nextCallDate.setDate(nextCallDate.getDate() + 7);
          }
          break;
          
        case "monthly":
          if (i > 0) {
            nextCallDate.setMonth(nextCallDate.getMonth() + 1);
            if (pattern.dayOfMonth) {
              nextCallDate.setDate(pattern.dayOfMonth);
            }
          }
          break;
      }

      calls.push({
        senior_id: seniorId,
        call_type: "scheduled",
        status: "scheduled",
        started_at: new Date(nextCallDate).toISOString(),
      });
    }

    // Créer tous les appels
    const { data, error } = await supabase
      .from("calls")
      .insert(calls)
      .select();

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} calls scheduled successfully`);
    return data;
  } catch (error) {
    console.error("❌ Failed to schedule recurring calls:", error);
    throw error;
  }
}