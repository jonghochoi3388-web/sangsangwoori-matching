"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      <Badge className="text-lg px-4 py-1 bg-amber-500 hover:bg-amber-500 text-white whitespace-nowrap">
        ⭐ {score}점 · 매우 적합
      </Badge>
    );
  if (score >= 4)
    return (
      <Badge className="text-lg px-4 py-1 bg-green-600 hover:bg-green-600 text-white whitespace-nowrap">
        {score}점 · 적합
      </Badge>
    );
  return (
    <Badge className="text-lg px-4 py-1 bg-gray-400 hover:bg-gray-400 text-white whitespace-nowrap">
      {score}점 · 보통
    </Badge>
  );
}

function RecommendationsList() {
  const searchParams = useSearchParams();
  const seniorId = searchParams.get("senior_id");

  const [matches, setMatches] = useState<MatchWithJob[]>([]);
  const [seniorName, setSeniorName] = useState("");
  const [loading, setLoading] = useState(true);

  // 확인 팝업 상태: 어떤 매칭을 실행할지
  const [confirm, setConfirm] = useState<{ matchId: string; jobTitle: string } | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null); // 저장 중인 matchId

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

  // "예" 클릭 → matches 테이블 status를 'assigned'로 업데이트
  async function handleAssign() {
    if (!confirm) return;
    const { matchId } = confirm;
    setConfirm(null);
    setAssigning(matchId);
    await supabase.from("matches").update({ status: "assigned" }).eq("id", matchId);
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: "assigned" } : m))
    );
    setAssigning(null);
  }

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

  const title = seniorName ? `${seniorName} 님께 맞는 일자리` : "추천 일자리";

  return (
    <>
      {/* 확인 팝업 */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">매칭을 실행할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-700 mt-2 space-y-1">
              <span className="block font-semibold text-gray-900">
                📋 {confirm?.jobTitle}
              </span>
              <span className="block">
                후보자분의 의견이 반영되었나요?<br />
                확인 후 매칭을 진행해 주세요.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="text-lg h-12 px-6">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssign}
              className="text-lg h-12 px-8 bg-green-600 hover:bg-green-700 text-white"
            >
              예, 매칭합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 제목 */}
      <h1 className="text-4xl font-bold text-green-800 mb-2">{title}</h1>
      <p className="text-xl text-gray-500 mb-8">
        내 프로필과 가장 잘 맞는 일자리를 점수 순으로 보여 드립니다.
      </p>

      {/* 점수 범례 */}
      <div className="mb-8 flex flex-wrap gap-3 text-lg text-gray-500 items-center">
        <span className="inline-flex items-center gap-2">
          <Badge className="bg-amber-500 text-white text-base px-3 py-1">⭐ 6점</Badge>
          매우 적합
        </span>
        <span className="inline-flex items-center gap-2">
          <Badge className="bg-green-600 text-white text-base px-3 py-1">4~5점</Badge>
          적합
        </span>
        <span className="inline-flex items-center gap-2">
          <Badge className="bg-gray-400 text-white text-base px-3 py-1">2~3점</Badge>
          보통
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-8 py-6 text-xl font-semibold text-gray-600">
          현재 매칭되는 일자리가 없습니다.<br />
          <span className="text-lg font-normal text-gray-400">
            담당자가 직접 연락드리니 잠시만 기다려 주세요.
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((m) => {
            const job = m.jobs;
            if (!job) return null;
            const isAssigned = m.status === "assigned" || m.status === "done";
            const isSaving = assigning === m.id;

            return (
              <Card
                key={m.id}
                className={`border-2 shadow-md ${isAssigned ? "border-green-400 bg-green-50" : "border-green-100"}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <CardTitle className="text-2xl text-gray-800 leading-snug">{job.title}</CardTitle>
                  <ScoreBadge score={m.score} />
                </CardHeader>
                <CardContent className="space-y-4">
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

                  {/* 매칭 실행 버튼 / 배정 완료 표시 */}
                  <div className="pt-2 border-t border-gray-100">
                    {isAssigned ? (
                      <p className="text-lg font-bold text-green-700">✅ 배정 완료</p>
                    ) : (
                      <Button
                        onClick={() => setConfirm({ matchId: m.id, jobTitle: job.title })}
                        disabled={isSaving}
                        className="h-12 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSaving ? "처리 중…" : "매칭 실행"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function RecommendationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Suspense fallback={<p className="text-xl text-gray-400 text-center py-12">불러오는 중…</p>}>
        <RecommendationsList />
      </Suspense>
    </div>
  );
}
