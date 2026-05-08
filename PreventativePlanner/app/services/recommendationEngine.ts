import { supabase } from '@/supabaseClient';

export type UserProfile = {
  age: number;
  sex: string;
  riskFactors: string[];
};

export type AIRecommendation = {
  id: string;
  title: string;
  category: string;
  explanation: string;
};

export async function generateAIRecommendations(
  profile: UserProfile,
  userId: string
): Promise<AIRecommendation[]> {
  const profileHash = JSON.stringify(profile);

  // Check if we already have recommendations for this exact profile
  const { data: existing } = await supabase
    .from('recommendations')
    .select('recommendation_id, title, category, explanation, profile_hash')
    .eq('user_id', userId);

  if (existing && existing.length > 0 && existing[0].profile_hash === profileHash) {
    return existing.map((r) => ({
      id: r.recommendation_id,
      title: r.title,
      category: r.category,
      explanation: r.explanation,
    }));
  }

  // Profile changed or no recommendations yet — call the AI
  const { data, error } = await supabase.functions.invoke('recommend', {
    body: { profile },
  });

  if (error) throw new Error(`Edge function error: ${error.message}`);

  const recs: AIRecommendation[] = data;

  // Replace old recommendations with new ones
  await supabase.from('recommendations').delete().eq('user_id', userId);
  await supabase.from('recommendations').insert(
    recs.map((rec) => ({
      user_id: userId,
      recommendation_id: rec.id,
      title: rec.title,
      category: rec.category,
      explanation: rec.explanation,
      profile_hash: profileHash,
    }))
  );

  return recs;
}
