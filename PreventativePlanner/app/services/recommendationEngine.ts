import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function generateAIRecommendations(profile: UserProfile): Promise<AIRecommendation[]> {
  const cacheKey = `ai_recs_${JSON.stringify(profile)}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const riskText = profile.riskFactors.length > 0 ? profile.riskFactors.join(', ') : 'none';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a preventative healthcare advisor. Return a JSON object with a single key "recommendations" containing an array. Each item must have: id (unique snake_case string), title (short appointment name), category (one of: Screening, Checkup, Vaccination, Consultation), explanation (1-2 sentences personalized to this specific patient).',
        },
        {
          role: 'user',
          content: `Patient: ${profile.age} year old ${profile.sex}. Risk factors: ${riskText}. Generate 4-6 preventative care recommendations.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  const recs: AIRecommendation[] = parsed.recommendations;

  await AsyncStorage.setItem(cacheKey, JSON.stringify(recs));
  return recs;
}
