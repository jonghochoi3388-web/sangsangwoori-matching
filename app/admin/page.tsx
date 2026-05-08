"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REGIONS = ["서울", "경기", "인천", "기타"] as const;
const JOB_TYPES = ["경비", "청소", "조리", "돌봄", "기타"] as const;

// ── 타입 ──────────────────────────────────────
type Job = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
  created_at: string;
};

type Senior = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
};

type MatchRow = {
  senior_id: string;
  score: number;
  status: string;
};

type SeniorStatus = "unmatched" | "pending" | "assigned";

// ── 헬퍼 ──────────────────────────────────────
function getSeniorStatus(seniorId: string, matches: MatchRow[]): SeniorStatus {
  const sm = matches.filter((m) => m.senior_id === seniorId);
  if (sm.length === 0 || sm.every((m) => m.score === 0)) return "unmatched";
  if (sm.some((m) => m.status === "assigned" || m.status === "done")) return "assigned";
  return "pending";
}

function getMaxScore(seniorId: string, matches: MatchRow[]): number {
  const sm = matches.filter((m) => m.senior_id === seniorId);
  return sm.length === 0 ? 0 : Math.max(...sm.map((m) => m.score));
}

function StatusBadge({ status }: { status: SeniorStatus }) {
  if (status === "assigned")
    return <Badge className="text-base px-3 py-1 bg-green-600 hover:bg-green-600 text-white">배정 완료</Badge>;
  if (status === "pending")
    return <Badge className="text-base px-3 py-1 bg-yellow-500 hover:bg-yellow-500 text-white">매칭 대기</Badge>;
  return <Badge className="text-base px-3 py-1 bg-red-400 hover:bg-red-400 text-white">미매칭</Badge>;
}

// ── 폼 유효성 검사 ────────────────────────────
const INITIAL_JOB_FORM = { title: "", region: "", job_type: "", required_career: "" };
type JobFormState = typeof INITIAL_JOB_FORM;
type JobFieldError = Partial<Record<keyof JobFormState, string>>;

function validateJob(form: JobFormState): JobFieldError {
  const errors: JobFieldError = {};
  if (!form.title.trim()) errors.title = "공고명을 입력해 주세요.";
  if (!form.region) errors.region = "지역을 선택해 주세요.";
  if (!form.job_type) errors.job_type = "직종을 선택해 주세요.";
  if (form.required_career !== "") {
    const v = Number(form.required_career);
    if (isNaN(v) || v < 0 || !Number.isInteger(v))
      errors.required_career = "요구 경력은 0 이상의 정수로 입력해 주세요.";
  }
  return errors;
}

function FieldErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-lg font-medium text-red-700">
      {msg}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────
export default function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [allMatches, setAllMatches] = useState<MatchRow[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [jobForm, setJobForm] = useState(INITIAL_JOB_FORM);
  const [jobFieldErrors, setJobFieldErrors] = useState<JobFieldError>({});
  const [addStatus, setAddStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── 데이터 로드 ────────────────────────────
  async function fetchDashboard() {
    setLoadingDashboard(true);
    const [{ data: seniorData }, { data: matchData }] = await Promise.all([
      supabase.from("seniors").select("id, name, region, desired_job, career_years").order("created_at", { ascending: false }),
      supabase.from("matches").select("senior_id, score, status"),
    ]);
    setSeniors(seniorData ?? []);
    setAllMatches(matchData ?? []);
    setLoadingDashboard(false);
  }

  async function fetchJobs() {
    setLoadingJobs(true);
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs(data ?? []);
    setLoadingJobs(false);
  }

  useEffect(() => {
    fetchDashboard();
    fetchJobs();
  }, []);

  // ── 집계 ──────────────────────────────────
  const unmatchedCount = seniors.filter((s) => getSeniorStatus(s.id, allMatches) === "unmatched").length;
  const pendingCount   = seniors.filter((s) => getSeniorStatus(s.id, allMatches) === "pending").length;
  const assignedCount  = seniors.filter((s) => getSeniorStatus(s.id, allMatches) === "assigned").length;

  // ── 일자리 추가 ───────────────────────────
  function handleJobInput(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setJobForm((prev) => ({ ...prev, [name]: value }));
    setJobFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleJobSelect(field: "region" | "job_type", value: string | null) {
    if (!value) return;
    setJobForm((prev) => ({ ...prev, [field]: value }));
    setJobFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleAddJob(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateJob(jobForm);
    if (Object.keys(errors).length > 0) { setJobFieldErrors(errors); return; }

    setAddStatus("loading");
    setAddError("");

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: jobForm.title.trim(),
        region: jobForm.region,
        job_type: jobForm.job_type,
        required_career: jobForm.required_career === "" ? 0 : Number(jobForm.required_career),
      })
      .select("id")
      .single();

    if (error) {
      setAddStatus("error");
      setAddError(error.message);
      return;
    }

    await supabase.rpc("recalc_matches_for_job", { p_job_id: data.id });

    setAddStatus("success");
    setJobForm(INITIAL_JOB_FORM);
    setJobFieldErrors({});
    await Promise.all([fetchJobs(), fetchDashboard()]);
    setTimeout(() => setAddStatus("idle"), 3000);
  }

  async function handleDeleteJob(id: string) {
    setDeletingId(id);
    await supabase.from("jobs").delete().eq("id", id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeletingId(null);
  }

  // ── 렌더 ──────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <div>
        <h1 className="text-4xl font-bold text-orange-800 mb-2">담당자 대시보드</h1>
        <p className="text-xl text-gray-500">매칭 진행 현황을 한눈에 확인하세요.</p>
      </div>

      {/* ── 매칭 현황 집계 카드 ── */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700 mb-4">매칭 현황</h2>
        <div className="grid grid-cols-3 gap-6">
          <Card className="border-2 border-red-200 bg-red-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> 미매칭
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-red-600">
                {loadingDashboard ? "…" : unmatchedCount}
              </p>
              <p className="text-lg text-red-400 mt-1">매칭 결과 없는 시니어</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 bg-yellow-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-yellow-800 flex items-center gap-2">
                <Clock className="w-6 h-6" /> 매칭 대기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-yellow-600">
                {loadingDashboard ? "…" : pendingCount}
              </p>
              <p className="text-lg text-yellow-500 mt-1">배정 전 매칭 있음</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" /> 배정 완료
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-green-600">
                {loadingDashboard ? "…" : assignedCount}
              </p>
              <p className="text-lg text-green-500 mt-1">assigned / done 상태</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 시니어 목록 ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-700">시니어 목록</h2>
          <Badge className="text-lg px-4 py-1 bg-blue-100 text-blue-800">총 {seniors.length}명</Badge>
        </div>
        <Card className="border-2 border-gray-100 shadow-md">
          <CardContent className="pt-4">
            {loadingDashboard ? (
              <p className="text-xl text-gray-400 text-center py-8">불러오는 중…</p>
            ) : seniors.length === 0 ? (
              <p className="text-xl text-gray-400 text-center py-8">등록된 시니어가 없습니다.</p>
            ) : (
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
                  {seniors.map((s) => {
                    const st = getSeniorStatus(s.id, allMatches);
                    const maxScore = getMaxScore(s.id, allMatches);
                    return (
                      <TableRow key={s.id} className="text-xl">
                        <TableCell className="font-semibold">{s.name}</TableCell>
                        <TableCell>{s.region}</TableCell>
                        <TableCell>{s.desired_job}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${maxScore >= 4 ? "text-green-600" : maxScore > 0 ? "text-gray-600" : "text-gray-300"}`}>
                            {maxScore > 0 ? `${maxScore}점` : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={st} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Link href={`/recommendations?senior_id=${s.id}`}>
                            <Button variant="outline" className="text-lg px-4 py-2 border-2">
                              상세 보기
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── 일자리 관리 ── */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700 mb-6">일자리 관리</h2>

        {/* 추가 폼 */}
        <Card className="border-2 border-orange-100 shadow-lg mb-10">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-700">새 일자리 추가</CardTitle>
          </CardHeader>
          <CardContent>
            {addStatus === "success" && (
              <div className="mb-6 rounded-xl border-2 border-green-500 bg-green-50 px-6 py-4 text-xl font-bold text-green-800">
                ✅ 일자리가 등록되고 매칭이 자동으로 업데이트되었습니다.
              </div>
            )}
            {addStatus === "error" && (
              <div className="mb-6 rounded-xl border-2 border-red-500 bg-red-50 px-6 py-4 text-xl font-bold text-red-800">
                ❌ 오류: {addError}
              </div>
            )}
            <form onSubmit={handleAddJob} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xl font-semibold">
                    공고명 <span className="text-red-500">*</span>
                  </Label>
                  <FieldErrorMsg msg={jobFieldErrors.title} />
                  <Input id="title" name="title" value={jobForm.title} onChange={handleJobInput}
                    placeholder="예: 아파트 경비원 모집"
                    className={`text-xl h-14 border-2 ${jobFieldErrors.title ? "border-red-400" : ""}`}
                    disabled={addStatus === "loading"} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xl font-semibold">지역 <span className="text-red-500">*</span></Label>
                  <FieldErrorMsg msg={jobFieldErrors.region} />
                  <Select value={jobForm.region} onValueChange={(v) => handleJobSelect("region", v)} disabled={addStatus === "loading"}>
                    <SelectTrigger className={`text-xl h-14 border-2 ${jobFieldErrors.region ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => <SelectItem key={r} value={r} className="text-xl py-3">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xl font-semibold">직종 <span className="text-red-500">*</span></Label>
                  <FieldErrorMsg msg={jobFieldErrors.job_type} />
                  <Select value={jobForm.job_type} onValueChange={(v) => handleJobSelect("job_type", v)} disabled={addStatus === "loading"}>
                    <SelectTrigger className={`text-xl h-14 border-2 ${jobFieldErrors.job_type ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="직종 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((j) => <SelectItem key={j} value={j} className="text-xl py-3">{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="required_career" className="text-xl font-semibold">
                    요구 경력 (년) <span className="ml-2 text-lg font-normal text-gray-400">선택</span>
                  </Label>
                  <FieldErrorMsg msg={jobFieldErrors.required_career} />
                  <Input id="required_career" name="required_career" type="number" min={0} step={1}
                    value={jobForm.required_career} onChange={handleJobInput} placeholder="예: 2"
                    className={`text-xl h-14 border-2 ${jobFieldErrors.required_career ? "border-red-400" : ""}`}
                    disabled={addStatus === "loading"} />
                </div>
              </div>
              <Button type="submit"
                className="w-full text-2xl py-7 bg-orange-600 hover:bg-orange-700 disabled:opacity-60"
                disabled={addStatus === "loading"}>
                {addStatus === "loading" ? "등록 중…" : "일자리 추가"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 목록 */}
        <Card className="border-2 border-gray-100 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-700">등록된 일자리</CardTitle>
              <Badge className="text-lg px-4 py-1 bg-orange-100 text-orange-800">총 {jobs.length}건</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <p className="text-xl text-gray-400 text-center py-8">불러오는 중…</p>
            ) : jobs.length === 0 ? (
              <p className="text-xl text-gray-400 text-center py-8">등록된 일자리가 없습니다.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-lg font-bold text-gray-700 w-[35%]">공고명</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700">지역</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700">직종</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700 text-center">요구 경력</TableHead>
                    <TableHead className="text-lg font-bold text-gray-700 text-center">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} className="text-xl">
                      <TableCell className="font-semibold">{job.title}</TableCell>
                      <TableCell>{job.region}</TableCell>
                      <TableCell>{job.job_type}</TableCell>
                      <TableCell className="text-center">
                        {job.required_career > 0 ? `${job.required_career}년` : "무관"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="destructive" className="text-lg px-5 py-3"
                          onClick={() => handleDeleteJob(job.id)} disabled={deletingId === job.id}>
                          {deletingId === job.id ? "삭제 중…" : "삭제"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
