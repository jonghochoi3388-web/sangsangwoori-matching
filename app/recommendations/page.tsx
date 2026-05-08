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

type JobDetail = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
};

type MatchItem = {
  id: string;
  score: number;
  status: string;
  jobs: JobDetail | null;
};

type SeniorWithMatches = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
  matches: MatchItem[];
};

function ScoreBadge({ score }: { score: number }) {
  if (score === 6)
    return (
      <Badge className="text-base px-3 py-1 bg-amber-500 hover:bg-amber-500 text-white whitespace-nowrap">
        ⭐ {score}점 · 매우 적합
      </Badge>
    );
  if (score >= 4)
    return (
      <Badge className="text-base px-3 py-1 bg-green-600 hover:bg-green-600 text-white whitespace-nowrap">
        {score}점 · 적합
      </Badge>
    );
  return (
    <Badge className="text-base px-3 py-1 bg-gray-400 hover:bg-gray-400 text-white whitespace-nowrap">
      {score}점 · 보통
    </Badge>
  );
}

function RecommendationsList() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("senior_id");

  const [seniors, setSeniors] = useState<SeniorWithMatches[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const [confirm, setConfirm] = useState<{ matchId: string; seniorId: string; jobTitle: string } | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: seniorData }, { data: matchData }] = await Promise.all([
        supabase
          .from("seniors")
          .select("id, name, region, desired_job, career_years")
          .order("created_at", { ascending: false }),
        supabase
          .from("matches")
          .select("id, score, status, senior_id, jobs(id, title, region, job_type, required_career)")
          .gt("score", 0)
          .order("score", { ascending: false }),
      ]);

      const matchesBySenior: Record<string, MatchItem[]> = {};
      for (const m of (matchData ?? []) as unknown as (MatchItem & { senior_id: string })[]) {
        if (!matchesBySenior[m.senior_id]) matchesBySenior[m.senior_id] = [];
        matchesBySenior[m.senior_id].push(m);
      }

      const result: SeniorWithMatches[] = (seniorData ?? []).map((s) => ({
        ...s,
        matches: matchesBySenior[s.id] ?? [],
      }));

      setSeniors(result);

      // senior_id 파라미터가 있으면 해당 구직자를 자동으로 펼침
      if (highlightId) {
        setOpenIds(new Set([highlightId]));
      } else {
        // 기본: 전원 펼침
        setOpenIds(new Set(result.map((s) => s.id)));
      }

      setLoading(false);
    }
    load();
  }, [highlightId]);

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (!confirm) return;
    const { matchId, seniorId } = confirm;
    setConfirm(null);
    setAssigning(matchId);
    await supabase.from("matches").update({ status: "assigned" }).eq("id", matchId);
    setSeniors((prev) =>
      prev.map((s) =>
        s.id === seniorId
          ? {
              ...s,
              matches: s.matches.map((m) =>
                m.id === matchId ? { ...m, status: "assigned" } : m
              ),
            }
          : s
      )
    );
    setAssigning(null);
  }

  if (loading) {
    return <p className="text-xl text-gray-400 text-center py-12">불러오는 중…</p>;
  }

  if (seniors.length === 0) {
    return (
      <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-8 py-6 text-xl font-semibold text-gray-600">
        등록된 구직자가 없습니다.
      </div>
    );
  }

  return (
    <>
      {/* 매칭 실행 확인 팝업 */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">매칭을 실행할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-700 mt-2 space-y-1">
              <span className="block font-semibold text-gray-900">📋 {confirm?.jobTitle}</span>
              <span className="block">
                후보자분의 의견이 반영되었나요?<br />확인 후 매칭을 진행해 주세요.
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

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-green-800 mb-1">구직자별 매칭 일자리</h1>
          <p className="text-xl text-gray-500">각 구직자에게 적합한 일자리를 점수 순으로 보여 드립니다.</p>
        </div>
        <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800 shrink-0">총 {seniors.length}명</Badge>
      </div>

      {/* 구직자 목록 */}
      <div className="space-y-6">
        {seniors.map((s) => {
          const isOpen = openIds.has(s.id);
          const hasMatches = s.matches.length > 0;
          const isHighlighted = s.id === highlightId;
          const assignedCount = s.matches.filter(
            (m) => m.status === "assigned" || m.status === "done"
          ).length;
          const topScore = hasMatches ? s.matches[0].score : 0;

          return (
            <Card
              key={s.id}
              id={`senior-${s.id}`}
              className={`border-2 shadow-md transition-colors ${
                isHighlighted ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
              }`}
            >
              {/* 구직자 헤더 행 */}
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleOpen(s.id)}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-wrap">
                    <CardTitle className="text-2xl text-gray-800">{s.name}</CardTitle>
                    <span className="text-lg text-gray-500">
                      {s.region} · {s.desired_job} · 경력 {s.career_years > 0 ? `${s.career_years}년` : "없음"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {assignedCount > 0 && (
                      <Badge className="text-base px-3 py-1 bg-green-600 text-white">
                        ✅ 배정 {assignedCount}건
                      </Badge>
                    )}
                    {hasMatches ? (
                      <Badge className="text-base px-3 py-1 bg-blue-100 text-blue-800">
                        매칭 {s.matches.length}건 · 최고 {topScore}점
                      </Badge>
                    ) : (
                      <Badge className="text-base px-3 py-1 bg-red-100 text-red-600">
                        매칭 없음
                      </Badge>
                    )}
                    <span className="text-2xl text-gray-400 ml-1">{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>
              </CardHeader>

              {/* 매칭 일자리 목록 */}
              {isOpen && (
                <CardContent className="pt-0">
                  {!hasMatches ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-lg text-gray-500">
                      현재 매칭되는 일자리가 없습니다. 담당자가 직접 연락드리니 잠시 기다려 주세요.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {s.matches.map((m) => {
                        const job = m.jobs;
                        if (!job) return null;
                        const isAssigned = m.status === "assigned" || m.status === "done";
                        const isSaving = assigning === m.id;
                        return (
                          <Card
                            key={m.id}
                            className={`border shadow-sm ${isAssigned ? "border-green-300 bg-green-50" : "border-gray-100"}`}
                          >
                            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                              <CardTitle className="text-xl text-gray-800 leading-snug">{job.title}</CardTitle>
                              <ScoreBadge score={m.score} />
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-lg text-gray-600">
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
                              <div className="pt-2 border-t border-gray-100">
                                {isAssigned ? (
                                  <p className="text-lg font-bold text-green-700">✅ 배정 완료</p>
                                ) : (
                                  <Button
                                    onClick={() =>
                                      setConfirm({ matchId: m.id, seniorId: s.id, jobTitle: job.title })
                                    }
                                    disabled={isSaving}
                                    className="h-11 px-6 text-lg bg-blue-600 hover:bg-blue-700 text-white"
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
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
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
