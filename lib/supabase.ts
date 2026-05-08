import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase 환경 변수가 비어 있습니다. .env.local 파일을 확인하시고, 만약 방금 파일을 생성하셨다면 ⚠️ 반드시 개발 서버(npm run dev)를 종료(Ctrl+C)하고 다시 시작해 주세요 ⚠️"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
