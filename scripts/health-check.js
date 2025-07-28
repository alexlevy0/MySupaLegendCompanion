// Script de vérification de santé pour MyCompanion

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

class HealthChecker {
  constructor() {
    this.results = {
      database: { status: 'unknown', checks: [] },
      tables: { status: 'unknown', checks: [] },
      realtime: { status: 'unknown', checks: [] },
      business_logic: { status: 'unknown', checks: [] }
    };
  }

  async runAllChecks() {
    console.log('🔍 MyCompanion Health Check Starting...\n');
    
    await this.checkDatabaseConnection();
    await this.checkTableStructure();
    await this.checkRealtimeConfiguration();
    await this.checkBusinessLogic();
    
    this.printResults();
    return this.getOverallHealth();
  }

  async checkDatabaseConnection() {
    console.log('🔌 Checking database connection...');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      this.results.database.status = 'healthy';
      this.results.database.checks.push({
        name: 'Database Connection',
        status: '✅ OK',
        details: 'Successfully connected to Supabase'
      });
    } catch (error) {
      this.results.database.status = 'unhealthy';
      this.results.database.checks.push({
        name: 'Database Connection',
        status: '❌ FAILED',
        details: error.message
      });
    }
  }

  async checkTableStructure() {
    console.log('📋 Checking table structure...');
    
    const expectedTables = [
      'users', 'seniors', 'family_members', 'saad_organizations', 
      'saad_assignments', 'calls', 'conversation_transcripts', 
      'alerts', 'well_being_metrics', 'family_reports', 
      'ai_models', 'system_settings', 'analytics_events', 'todos'
    ];
    
    let healthyTables = 0;
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) throw error;
        
        healthyTables++;
        this.results.tables.checks.push({
          name: `Table: ${table}`,
          status: '✅ OK',
          details: 'Table accessible'
        });
      } catch (error) {
        this.results.tables.checks.push({
          name: `Table: ${table}`,
          status: '❌ FAILED',
          details: error.message
        });
      }
    }
    
    this.results.tables.status = healthyTables === expectedTables.length ? 'healthy' : 'unhealthy';
  }

  async checkRealtimeConfiguration() {
    console.log('⚡ Checking realtime configuration...');
    
    try {
      // Simuler un test de realtime en créant et supprimant un enregistrement test
      const testUser = {
        email: `healthcheck-${Date.now()}@test.com`,
        user_type: 'admin',
        first_name: 'Health',
        last_name: 'Check'
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(testUser)
        .select()
        .single();
      
      if (error) throw error;
      
      // Supprimer l'enregistrement test
      await supabase
        .from('users')
        .delete()
        .eq('id', data.id);
      
      this.results.realtime.status = 'healthy';
      this.results.realtime.checks.push({
        name: 'Realtime Test',
        status: '✅ OK',
        details: 'Insert/Delete operations working'
      });
      
    } catch (error) {
      this.results.realtime.status = 'unhealthy';
      this.results.realtime.checks.push({
        name: 'Realtime Test',
        status: '❌ FAILED',
        details: error.message
      });
    }
  }

  async checkBusinessLogic() {
    console.log('🏗️ Checking business logic...');
    
    // Check 1: Contraintes user_type
    try {
      const { data: users } = await supabase
        .from('users')
        .select('user_type')
        .limit(10);
      
      const validUserTypes = ['admin', 'senior', 'family', 'saad_admin', 'saad_worker', 'insurer'];
      const invalidTypes = users?.filter(u => !validUserTypes.includes(u.user_type)) || [];
      
      if (invalidTypes.length === 0) {
        this.results.business_logic.checks.push({
          name: 'User Types Validation',
          status: '✅ OK',
          details: 'All user types are valid'
        });
      } else {
        this.results.business_logic.checks.push({
          name: 'User Types Validation',
          status: '⚠️ WARNING',
          details: `Found ${invalidTypes.length} users with invalid types`
        });
      }
    } catch (error) {
      this.results.business_logic.checks.push({
        name: 'User Types Validation',
        status: '❌ FAILED',
        details: error.message
      });
    }

    // Check 2: Relations intégrité
    try {
      const { data: orphanedSeniors } = await supabase
        .from('seniors')
        .select('id, user_id')
        .not('user_id', 'in', `(SELECT id FROM users WHERE deleted = false)`);
      
      if (!orphanedSeniors || orphanedSeniors.length === 0) {
        this.results.business_logic.checks.push({
          name: 'Data Integrity',
          status: '✅ OK',
          details: 'No orphaned records found'
        });
      } else {
        this.results.business_logic.checks.push({
          name: 'Data Integrity',
          status: '⚠️ WARNING',
          details: `Found ${orphanedSeniors.length} orphaned senior records`
        });
      }
    } catch (error) {
      this.results.business_logic.checks.push({
        name: 'Data Integrity',
        status: '❌ FAILED',
        details: error.message
      });
    }

    // Check 3: Statistiques de base
    try {
      const stats = await this.getBasicStats();
      
      this.results.business_logic.checks.push({
        name: 'Basic Statistics',
        status: '📊 INFO',
        details: `Users: ${stats.users}, Seniors: ${stats.seniors}, Calls: ${stats.calls}, Alerts: ${stats.alerts}`
      });
    } catch (error) {
      this.results.business_logic.checks.push({
        name: 'Basic Statistics',
        status: '❌ FAILED',
        details: error.message
      });
    }

    // Déterminer le status global de business_logic
    const failedChecks = this.results.business_logic.checks.filter(c => c.status.includes('FAILED'));
    this.results.business_logic.status = failedChecks.length === 0 ? 'healthy' : 'unhealthy';
  }

  async getBasicStats() {
    const [usersCount, seniorsCount, callsCount, alertsCount] = await Promise.all([
      supabase.from('users').select('count').single(),
      supabase.from('seniors').select('count').single(),
      supabase.from('calls').select('count').single(),
      supabase.from('alerts').select('count').single()
    ]);

    return {
      users: usersCount.data?.count || 0,
      seniors: seniorsCount.data?.count || 0,
      calls: callsCount.data?.count || 0,
      alerts: alertsCount.data?.count || 0
    };
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MYCOMPANION HEALTH CHECK RESULTS');
    console.log('='.repeat(60));
    
    Object.entries(this.results).forEach(([category, result]) => {
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'unhealthy' ? '❌' : '⚠️';
      
      console.log(`\n${statusIcon} ${category.toUpperCase()}: ${result.status.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      result.checks.forEach(check => {
        console.log(`  ${check.status} ${check.name}`);
        if (check.details) {
          console.log(`    └─ ${check.details}`);
        }
      });
    });
  }

  getOverallHealth() {
    const categoryStatuses = Object.values(this.results).map(r => r.status);
    
    if (categoryStatuses.every(s => s === 'healthy')) {
      console.log('\n🎉 Overall Health: EXCELLENT');
      return 'excellent';
    } else if (categoryStatuses.some(s => s === 'unhealthy')) {
      console.log('\n⚠️  Overall Health: NEEDS ATTENTION');
      return 'warning';
    } else {
      console.log('\n❌ Overall Health: CRITICAL');
      return 'critical';
    }
  }
}

async function runHealthCheck() {
  const checker = new HealthChecker();
  const health = await checker.runAllChecks();
  
  console.log('\n' + '='.repeat(60));
  console.log('🏥 Health check completed!');
  console.log('💡 Run this regularly to monitor MyCompanion health');
  console.log('='.repeat(60));
  
  // Exit avec le code approprié
  process.exit(health === 'critical' ? 1 : 0);
}

if (require.main === module) {
  runHealthCheck().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

module.exports = { HealthChecker, runHealthCheck };