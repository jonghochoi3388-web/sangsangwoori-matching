import { createClient } from '@supabase/supabase-js';

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  return createClient(url, key);
}

/** matches → seniors → jobs 순서로 전체 삭제 (FK 제약 순서 준수) */
export async function resetDb() {
  const sb = client();
  // Supabase JS v2는 필터 없는 DELETE를 차단 → IS NOT NULL 조건으로 전체 행 삭제
  await sb.from('matches').delete().not('id', 'is', null);
  await sb.from('seniors').delete().not('id', 'is', null);
  await sb.from('jobs').delete().not('id', 'is', null);
}

export async function insertJob(params: {
  title: string;
  region: string;
  job_type: string;
  required_career: number;
}): Promise<string> {
  const { data, error } = await client().from('jobs').insert(params).select('id').single();
  if (error) throw new Error(`insertJob 실패: ${error.message}`);
  return data!.id as string;
}

export async function countSeniors(): Promise<number> {
  const { count, error } = await client()
    .from('seniors')
    .select('id', { count: 'exact', head: true });
  if (error) throw new Error(`countSeniors 실패: ${error.message}`);
  return count ?? 0;
}
