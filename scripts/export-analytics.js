// scripts/export-analytics.js
// Script pour exporter les analytics MyCompanion avec rapport HTML

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
    
    // 3. Créer le dossier exports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // 4. Sauvegarder le JSON
    const jsonFilename = `mycompanion-analytics-${timestamp}.json`;
    const jsonFilepath = path.join(exportsDir, jsonFilename);
    fs.writeFileSync(jsonFilepath, JSON.stringify(analytics, null, 2));
    
    // 5. Générer le rapport HTML
    console.log('🎨 Generating HTML report...');
    const htmlFilename = `mycompanion-report-${timestamp}.html`;
    const htmlFilepath = path.join(exportsDir, htmlFilename);
    const htmlContent = generateHTMLReport(analytics, jsonFilename);
    fs.writeFileSync(htmlFilepath, htmlContent);
    
    console.log('\n✅ Analytics exported successfully!');
    console.log(`📁 JSON File: ${jsonFilepath}`);
    console.log(`🌐 HTML Report: ${htmlFilepath}`);
    console.log(`📊 Open in browser: file://${htmlFilepath}`);
    
    console.log('\n📊 Quick Summary:');
    console.log(`👥 Total Users: ${analytics.overview.users.total}`);
    console.log(`👴 Total Seniors: ${analytics.overview.seniors.total}`);
    console.log(`📞 Total Calls: ${analytics.overview.calls.total}`);
    console.log(`🚨 Total Alerts: ${analytics.overview.alerts.total}`);
    console.log(`🎯 Engagement Rate (30d): ${analytics.details.engagement.last_30_days.engagement_rate}%`);
    
    if (analytics.overview.wellbeing.avg_scores.overall > 0) {
      console.log(`😊 Avg Well-being Score: ${Math.round(analytics.overview.wellbeing.avg_scores.overall * 100)}%`);
    }
    
    return { jsonFilepath, htmlFilepath };
    
  } catch (error) {
    console.error('❌ Error exporting analytics:', error);
    throw error;
  }
}

// Fonction pour générer le rapport HTML
function generateHTMLReport(analytics, jsonFilename) {
  const reportDate = new Date(analytics.timestamp).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyCompanion Analytics Report - ${reportDate}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .header h1 {
            color: #4f46e5;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }
        
        .header .subtitle {
            color: #64748b;
            font-size: 1.1rem;
            margin-bottom: 1rem;
        }
        
        .header .date {
            background: #f1f5f9;
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            color: #475569;
            font-weight: 500;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 0.5px;
        }
        
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .chart-card {
            background: white;
            padding: 1.5rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .chart-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .insights-section {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        
        .insights-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .insight-item {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 0.5rem;
            border-left: 4px solid #4f46e5;
        }
        
        .engagement-highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .engagement-rate {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .wellbeing-scores {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .wellbeing-score {
            text-align: center;
            padding: 1rem;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        
        .score-value {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .score-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .footer {
            text-align: center;
            color: white;
            margin-top: 2rem;
            padding: 1rem;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2rem; }
            .charts-section { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 MyCompanion Analytics</h1>
            <div class="subtitle">Rapport de performance et d'engagement</div>
            <div class="date">📅 Généré le ${reportDate}</div>
        </div>
        
        <!-- KPIs principaux -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number">${analytics.overview.users.total}</div>
                <div class="stat-label">Utilisateurs Total</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👴</div>
                <div class="stat-number">${analytics.overview.seniors.total}</div>
                <div class="stat-label">Seniors Actifs</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📞</div>
                <div class="stat-number">${analytics.overview.calls.total}</div>
                <div class="stat-label">Appels Réalisés</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🚨</div>
                <div class="stat-number">${analytics.overview.alerts.total}</div>
                <div class="stat-label">Alertes Générées</div>
            </div>
        </div>
        
        <!-- Taux d'engagement highlight -->
        <div class="engagement-highlight">
            <h2>🎯 Taux d'Engagement (30 derniers jours)</h2>
            <div class="engagement-rate">${analytics.details.engagement.last_30_days.engagement_rate}%</div>
            <p>Objectif assureur : >70% ✨</p>
            
            <div class="wellbeing-scores">
                <div class="wellbeing-score">
                    <div class="score-value">${Math.round(analytics.overview.wellbeing.avg_scores.social * 100)}%</div>
                    <div class="score-label">🤝 Social</div>
                </div>
                <div class="wellbeing-score">
                    <div class="score-value">${Math.round(analytics.overview.wellbeing.avg_scores.mood * 100)}%</div>
                    <div class="score-label">😊 Humeur</div>
                </div>
                <div class="wellbeing-score">
                    <div class="score-value">${Math.round(analytics.overview.wellbeing.avg_scores.health * 100)}%</div>
                    <div class="score-label">🏥 Santé</div>
                </div>
                <div class="wellbeing-score">
                    <div class="score-value">${Math.round(analytics.overview.wellbeing.avg_scores.cognitive * 100)}%</div>
                    <div class="score-label">🧠 Cognitif</div>
                </div>
                <div class="wellbeing-score">
                    <div class="score-value">${Math.round(analytics.overview.wellbeing.avg_scores.overall * 100)}%</div>
                    <div class="score-label">⭐ Global</div>
                </div>
            </div>
        </div>
        
        <!-- Graphiques -->
        <div class="charts-section">
            <div class="chart-card">
                <div class="chart-title">📊 Distribution des Types d'Utilisateurs</div>
                <canvas id="userTypesChart"></canvas>
            </div>
            <div class="chart-card">
                <div class="chart-title">📞 Statut des Appels</div>
                <canvas id="callStatusChart"></canvas>
            </div>
            <div class="chart-card">
                <div class="chart-title">🚨 Alertes par Sévérité</div>
                <canvas id="alertSeverityChart"></canvas>
            </div>
            <div class="chart-card">
                <div class="chart-title">😊 Distribution de l'Humeur</div>
                <canvas id="moodChart"></canvas>
            </div>
        </div>
        
        <!-- Insights -->
        <div class="insights-section">
            <div class="insights-title">💡 Insights Clés</div>
            ${analytics.details.top_insights.map(insight => 
                `<div class="insight-item">${insight}</div>`
            ).join('')}
        </div>
        
        <div class="footer">
            <p>🤖 Généré par MyCompanion Analytics • Data source: ${jsonFilename}</p>
            <p>Pour plus d'informations : contact@mycompanion.fr</p>
        </div>
    </div>

    <script>
        // Données analytics intégrées
        const analyticsData = ${JSON.stringify(analytics, null, 2)};
        
        // Configuration Chart.js
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = '#64748b';
        
        // Graphique Types d'Utilisateurs
        const userTypesCtx = document.getElementById('userTypesChart').getContext('2d');
        new Chart(userTypesCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(analyticsData.overview.users.by_type),
                datasets: [{
                    data: Object.values(analyticsData.overview.users.by_type),
                    backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
        
        // Graphique Statut des Appels
        const callStatusCtx = document.getElementById('callStatusChart').getContext('2d');
        new Chart(callStatusCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(analyticsData.overview.calls.by_status),
                datasets: [{
                    label: 'Nombre d\\'appels',
                    data: Object.values(analyticsData.overview.calls.by_status),
                    backgroundColor: '#4f46e5',
                    borderColor: '#4338ca',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
        
        // Graphique Alertes par Sévérité
        const alertSeverityCtx = document.getElementById('alertSeverityChart').getContext('2d');
        new Chart(alertSeverityCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(analyticsData.overview.alerts.by_severity),
                datasets: [{
                    data: Object.values(analyticsData.overview.alerts.by_severity),
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#7c3aed'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
        
        // Graphique Distribution de l'Humeur
        const moodCtx = document.getElementById('moodChart').getContext('2d');
        new Chart(moodCtx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(analyticsData.overview.calls.mood_distribution),
                datasets: [{
                    data: Object.values(analyticsData.overview.calls.mood_distribution),
                    backgroundColor: ['#10b981', '#64748b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    </script>
</body>
</html>`;
}

// Fonctions utilitaires (identiques à avant)
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
  
  // Insight sur les appels
  if (overview.calls.avg_duration > 0) {
    const avgMinutes = Math.round(overview.calls.avg_duration / 60);
    insights.push(`⏱️ Durée moyenne des appels : ${avgMinutes} minutes`);
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