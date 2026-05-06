"use client";

import { useEffect, useState } from "react";
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

type Job = {
  id: string;
  title: string;
  region: string;
  job_type: string;
  required_career: number;
  created_at: string;
};

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

// ────────────────────────────────────────────
// 매칭 요약 카운터 (다음 단계에서 데이터 연결)
// ────────────────────────────────────────────
const STATUS_COLUMNS = [
  { label: "미매칭", color: "bg-red-100 text-red-800 border-red-200" },
  { label: "매칭 대기", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { label: "배정 완료", color: "bg-green-100 text-green-800 border-green-200" },
];

export default function AdminPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobForm, setJobForm] = useState(INITIAL_JOB_FORM);
  const [jobFieldErrors, setJobFieldErrors] = useState<JobFieldError>({});
  const [addStatus, setAddStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchJobs() {
    setLoadingJobs(true);
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    setJobs(data ?? []);
    setLoadingJobs(false);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

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
    if (Object.keys(errors).length > 0) {
      setJobFieldErrors(errors);
      return;
    }

    setAddStatus("loading");
    setAddError("");

    const { error } = await supabase.from("jobs").insert({
      title: jobForm.title.trim(),
      region: jobForm.region,
      job_type: jobForm.job_type,
      required_career: jobForm.required_career === "" ? 0 : Number(jobForm.required_career),
    });

    if (error) {
      setAddStatus("error");
      setAddError(error.message);
    } else {
      setAddStatus("success");
      setJobForm(INITIAL_JOB_FORM);
      setJobFieldErrors({});
      fetchJobs();
      setTimeout(() => setAddStatus("idle"), 3000);
    }
  }

  async function handleDeleteJob(id: string) {
    setDeletingId(id);
    await supabase.from("jobs").delete().eq("id", id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <div>
        <h1 className="text-4xl font-bold text-orange-800 mb-2">담당자 대시보드</h1>
        <p className="text-xl text-gray-500">매칭 진행 현황을 한눈에 확인하세요.</p>
      </div>

      {/* ── 매칭 현황 요약 (뼈대) ── */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700 mb-4">매칭 현황</h2>
        <div className="grid grid-cols-3 gap-6">
          {STATUS_COLUMNS.map((col) => (
            <Card key={col.label} className={`border-2 ${col.color} shadow-md`}>
              <CardHeader>
                <CardTitle className="text-2xl">{col.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-bold text-gray-400">—</p>
                <p className="text-lg text-gray-400 mt-1">다음 단계에서 연결됩니다</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── 일자리 관리 ── */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700 mb-6">일자리 관리</h2>

        {/* 일자리 추가 폼 */}
        <Card className="border-2 border-orange-100 shadow-lg mb-10">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-700">새 일자리 추가</CardTitle>
          </CardHeader>
          <CardContent>
            {addStatus === "success" && (
              <div className="mb-6 rounded-xl border-2 border-green-500 bg-green-50 px-6 py-4 text-xl font-bold text-green-800">
                ✅ 일자리가 등록되었습니다.
              </div>
            )}
            {addStatus === "error" && (
              <div className="mb-6 rounded-xl border-2 border-red-500 bg-red-50 px-6 py-4 text-xl font-bold text-red-800">
                ❌ 오류: {addError}
              </div>
            )}

            <form onSubmit={handleAddJob} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 공고명 */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xl font-semibold">
                    공고명 <span className="text-red-500">*</span>
                  </Label>
                  <FieldErrorMsg msg={jobFieldErrors.title} />
                  <Input
                    id="title"
                    name="title"
                    value={jobForm.title}
                    onChange={handleJobInput}
                    placeholder="예: 아파트 경비원 모집"
                    className={`text-xl h-14 border-2 ${jobFieldErrors.title ? "border-red-400" : ""}`}
                    disabled={addStatus === "loading"}
                  />
                </div>

                {/* 지역 */}
                <div className="space-y-2">
                  <Label className="text-xl font-semibold">
                    지역 <span className="text-red-500">*</span>
                  </Label>
                  <FieldErrorMsg msg={jobFieldErrors.region} />
                  <Select
                    value={jobForm.region}
                    onValueChange={(v) => handleJobSelect("region", v)}
                    disabled={addStatus === "loading"}
                  >
                    <SelectTrigger className={`text-xl h-14 border-2 ${jobFieldErrors.region ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-xl py-3">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 직종 */}
                <div className="space-y-2">
                  <Label className="text-xl font-semibold">
                    직종 <span className="text-red-500">*</span>
                  </Label>
                  <FieldErrorMsg msg={jobFieldErrors.job_type} />
                  <Select
                    value={jobForm.job_type}
                    onValueChange={(v) => handleJobSelect("job_type", v)}
                    disabled={addStatus === "loading"}
                  >
                    <SelectTrigger className={`text-xl h-14 border-2 ${jobFieldErrors.job_type ? "border-red-400" : ""}`}>
                      <SelectValue placeholder="직종 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((j) => (
                        <SelectItem key={j} value={j} className="text-xl py-3">{j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 요구 경력 */}
                <div className="space-y-2">
                  <Label htmlFor="required_career" className="text-xl font-semibold">
                    요구 경력 (년)
                    <span className="ml-2 text-lg font-normal text-gray-400">선택</span>
                  </Label>
                  <FieldErrorMsg msg={jobFieldErrors.required_career} />
                  <Input
                    id="required_career"
                    name="required_career"
                    type="number"
                    min={0}
                    step={1}
                    value={jobForm.required_career}
                    onChange={handleJobInput}
                    placeholder="예: 2"
                    className={`text-xl h-14 border-2 ${jobFieldErrors.required_career ? "border-red-400" : ""}`}
                    disabled={addStatus === "loading"}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-2xl py-7 bg-orange-600 hover:bg-orange-700 disabled:opacity-60"
                disabled={addStatus === "loading"}
              >
                {addStatus === "loading" ? "등록 중…" : "일자리 추가"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 일자리 목록 */}
        <Card className="border-2 border-gray-100 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-700">등록된 일자리</CardTitle>
              <Badge className="text-lg px-4 py-1 bg-orange-100 text-orange-800">
                총 {jobs.length}건
              </Badge>
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
                        <Button
                          variant="destructive"
                          className="text-lg px-5 py-3"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deletingId === job.id}
                        >
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
