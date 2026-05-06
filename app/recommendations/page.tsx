"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MatchWithJob = {
  id: string;
  score: number;
  status: string;
  jobs: {
    id: string;
    title: string;
    region: string;
    job_type: string;
    required_career: number;
  } | null;
};

function ScoreBadge({ score }: { score: number }) {
  if (score === 6)
    return (
      <Badge className="text-lg px-4 py-1 bg-amber-500 hover:bg-amber-500 text-white">
        ⭐ {score}점
      </Badge>
    );
  if (score >= 4)
    return (
      <Badge className="text-lg px-4 py-1 bg-green-600 hover:bg-green-600 text-white">
        {score}점
      </Badge>
    );
  return (
    <Badge className="text-lg px-4 py-1 bg-gray-400 hover:bg-gray-400 text-white">
      {score}점
    </Badge>
  );
}

function RecommendationsList() {
  const searchParams = useSearchParams();
  const seniorId = searchParams.get("senior_id");

  const [matches, setMatches] = useState<MatchWithJob[]>([]);
  const [seniorName, setSeniorName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seniorId) {
      setLoading(false);
      return;
    }
    async function load() {
      const [{ data: senior }, { data: matchData }] = await Promise.all([
        supabase.from("seniors").select("name").eq("id", seniorId!).single(),
        supabase
          .from("matches")
          .select("id, score, status, jobs(id, title, region, job_type, required_career)")
          .eq("senior_id", seniorId!)
          .gt("score", 0)
          .order("score", { ascending: false }),
      ]);
      if (senior) setSeniorName(senior.name);
      setMatches((matchData as unknown as MatchWithJob[]) ?? []);
      setLoading(false);
    }
    load();
  }, [seniorId]);

  if (!seniorId) {
    return (
      <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 px-6 py-5 text-xl font-semibold text-yellow-800">
        ⚠️ URL에 senior_id 파라미터가 필요합니다.<br />
        <span className="text-lg font-normal">예: /recommendations?senior_id=xxxxx</span>
      </div>
    );
  }

  if (loading) {
    return <p className="text-xl text-gray-400 text-center py-12">불러오는 중…</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-8 py-6 text-xl font-semibold text-gray-600">
        현재 매칭되는 일자리가 없습니다.<br />
        <span className="text-lg font-normal text-gray-400">
          일자리가 등록되면 자동으로 매칭됩니다.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {matches.map((m) => {
        const job = m.jobs;
        if (!job) return null;
        return (
          <Card key={m.id} className="border-2 border-green-100 shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="text-2xl text-gray-800 leading-snug">{job.title}</CardTitle>
              <ScoreBadge score={m.score} />
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xl text-gray-600">
                <div>
                  <dt className="inline text-gray-400">📍 지역 </dt>
                  <dd className="inline font-semibold">{job.region}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-400">💼 직종 </dt>
                  <dd className="inline font-semibold">{job.job_type}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-400">📅 요구 경력 </dt>
                  <dd className="inline font-semibold">
                    {job.required_career > 0 ? `${job.required_career}년 이상` : "무관"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-2">추천 일자리</h1>
      <p className="text-xl text-gray-500 mb-8">
        내 프로필과 가장 잘 맞는 일자리를 점수 순으로 보여 드립니다.
      </p>
      <div className="mb-6 flex gap-3 text-lg text-gray-500 items-center">
        <span className="inline-flex items-center gap-1">
          <Badge className="bg-amber-500 text-white">⭐ 6점</Badge> 완벽 매칭
        </span>
        <span className="inline-flex items-center gap-1">
          <Badge className="bg-green-600 text-white">4~5점</Badge> 좋은 매칭
        </span>
        <span className="inline-flex items-center gap-1">
          <Badge className="bg-gray-400 text-white">2~3점</Badge> 부분 매칭
        </span>
      </div>
      <Suspense fallback={<p className="text-xl text-gray-400 text-center py-12">불러오는 중…</p>}>
        <RecommendationsList />
      </Suspense>
    </div>
  );
}
