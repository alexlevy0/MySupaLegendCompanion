// Script pour exporter les analytics MyCompanion

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function exportAnalytics() {
  console.log('📊 Exporting MyCompanion Analytics...');
  
  try {
    const analytics = {
      timestamp: new Date().toISOString(),
      overview: {},
      details: {}
    };
    
    // 1. Vue d'ensemble
    console.log('📈 Generating overview metrics...');
    
    const [
      { data: usersData },
      { data: seniorsData },
      { data: callsData },
      { data: alertsData },
      { data: metricsData }
    ] = await Promise.all([
      supabase.from('users').select('user_type, is_active, created_at'),
      supabase.from('seniors').select('created_at, call_frequency'),
      supabase.from('calls').select('status, call_type, quality_score, duration_seconds, mood_detected, created_at'),
      supabase.from('alerts').select('alert_type, severity, status, confidence_score, created_at'),
      supabase.from('well_being_metrics').select('social_score, mood_score, health_score, cognitive_score, engagement_score, overall_score, metric_date')
    ]);
    
    // Overview metrics
    analytics.overview = {
      users: {
        total: usersData?.length || 0,
        by_type: groupBy(usersData || [], 'user_type'),
        active: usersData?.filter(u => u.is_active).length || 0
      },
      seniors: {
        total: seniorsData?.length || 0,
        avg_call_frequency: average(seniorsData?.map(s => s.call_frequency) || [])
      },
      calls: {
        total: callsData?.length || 0,
        by_status: groupBy(callsData || [], 'status'),
        by_type: groupBy(callsData || [], 'call_type'),
        avg_duration: average(callsData?.filter(c => c.duration_seconds).map(c => c.duration_seconds) || []),
        avg_quality: average(callsData?.filter(c => c.quality_score).map(c => c.quality_score) || []),
        mood_distribution: groupBy(callsData?.filter(c => c.mood_detected) || [], 'mood_detected')
      },
      alerts: {
        total: alertsData?.length || 0,
        by_type: groupBy(alertsData || [], 'alert_type'),
        by_severity: groupBy(alertsData || [], 'severity'),
        by_status: groupBy(alertsData || [], 'status'),
        avg_confidence: average(alertsData?.filter(a => a.confidence_score).map(a => a.confidence_score) || [])
      },
      wellbeing: {
        total_metrics: metricsData?.length || 0,
        avg_scores: {
          social: average(metricsData?.filter(m => m.social_score).map(m => m.social_score) || []),
          mood: average(metricsData?.filter(m => m.mood_score).map(m => m.mood_score) || []),
          health: average(metricsData?.filter(m => m.health_score).map(m => m.health_score) || []),
          cognitive: average(metricsData?.filter(m => m.cognitive_score).map(m => m.cognitive_score) || []),
          engagement: average(metricsData?.filter(m => m.engagement_score).map(m => m.engagement_score) || []),
          overall: average(metricsData?.filter(m => m.overall_score).map(m => m.overall_score) || [])
        }
      }
    };
    
    // 2. Métriques d'engagement (KPI clé pour assureurs)
    console.log('🎯 Calculating engagement metrics...');
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentCalls = callsData?.filter(c => 
      new Date(c.created_at) >= last30Days && c.status === 'completed'
    ) || [];
    
    const engagementRate = seniorsData?.length > 0 ? 
      (recentCalls.length / (seniorsData.length * 4)) * 100 : 0; // Approximation sur 4 semaines
    
    analytics.details = {
      engagement: {
        last_30_days: {
          total_seniors: seniorsData?.length || 0,
          completed_calls: recentCalls.length,
          engagement_rate: Math.round(engagementRate * 100) / 100,
          avg_call_quality: average(recentCalls.map(c => c.quality_score).filter(Boolean))
        }
      },
      trends: {
        calls_by_week: getWeeklyTrends(callsData || []),
        alerts_by_week: getWeeklyTrends(alertsData || [])
      },
      top_insights: generateInsights(analytics.overview)
    };
    
    // 3. Sauvegarder le rapport
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `mycompanion-analytics-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'exports', filename);
    
    // Créer le dossier exports s'il n'existe pas
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(analytics, null, 2));
    
    console.log('\n✅ Analytics exported successfully!');
    console.log(`📁 File: ${filepath}`);
    console.log('\n📊 Quick Summary:');
    console.log(`👥 Total Users: ${analytics.overview.users.total}`);
    console.log(`👴 Total Seniors: ${analytics.overview.seniors.total}`);
    console.log(`📞 Total Calls: ${analytics.overview.calls.total}`);
    console.log(`🚨 Total Alerts: ${analytics.overview.alerts.total}`);
    console.log(`🎯 Engagement Rate (30d): ${analytics.details.engagement.last_30_days.engagement_rate}%`);
    
    if (analytics.overview.wellbeing.avg_scores.overall > 0) {
      console.log(`😊 Avg Well-being Score: ${Math.round(analytics.overview.wellbeing.avg_scores.overall * 100)}%`);
    }
    
    return filepath;
    
  } catch (error) {
    console.error('❌ Error exporting analytics:', error);
    throw error;
  }
}

// Fonctions utilitaires
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key] || 'unknown';
    groups[group] = (groups[group] || 0) + 1;
    return groups;
  }, {});
}

function average(numbers) {
  if (numbers.length === 0) return 0;
  return Math.round((numbers.reduce((sum, num) => sum + num, 0) / numbers.length) * 100) / 100;
}

function getWeeklyTrends(data) {
  const weeks = {};
  const now = new Date();
  
  data.forEach(item => {
    const date = new Date(item.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    weeks[weekKey] = (weeks[weekKey] || 0) + 1;
  });
  
  return weeks;
}

function generateInsights(overview) {
  const insights = [];
  
  // Insight sur l'engagement
  if (overview.calls.avg_quality >= 0.8) {
    insights.push('🌟 Excellente qualité d\'appels (>80%)');
  }
  
  // Insight sur les alertes
  const totalAlerts = overview.alerts.total;
  const criticalAlerts = overview.alerts.by_severity?.critical || 0;
  if (criticalAlerts / totalAlerts > 0.1) {
    insights.push('⚠️ Taux d\'alertes critiques élevé (>10%)');
  }
  
  // Insight sur la croissance
  if (overview.seniors.total > 0) {
    insights.push(`📈 ${overview.seniors.total} seniors actifs sur la plateforme`);
  }
  
  return insights;
}

// Exécuter l'export
if (require.main === module) {
  exportAnalytics().catch(error => {
    console.error('❌ Export failed:', error);
    process.exit(1);
  });
}

module.exports = { exportAnalytics };