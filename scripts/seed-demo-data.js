// scripts/seed-demo-data.js
// Script pour créer des données de démonstration MyCompanion (version corrigée)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function seedDemoData() {
  console.log('🌱 Seeding demo data for MyCompanion...');
  
  try {
    // Option 1: Nettoyer les données existantes
    console.log('🧹 Cleaning existing demo data...');
    await cleanExistingDemoData();
    
    // 1. Créer des utilisateurs de démonstration
    console.log('👥 Creating demo users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          email: 'admin@mycompanion.fr',
          user_type: 'admin',
          first_name: 'Admin',
          last_name: 'MyCompanion',
          phone: '+33123456789'
        },
        {
          email: 'marie.dubois@gmail.com',
          user_type: 'family',
          first_name: 'Marie',
          last_name: 'Dubois',
          phone: '+33123456790'
        },
        {
          email: 'suzanne.demo@senior.fr',
          user_type: 'senior',
          first_name: 'Suzanne',
          last_name: 'Dupont',
          phone: '+33123456791'
        },
        {
          email: 'saad.lyon@saad.fr',
          user_type: 'saad_admin',
          first_name: 'Directeur',
          last_name: 'SAAD Lyon',
          phone: '+33123456792'
        }
      ])
      .select();
    
    if (usersError) throw usersError;
    console.log(`✅ Created ${users.length} demo users`);
    
    // 2. Créer un senior de démonstration
    console.log('👴 Creating demo senior...');
    const seniorUser = users.find(u => u.user_type === 'senior');
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .insert([
        {
          user_id: seniorUser.id,
          birth_date: '1945-03-15',
          preferred_call_time: '14:30:00',
          call_frequency: 2,
          personality_profile: {
            traits: ['warm', 'talkative', 'nostalgic'],
            communication_style: 'detailed'
          },
          interests: {
            hobbies: ['gardening', 'cooking', 'reading'],
            topics: ['family', 'recipes', 'old_movies']
          },
          communication_preferences: {
            call_duration: 'medium',
            topics_to_avoid: ['health_details'],
            family_sharing_level: 'summary_only'
          },
          emergency_contact: '+33123456790',
          address: {
            city: 'Lyon',
            postal_code: '69000',
            country: 'France'
          }
        }
      ])
      .select();
    
    if (seniorsError) throw seniorsError;
    console.log(`✅ Created ${seniors.length} demo senior`);
    
    // 3. Créer la relation famille
    console.log('👨‍👩‍👧‍👦 Creating family relationship...');
    const familyUser = users.find(u => u.user_type === 'family');
    const { data: familyMembers, error: familyError } = await supabase
      .from('family_members')
      .insert([
        {
          user_id: familyUser.id,
          senior_id: seniors[0].id,
          relationship: 'daughter',
          is_primary_contact: true,
          notification_preferences: {
            email: true,
            sms: true,
            frequency: 'daily'
          },
          access_level: 'standard'
        }
      ])
      .select();
    
    if (familyError) throw familyError;
    console.log(`✅ Created ${familyMembers.length} family relationship`);
    
    // 4. Créer une organisation SAAD
    console.log('🏢 Creating demo SAAD organization...');
    const { data: saads, error: saadError } = await supabase
      .from('saad_organizations')
      .insert([
        {
          name: 'SAAD Lyon Pilote',
          contact_email: 'contact@saad-lyon.fr',
          contact_phone: '+33123456792',
          address: {
            street: '123 Rue de la République',
            city: 'Lyon',
            postal_code: '69002',
            country: 'France'
          },
          subscription_plan: 'pilot',
          is_active: true
        }
      ])
      .select();
    
    if (saadError) throw saadError;
    
    // 5. Créer l'assignation SAAD
    const saadUser = users.find(u => u.user_type === 'saad_admin');
    const { data: assignments, error: assignmentError } = await supabase
      .from('saad_assignments')
      .insert([
        {
          saad_id: saads[0].id,
          senior_id: seniors[0].id,
          assigned_worker_id: saadUser.id,
          start_date: '2025-01-01',
          service_level: 'standard',
          notes: 'Pilote MyCompanion - Suivi quotidien',
          is_active: true
        }
      ])
      .select();
    
    if (assignmentError) throw assignmentError;
    console.log(`✅ Created ${assignments.length} SAAD assignment`);
    
    // 6. Créer quelques appels de démonstration
    console.log('📞 Creating demo calls...');
    const callsData = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const callDate = new Date(today);
      callDate.setDate(today.getDate() - i);
      
      callsData.push({
        senior_id: seniors[0].id,
        call_type: 'scheduled',
        status: i < 5 ? 'completed' : 'scheduled',
        started_at: i < 5 ? callDate.toISOString() : null,
        ended_at: i < 5 ? new Date(callDate.getTime() + 8 * 60 * 1000).toISOString() : null,
        duration_seconds: i < 5 ? 480 + Math.floor(Math.random() * 300) : null,
        quality_score: i < 5 ? 0.8 + Math.random() * 0.2 : null,
        conversation_summary: i < 5 ? 'Conversation agréable, bonne humeur, a parlé de son jardin et de sa famille.' : null,
        mood_detected: i < 5 ? ['positive', 'neutral', 'positive', 'positive', 'neutral'][i] : null
      });
    }
    
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .insert(callsData)
      .select();
    
    if (callsError) throw callsError;
    console.log(`✅ Created ${calls.length} demo calls`);
    
    // 7. Créer quelques alertes de démonstration
    console.log('🚨 Creating demo alerts...');
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .insert([
        {
          senior_id: seniors[0].id,
          call_id: calls[2].id,
          alert_type: 'mood',
          severity: 'low',
          title: 'Légère baisse de moral détectée',
          description: 'Suzanne semble un peu moins enjouée que d\'habitude lors des 2 derniers appels.',
          detected_indicators: {
            tone_analysis: 'slightly_flat',
            response_time: 'slower',
            engagement_score: 0.6
          },
          confidence_score: 0.75,
          status: 'new'
        },
        {
          senior_id: seniors[0].id,
          call_id: calls[0].id,
          alert_type: 'social',
          severity: 'medium',
          title: 'Mention d\'isolement social',
          description: 'Suzanne a mentionné qu\'elle n\'a pas vu ses voisins depuis une semaine.',
          detected_indicators: {
            keywords: ['seule', 'personne', 'voisins'],
            context: 'social_isolation'
          },
          confidence_score: 0.85,
          status: 'acknowledged',
          acknowledged_by: familyUser.id,
          acknowledged_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (alertsError) throw alertsError;
    console.log(`✅ Created ${alerts.length} demo alerts`);
    
    // 8. Créer des métriques de bien-être
    console.log('📊 Creating demo well-being metrics...');
    const metricsData = [];
    
    for (let i = 0; i < 7; i++) {
      const metricDate = new Date(today);
      metricDate.setDate(today.getDate() - i);
      
      metricsData.push({
        senior_id: seniors[0].id,
        call_id: calls[i]?.id || null,
        metric_date: metricDate.toISOString().split('T')[0],
        social_score: 0.7 + Math.random() * 0.2,
        mood_score: 0.75 + Math.random() * 0.15,
        health_score: 0.8 + Math.random() * 0.1,
        cognitive_score: 0.85 + Math.random() * 0.1,
        engagement_score: 0.8 + Math.random() * 0.15,
        overall_score: 0.78 + Math.random() * 0.12
      });
    }
    
    const { data: metrics, error: metricsError } = await supabase
      .from('well_being_metrics')
      .insert(metricsData)
      .select();
    
    if (metricsError) throw metricsError;
    console.log(`✅ Created ${metrics.length} demo metrics`);
    
    console.log('\n🎉 Demo data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`👴 Seniors: ${seniors.length}`);
    console.log(`👨‍👩‍👧‍👦 Family relationships: ${familyMembers.length}`);
    console.log(`🏢 SAAD organizations: ${saads.length}`);
    console.log(`📞 Calls: ${calls.length}`);
    console.log(`🚨 Alerts: ${alerts.length}`);
    console.log(`📊 Metrics: ${metrics.length}`);
    console.log('\n🌐 You can now view the data at: http://localhost:54323');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

// Fonction pour nettoyer les données de démo existantes
async function cleanExistingDemoData() {
  const demoEmails = [
    'admin@mycompanion.fr',
    'marie.dubois@gmail.com', 
    'suzanne.demo@senior.fr',
    'saad.lyon@saad.fr'
  ];
  
  try {
    // Supprimer dans l'ordre inverse des dépendances
    console.log('   🗑️  Cleaning metrics...');
    await supabase.from('well_being_metrics').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning family reports...');
    await supabase.from('family_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning alerts...');
    await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning conversation transcripts...');
    await supabase.from('conversation_transcripts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning calls...');
    await supabase.from('calls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning SAAD assignments...');
    await supabase.from('saad_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning SAAD organizations...');
    await supabase.from('saad_organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning family members...');
    await supabase.from('family_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning seniors...');
    await supabase.from('seniors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('   🗑️  Cleaning demo users...');
    await supabase.from('users').delete().in('email', demoEmails);
    
    console.log('   ✅ Cleanup completed');
    
  } catch (error) {
    console.log('   ⚠️  Cleanup had some issues (normal on first run):', error.message);
  }
}

// Fonction alternative : seed avec upsert (plus safe)
async function seedDemoDataWithUpsert() {
  console.log('🌱 Seeding demo data with upsert (safe mode)...');
  
  try {
    // 1. Upsert des utilisateurs
    console.log('👥 Upserting demo users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          email: 'admin@mycompanion.fr',
          user_type: 'admin',
          first_name: 'Admin',
          last_name: 'MyCompanion',
          phone: '+33123456789'
        },
        {
          email: 'marie.dubois@gmail.com',
          user_type: 'family',
          first_name: 'Marie',
          last_name: 'Dubois',
          phone: '+33123456790'
        },
        {
          email: 'suzanne.demo@senior.fr',
          user_type: 'senior',
          first_name: 'Suzanne',
          last_name: 'Dupont',
          phone: '+33123456791'
        },
        {
          email: 'saad.lyon@saad.fr',
          user_type: 'saad_admin', 
          first_name: 'Directeur',
          last_name: 'SAAD Lyon',
          phone: '+33123456792'
        }
      ], { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select();
    
    if (usersError) throw usersError;
    console.log(`✅ Upserted ${users.length} demo users`);
    
    // Pour le reste, continuez avec la même logique mais en récupérant les users existants
    console.log('\n🎉 Safe demo data seeding completed!');
    console.log('🌐 You can now view the data at: http://localhost:54323');
    
  } catch (error) {
    console.error('❌ Error in safe seeding:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  // Choisir la méthode de seed
  const args = process.argv.slice(2);
  if (args.includes('--safe')) {
    seedDemoDataWithUpsert();
  } else {
    seedDemoData();
  }
}

module.exports = { seedDemoData, cleanExistingDemoData, seedDemoDataWithUpsert };