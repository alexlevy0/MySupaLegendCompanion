import { supabase } from "../client";

// Fonction pour lister tous les codes existants
export async function debugListAllCodes() {
  console.log("🔍 Debug: Listing all family codes...");
  
  const { data, error } = await supabase
    .from("family_invite_codes")
    .select("*")
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("❌ Error listing codes:", error);
    return [];
  }
  
  console.log("📋 All codes:", data);
  return data;
}

// Fonction pour vérifier un code spécifique
export async function debugCheckCode(code: string) {
  console.log("🔍 Debug: Checking code", code);
  
  const cleanCode = code.trim().toUpperCase();
  console.log("🧹 Cleaned code:", cleanCode);
  
  // 1. Vérifier si le code existe
  const { data: codeData, error: codeError } = await supabase
    .from("family_invite_codes")
    .select("*")
    .eq("code", cleanCode);
    
  console.log("📊 Code query result:", { codeData, codeError });
  
  if (!codeData || codeData.length === 0) {
    console.log("❌ Code not found in database");
    return null;
  }
  
  // 2. Vérifier le senior associé
  const code = codeData[0];
  const { data: seniorData, error: seniorError } = await supabase
    .from("seniors")
    .select("*")
    .eq("id", code.senior_id);
    
  console.log("👴 Senior query result:", { seniorData, seniorError });
  
  return {
    code,
    senior: seniorData?.[0] || null,
  };
}

// Fonction pour créer un code de test
export async function debugCreateTestCode(seniorId: string, userId: string) {
  console.log("🔨 Creating test code...");
  
  const testCode = `MC-TEST${Math.floor(Math.random() * 1000)}`;
  
  const { data, error } = await supabase
    .from("family_invite_codes")
    .insert({
      senior_id: seniorId,
      created_by: userId,
      code: testCode,
      is_active: true,
      max_uses: 10,
      current_uses: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();
    
  if (error) {
    console.error("❌ Error creating test code:", error);
    return null;
  }
  
  console.log("✅ Test code created:", testCode);
  return data;
}