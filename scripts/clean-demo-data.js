// scripts/clean-demo-data.js
// Script pour nettoyer toutes les données de démonstration

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function cleanAllDemoData() {
  console.log('🧹 Cleaning ALL demo data from MyCompanion...');
  console.log('⚠️  This will remove ALL data except your actual users!');
  
  try {
    const demoEmails = [
      'admin@mycompanion.fr',
      'marie.dubois@gmail.com', 
      'suzanne.demo@senior.fr',
      'saad.lyon@saad.fr'
    ];
    
    // Supprimer dans l'ordre inverse des dépendances
    const cleanupOperations = [
      { table: 'well_being_metrics', description: 'well-being metrics' },
      { table: 'family_reports', description: 'family reports' },
      { table: 'alerts', description: 'alerts' },
      { table: 'conversation_transcripts', description: 'conversation transcripts' },
      { table: 'calls', description: 'calls' },
      { table: 'saad_assignments', description: 'SAAD assignments' },
      { table: 'saad_organizations', description: 'SAAD organizations' },
      { table: 'family_members', description: 'family relationships' },
      { table: 'seniors', description: 'seniors' },
    ];
    
    let totalDeleted = 0;
    
    for (const operation of cleanupOperations) {
      console.log(`   🗑️  Cleaning ${operation.description}...`);
      
      const { count, error } = await supabase
        .from(operation.table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error && !error.message.includes('No rows found')) {
        console.log(`   ⚠️  ${operation.table}: ${error.message}`);
      } else {
        const deleted = count || 0;
        totalDeleted += deleted;
        console.log(`   ✅ ${operation.table}: ${deleted} records cleaned`);
      }
    }
    
    // Nettoyer les utilisateurs de démo en dernier
    console.log('   🗑️  Cleaning demo users...');
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .delete()
      .in('email', demoEmails);
    
    if (userError && !userError.message.includes('No rows found')) {
      console.log(`   ⚠️  users: ${userError.message}`);
    } else {
      const deleted = userCount || 0;
      totalDeleted += deleted;
      console.log(`   ✅ users: ${deleted} demo users cleaned`);
    }
    
    console.log('\n🎉 Demo data cleanup completed!');
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log('🌐 Check your database at: http://localhost:54323');
    
  } catch (error) {
    console.error('❌ Error cleaning demo data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanAllDemoData();
}

module.exports = { cleanAllDemoData };