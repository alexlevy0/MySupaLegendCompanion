const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCallsData() {
  console.log('🔍 Test de récupération des données d\'appels...\n');
  
  try {
    // 1. Vérifier l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Utilisateur actuel:', user ? `${user.email} (${user.id})` : 'Non connecté');
    
    // 2. Récupérer tous les appels (sans RLS si possible)
    console.log('\n📞 Tentative de récupération de TOUS les appels...');
    const { data: allCalls, error: allCallsError } = await supabase
      .from('calls')
      .select('id, senior_id, status, call_type, started_at')
      .limit(10);
    
    if (allCallsError) {
      console.error('❌ Erreur lors de la récupération des appels:', allCallsError.message);
      console.error('   Détails:', allCallsError.details);
      console.error('   Hint:', allCallsError.hint);
    } else {
      console.log(`✅ ${allCalls?.length || 0} appels trouvés au total`);
      if (allCalls && allCalls.length > 0) {
        console.log('📋 Échantillon des appels:');
        allCalls.slice(0, 3).forEach(call => {
          console.log(`   - ID: ${call.id.substring(0, 8)}... | Senior: ${call.senior_id.substring(0, 8)}... | Status: ${call.status} | Type: ${call.call_type}`);
        });
      }
    }
    
    // 3. Récupérer les seniors de l'utilisateur
    console.log('\n👴 Récupération des seniors...');
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('id, first_name, last_name, user_id')
      .limit(5);
    
    if (seniorsError) {
      console.error('❌ Erreur lors de la récupération des seniors:', seniorsError.message);
    } else {
      console.log(`✅ ${seniors?.length || 0} seniors trouvés`);
      
      if (seniors && seniors.length > 0) {
        console.log('📋 Liste des seniors:');
        for (const senior of seniors) {
          console.log(`\n   👤 ${senior.first_name} ${senior.last_name} (ID: ${senior.id.substring(0, 8)}...)`);
          console.log(`      User ID: ${senior.user_id || 'Non défini'}`);
          
          // Tenter de récupérer les appels pour ce senior
          const { data: seniorCalls, error: callsError } = await supabase
            .from('calls')
            .select('id, status, call_type, started_at')
            .eq('senior_id', senior.id)
            .eq('deleted', false)
            .limit(3);
          
          if (callsError) {
            console.log(`      ❌ Erreur pour les appels: ${callsError.message}`);
          } else {
            console.log(`      📞 ${seniorCalls?.length || 0} appels trouvés`);
            if (seniorCalls && seniorCalls.length > 0) {
              seniorCalls.forEach(call => {
                console.log(`         - ${call.call_type} | ${call.status} | ${new Date(call.started_at).toLocaleDateString('fr-FR')}`);
              });
            }
          }
        }
      }
    }
    
    // 4. Test avec un senior_id spécifique si fourni en argument
    const testSeniorId = process.argv[2];
    if (testSeniorId) {
      console.log(`\n🔍 Test avec senior_id spécifique: ${testSeniorId}`);
      const { data: specificCalls, error: specificError } = await supabase
        .from('calls')
        .select('*')
        .eq('senior_id', testSeniorId)
        .eq('deleted', false);
      
      if (specificError) {
        console.error('❌ Erreur:', specificError.message);
      } else {
        console.log(`✅ ${specificCalls?.length || 0} appels trouvés pour ce senior`);
      }
    }
    
    // 5. Vérifier les politiques RLS
    console.log('\n🔒 Information sur RLS:');
    console.log('   Si vous ne voyez aucun appel, cela peut être dû aux politiques RLS.');
    console.log('   Assurez-vous que l\'utilisateur a les permissions nécessaires.');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le test
testCallsData().then(() => {
  console.log('\n✅ Test terminé!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});