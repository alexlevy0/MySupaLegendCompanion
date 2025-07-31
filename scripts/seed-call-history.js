const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedCallHistory() {
  console.log('🌱 Début du seeding de l\'historique des appels...');
  
  try {
    // Récupérer les seniors existants
    const { data: seniors, error: seniorsError } = await supabase
      .from('seniors')
      .select('id, first_name, last_name')
      .limit(5);
    
    if (seniorsError) {
      console.error('❌ Erreur lors de la récupération des seniors:', seniorsError);
      return;
    }
    
    if (!seniors || seniors.length === 0) {
      console.log('⚠️ Aucun senior trouvé. Créez d\'abord des seniors.');
      return;
    }
    
    console.log(`✅ ${seniors.length} seniors trouvés`);
    
    // Générer des appels pour chaque senior
    const calls = [];
    const now = new Date();
    
    for (const senior of seniors) {
      // Générer 5-10 appels par senior
      const numCalls = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < numCalls; i++) {
        // Date aléatoire dans les 30 derniers jours
        const daysAgo = Math.floor(Math.random() * 30);
        const callDate = new Date(now);
        callDate.setDate(callDate.getDate() - daysAgo);
        callDate.setHours(Math.floor(Math.random() * 12) + 9); // Entre 9h et 21h
        callDate.setMinutes(Math.floor(Math.random() * 60));
        
        // Durée aléatoire entre 2 et 20 minutes
        const duration = Math.floor(Math.random() * 18 * 60) + 120;
        const endDate = new Date(callDate);
        endDate.setSeconds(endDate.getSeconds() + duration);
        
        // Statut aléatoire
        const statuses = ['completed', 'completed', 'completed', 'no_answer', 'scheduled', 'failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Humeur aléatoire
        const moods = ['joyeux', 'content', 'neutre', 'fatigué', 'anxieux', null];
        const mood = moods[Math.floor(Math.random() * moods.length)];
        
        // Score de qualité aléatoire (entre 60 et 100)
        const qualityScore = status === 'completed' ? Math.floor(Math.random() * 40) + 60 : null;
        
        // Type d'appel avec probabilités réalistes
        const callTypeRandom = Math.random();
        let callType;
        if (callTypeRandom < 0.7) {
          callType = 'scheduled'; // 70% d'appels programmés
        } else if (callTypeRandom < 0.9) {
          callType = 'followup'; // 20% d'appels de suivi
        } else {
          callType = 'emergency'; // 10% d'appels d'urgence
        }
        
        // Résumé de conversation adapté au type d'appel
        let summaries;
        if (callType === 'emergency') {
          summaries = [
            `${senior.first_name} a appelé car il/elle ne se sentait pas bien. Situation résolue, rassurance apportée.`,
            `Appel d'urgence suite à une chute. ${senior.first_name} va bien, famille prévenue.`,
            `${senior.first_name} était anxieux(se) et avait besoin de parler. Situation calmée après discussion.`,
            `Problème technique avec l'équipement médical. Support technique contacté et problème résolu.`,
          ];
        } else if (callType === 'followup') {
          summaries = [
            `Suivi après la visite médicale de la semaine dernière. ${senior.first_name} suit bien les recommandations.`,
            `Appel de suivi concernant les nouveaux médicaments. Pas d'effets secondaires signalés.`,
            `Vérification du moral après l'hospitalisation. ${senior.first_name} récupère bien.`,
            `Suivi de l'état général. Amélioration notable depuis le dernier appel.`,
          ];
        } else {
          summaries = [
            `${senior.first_name} était de bonne humeur aujourd'hui. Nous avons parlé de sa famille et de ses activités.`,
            `Discussion sur les souvenirs d'enfance de ${senior.first_name}. Très nostalgique mais heureux.`,
            `${senior.first_name} a mentionné quelques douleurs mais reste optimiste. A parlé de son jardin.`,
            `Conversation animée sur les actualités. ${senior.first_name} suit toujours l'actualité avec intérêt.`,
            `${senior.first_name} était un peu fatigué(e) mais content(e) de discuter. A évoqué ses projets pour la semaine.`,
          ];
        }
        
        // Ajouter null occasionnellement pour plus de réalisme
        if (Math.random() < 0.2) {
          summaries.push(null);
        }
        
        const summary = status === 'completed' ? summaries[Math.floor(Math.random() * summaries.length)] : null;
        
        const call = {
          senior_id: senior.id,
          call_type: callType,
          status: status,
          started_at: status !== 'scheduled' || i < numCalls - 2 ? callDate.toISOString() : null,
          ended_at: status === 'completed' ? endDate.toISOString() : null,
          duration_seconds: status === 'completed' ? duration : null,
          quality_score: qualityScore,
          conversation_summary: summary,
          mood_detected: status === 'completed' ? mood : null
        };
        
        // Pour les appels programmés, mettre une date future
        if (status === 'scheduled' && (!call.started_at || i >= numCalls - 2)) {
          const futureDays = Math.floor(Math.random() * 7) + 1;
          const futureDate = new Date(now);
          futureDate.setDate(futureDate.getDate() + futureDays);
          futureDate.setHours(Math.floor(Math.random() * 12) + 9);
          call.started_at = futureDate.toISOString();
        }
        
        calls.push(call);
      }
    }
    
    // Insérer tous les appels
    const { data: insertedCalls, error: insertError } = await supabase
      .from('calls')
      .insert(calls)
      .select();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion des appels:', insertError);
      return;
    }
    
    console.log(`✅ ${insertedCalls.length} appels créés avec succès!`);
    
    // Afficher quelques statistiques
    const completedCalls = calls.filter(c => c.status === 'completed').length;
    const noAnswerCalls = calls.filter(c => c.status === 'no_answer').length;
    const failedCalls = calls.filter(c => c.status === 'failed').length;
    const scheduledCalls = calls.filter(c => c.status === 'scheduled').length;
    
    console.log('\n📊 Statistiques:');
    console.log(`   - Appels terminés: ${completedCalls}`);
    console.log(`   - Sans réponse: ${noAnswerCalls}`);
    console.log(`   - Échecs: ${failedCalls}`);
    console.log(`   - Appels programmés: ${scheduledCalls}`);
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
seedCallHistory().then(() => {
  console.log('\n✅ Seeding terminé!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});