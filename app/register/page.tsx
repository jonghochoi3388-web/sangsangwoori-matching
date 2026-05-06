"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGIONS = ["서울", "경기", "인천", "기타"] as const;
const JOB_TYPES = ["경비", "청소", "조리", "돌봄", "기타"] as const;

const INITIAL_FORM = { name: "", region: "", desired_job: "", career_years: "" };
type FormState = typeof INITIAL_FORM;
type FieldError = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldError {
  const errors: FieldError = {};
  if (!form.name.trim()) errors.name = "이름을 입력해 주세요.";
  if (!form.region) errors.region = "지역을 선택해 주세요.";
  if (!form.desired_job) errors.desired_job = "희망 직종을 선택해 주세요.";
  if (form.career_years !== "") {
    const years = Number(form.career_years);
    if (isNaN(years) || years < 0 || !Number.isInteger(years))
      errors.career_years = "경력은 0 이상의 정수로 입력해 주세요.";
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

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSelect(field: "region" | "desired_job", value: string | null) {
    if (!value) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("loading");
    setServerError("");

    const { error } = await supabase.from("seniors").insert({
      name: form.name.trim(),
      region: form.region,
      desired_job: form.desired_job,
      career_years: form.career_years === "" ? 0 : Number(form.career_years),
    });

    if (error) {
      setStatus("error");
      setServerError(error.message);
    } else {
      setStatus("success");
      setForm(INITIAL_FORM);
      setFieldErrors({});
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-blue-800 mb-2">프로필 등록</h1>
      <p className="text-xl text-gray-500 mb-8">내 정보를 입력하면 알맞은 일자리를 찾아 드립니다.</p>

      {status === "success" && (
        <div className="mb-8 rounded-xl border-2 border-green-500 bg-green-50 px-6 py-5 text-xl font-bold text-green-800">
          ✅ 등록이 완료되었습니다! 추천 일자리를 확인해 보세요.
        </div>
      )}

      {status === "error" && (
        <div className="mb-8 rounded-xl border-2 border-red-500 bg-red-50 px-6 py-5 text-xl font-bold text-red-800">
          ❌ 오류: {serverError}
        </div>
      )}

      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-700">기본 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-8">

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xl font-semibold">
                이름 <span className="text-red-500">*</span>
              </Label>
              <FieldErrorMsg msg={fieldErrors.name} />
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleInput}
                placeholder="홍길동"
                className={`text-xl h-14 border-2 ${fieldErrors.name ? "border-red-400" : ""}`}
                disabled={status === "loading"}
              />
            </div>

            {/* 지역 */}
            <div className="space-y-2">
              <Label className="text-xl font-semibold">
                지역 <span className="text-red-500">*</span>
              </Label>
              <FieldErrorMsg msg={fieldErrors.region} />
              <Select
                value={form.region}
                onValueChange={(v) => handleSelect("region", v)}
                disabled={status === "loading"}
              >
                <SelectTrigger
                  className={`text-xl h-14 border-2 ${fieldErrors.region ? "border-red-400" : ""}`}
                >
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xl py-3">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 희망 직종 */}
            <div className="space-y-2">
              <Label className="text-xl font-semibold">
                희망 직종 <span className="text-red-500">*</span>
              </Label>
              <FieldErrorMsg msg={fieldErrors.desired_job} />
              <Select
                value={form.desired_job}
                onValueChange={(v) => handleSelect("desired_job", v)}
                disabled={status === "loading"}
              >
                <SelectTrigger
                  className={`text-xl h-14 border-2 ${fieldErrors.desired_job ? "border-red-400" : ""}`}
                >
                  <SelectValue placeholder="직종을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((j) => (
                    <SelectItem key={j} value={j} className="text-xl py-3">
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 경력 */}
            <div className="space-y-2">
              <Label htmlFor="career_years" className="text-xl font-semibold">
                경력 (년)
                <span className="ml-2 text-lg font-normal text-gray-400">선택</span>
              </Label>
              <FieldErrorMsg msg={fieldErrors.career_years} />
              <Input
                id="career_years"
                name="career_years"
                type="number"
                min={0}
                step={1}
                value={form.career_years}
                onChange={handleInput}
                placeholder="예: 5 (없으면 비워 두세요)"
                className={`text-xl h-14 border-2 ${fieldErrors.career_years ? "border-red-400" : ""}`}
                disabled={status === "loading"}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-2xl py-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              disabled={status === "loading"}
            >
              {status === "loading" ? "등록 중…" : "등록하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
