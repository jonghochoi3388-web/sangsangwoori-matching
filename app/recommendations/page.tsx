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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── 타입 ──────────────────────────────────────
type Senior = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
};

type Job = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
};

type MatchRecord = {
  id: string;
  job_id: string;
  score: number;
  status: string;
};

type SeniorSummary = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
  maxScore: number;
  hasAssigned: boolean;
  hasPending: boolean;
};

// ── 헬퍼 ──────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  if (score === 6)
    return <Badge className="text-base px-3 py-1 bg-amber-500 hover:bg-amber-500 text-white whitespace-nowrap">⭐ {score}점 · 매우 적합</Badge>;
  if (score >= 4)
    return <Badge className="text-base px-3 py-1 bg-green-600 hover:bg-green-600 text-white whitespace-nowrap">{score}점 · 적합</Badge>;
  if (score > 0)
    return <Badge className="text-base px-3 py-1 bg-gray-400 hover:bg-gray-400 text-white whitespace-nowrap">{score}점 · 보통</Badge>;
  return <Badge className="text-base px-3 py-1 bg-gray-200 hover:bg-gray-200 text-gray-500 whitespace-nowrap">미매칭</Badge>;
}

// ── 메인 내용 ──────────────────────────────────
function RecommendationsContent() {
  const searchParams = useSearchParams();
  const initSeniorId = searchParams.get("senior_id");

  // ── 공통 데이터
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loadingSeniors, setLoadingSeniors] = useState(true);

  // ── 상세 화면 상태
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [matchMap, setMatchMap] = useState<Record<string, MatchRecord>>({}); // key: job_id
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── 매칭 실행 팝업
  const [confirm, setConfirm] = useState<{ matchId: string; jobTitle: string } | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  // ── 시니어 요약 (목록용)
  const [summaries, setSummaries] = useState<SeniorSummary[]>([]);

  // ── 초기 로드 ──────────────────────────────
  useEffect(() => {
    async function loadSeniors() {
      const [{ data: seniorData }, { data: matchData }] = await Promise.all([
        supabase.from("seniors").select("id, name, region, desired_job, career_years").order("created_at", { ascending: false }),
        supabase.from("matches").select("senior_id, job_id, score, status"),
      ]);
      const seniorList: Senior[] = seniorData ?? [];
      setSeniors(seniorList);

      // 시니어별 요약 계산
      const matchesBySenior: Record<string, { score: number; status: string }[]> = {};
      for (const m of (matchData ?? []) as { senior_id: string; job_id: string; score: number; status: string }[]) {
        if (!matchesBySenior[m.senior_id]) matchesBySenior[m.senior_id] = [];
        matchesBySenior[m.senior_id].push(m);
      }
      setSummaries(
        seniorList.map((s) => {
          const ms = matchesBySenior[s.id] ?? [];
          return {
            ...s,
            maxScore: ms.length ? Math.max(...ms.map((m) => m.score)) : 0,
            hasAssigned: ms.some((m) => m.status === "assigned" || m.status === "done"),
            hasPending: ms.some((m) => m.score > 0 && m.status !== "assigned" && m.status !== "done"),
          };
        })
      );
      setLoadingSeniors(false);

      // senior_id 파라미터가 있으면 자동으로 상세 진입
      if (initSeniorId) {
        const target = seniorList.find((s) => s.id === initSeniorId);
        if (target) openDetail(target);
      }
    }
    loadSeniors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 상세 화면 열기 ────────────────────────
  async function openDetail(senior: Senior) {
    setSelectedSenior(senior);
    setLoadingDetail(true);
    const [{ data: jobData }, { data: matchData }] = await Promise.all([
      supabase.from("jobs").select("id, title, region, job_type, required_career").order("created_at", { ascending: false }),
      supabase.from("matches").select("id, job_id, score, status").eq("senior_id", senior.id),
    ]);
    setAllJobs((jobData as Job[]) ?? []);
    const map: Record<string, MatchRecord> = {};
    for (const m of (matchData ?? []) as MatchRecord[]) {
      map[m.job_id] = m;
    }
    setMatchMap(map);
    setLoadingDetail(false);
  }

  // ── 목록으로 돌아가기 ──────────────────────
  function backToList() {
    setSelectedSenior(null);
    setAllJobs([]);
    setMatchMap({});
  }

  // ── 매칭 실행 ─────────────────────────────
  async function handleAssign() {
    if (!confirm) return;
    const { matchId } = confirm;
    setConfirm(null);
    setAssigning(matchId);
    await supabase.from("matches").update({ status: "assigned" }).eq("id", matchId);
    setMatchMap((prev) => {
      const next = { ...prev };
      for (const jobId of Object.keys(next)) {
        if (next[jobId].id === matchId) {
          next[jobId] = { ...next[jobId], status: "assigned" };
        }
      }
      return next;
    });
    // 목록 요약도 갱신
    if (selectedSenior) {
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === selectedSenior.id ? { ...s, hasAssigned: true } : s
        )
      );
    }
    setAssigning(null);
  }

  // ── 렌더: 목록 화면 ───────────────────────
  if (!selectedSenior) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-1">구직자 목록</h1>
          <p className="text-xl text-gray-500">구직자를 선택하면 매칭 가능한 전체 일자리를 확인할 수 있습니다.</p>
        </div>

        {loadingSeniors ? (
          <p className="text-xl text-gray-400 text-center py-12">불러오는 중…</p>
        ) : seniors.length === 0 ? (
          <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-8 py-6 text-xl font-semibold text-gray-600">
            등록된 구직자가 없습니다.
          </div>
        ) : (
          <Card className="border-2 border-gray-100 shadow-md">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-lg font-bold text-gray-700">이름</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700">지역</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700">희망 직종</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700 text-center">최고 점수</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700 text-center">상태</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700 text-center">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((s) => (
                    <TableRow key={s.id} className="text-xl">
                      <TableCell className="font-semibold">{s.name}</TableCell>
                      <TableCell>{s.region}</TableCell>
                      <TableCell>{s.desired_job}</TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${s.maxScore >= 4 ? "text-green-600" : s.maxScore > 0 ? "text-gray-600" : "text-gray-300"}`}>
                          {s.maxScore > 0 ? `${s.maxScore}점` : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {s.hasAssigned ? (
                          <Badge className="text-base px-3 py-1 bg-green-600 hover:bg-green-600 text-white">배정 완료</Badge>
                        ) : s.hasPending ? (
                          <Badge className="text-base px-3 py-1 bg-yellow-500 hover:bg-yellow-500 text-white">매칭 대기</Badge>
                        ) : (
                          <Badge className="text-base px-3 py-1 bg-red-400 hover:bg-red-400 text-white">미매칭</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          className="text-lg px-4 py-2 border-2"
                          onClick={() => openDetail(s)}
                        >
                          상세 보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // ── 렌더: 상세 화면 ───────────────────────
  return (
    <>
      {/* 매칭 실행 확인 팝업 */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">매칭을 실행할까요?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-700 mt-2 space-y-1">
              <span className="block font-semibold text-gray-900">📋 {confirm?.jobTitle}</span>
              <span className="block">후보자분의 의견이 반영되었나요?<br />확인 후 매칭을 진행해 주세요.</span>
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
      <div className="mb-8">
        <Button
          variant="outline"
          className="text-lg px-5 py-2 border-2 mb-4"
          onClick={backToList}
        >
          ← 전체 구직자 목록으로
        </Button>
        <h1 className="text-4xl font-bold text-green-800 mb-1">{selectedSenior.name} 님의 매칭 일자리</h1>
        <p className="text-xl text-gray-500">
          {selectedSenior.region} · {selectedSenior.desired_job} · 경력 {selectedSenior.career_years > 0 ? `${selectedSenior.career_years}년` : "없음"}
        </p>
      </div>

      {loadingDetail ? (
        <p className="text-xl text-gray-400 text-center py-12">불러오는 중…</p>
      ) : allJobs.length === 0 ? (
        <div className="rounded-xl border-2 border-gray-300 bg-gray-50 px-8 py-6 text-xl font-semibold text-gray-600">
          등록된 일자리가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {allJobs.map((job) => {
            const match = matchMap[job.id];
            const score = match?.score ?? 0;
            const status = match?.status ?? "";
            const isAssigned = status === "assigned" || status === "done";
            const isSaving = match ? assigning === match.id : false;
            return (
              <Card
                key={job.id}
                className={`border-2 shadow-md ${isAssigned ? "border-green-300 bg-green-50" : "border-gray-100"}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <CardTitle className="text-xl text-gray-800 leading-snug">{job.title}</CardTitle>
                  <ScoreBadge score={score} />
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
                    ) : match ? (
                      <Button
                        onClick={() => setConfirm({ matchId: match.id, jobTitle: job.title })}
                        disabled={isSaving}
                        className="h-11 px-6 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSaving ? "처리 중…" : "매칭 실행"}
                      </Button>
                    ) : (
                      <p className="text-lg text-gray-400">매칭 레코드 없음</p>
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
        <RecommendationsContent />
      </Suspense>
    </div>
  );
}
