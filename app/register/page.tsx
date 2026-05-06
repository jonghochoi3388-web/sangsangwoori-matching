"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_FORM = { name: "", region: "", desired_job: "", career_years: "" };

type FieldError = Partial<Record<keyof typeof INITIAL_FORM, string>>;

function validate(form: typeof INITIAL_FORM): FieldError {
  const errors: FieldError = {};
  if (!form.name.trim()) errors.name = "이름을 입력해 주세요.";
  if (!form.region.trim()) errors.region = "거주 지역을 입력해 주세요.";
  if (!form.desired_job.trim()) errors.desired_job = "희망 직종을 입력해 주세요.";
  const years = Number(form.career_years);
  if (form.career_years === "" || isNaN(years) || years < 0 || !Number.isInteger(years))
    errors.career_years = "경력을 0 이상 정수로 입력해 주세요.";
  return errors;
}

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof INITIAL_FORM]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const { error } = await supabase.from("seniors").insert({
      name: form.name.trim(),
      region: form.region.trim(),
      desired_job: form.desired_job.trim(),
      career_years: Number(form.career_years),
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
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
        <div className="mb-8 rounded-xl border-2 border-green-400 bg-green-50 px-6 py-5 text-xl font-semibold text-green-800">
          ✅ 등록이 완료되었습니다! 추천 일자리를 확인해 보세요.
        </div>
      )}

      {status === "error" && (
        <div className="mb-8 rounded-xl border-2 border-red-400 bg-red-50 px-6 py-5 text-xl font-semibold text-red-800">
          ❌ 등록 중 오류가 발생했습니다: {errorMsg}
        </div>
      )}

      <Card className="border-2 border-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-700">기본 정보 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xl font-semibold">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="홍길동"
                className={`text-xl h-14 border-2 ${fieldErrors.name ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                disabled={status === "loading"}
              />
              {fieldErrors.name && (
                <p className="text-lg text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-xl font-semibold">
                거주 지역 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                placeholder="예: 서울 강남구"
                className={`text-xl h-14 border-2 ${fieldErrors.region ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                disabled={status === "loading"}
              />
              {fieldErrors.region && (
                <p className="text-lg text-red-600">{fieldErrors.region}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired_job" className="text-xl font-semibold">
                희망 직종 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="desired_job"
                name="desired_job"
                value={form.desired_job}
                onChange={handleChange}
                placeholder="예: 경비원, 청소, 요양보호사"
                className={`text-xl h-14 border-2 ${fieldErrors.desired_job ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                disabled={status === "loading"}
              />
              {fieldErrors.desired_job && (
                <p className="text-lg text-red-600">{fieldErrors.desired_job}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="career_years" className="text-xl font-semibold">
                경력 (년) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="career_years"
                name="career_years"
                type="number"
                min={0}
                step={1}
                value={form.career_years}
                onChange={handleChange}
                placeholder="예: 5"
                className={`text-xl h-14 border-2 ${fieldErrors.career_years ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                disabled={status === "loading"}
              />
              {fieldErrors.career_years && (
                <p className="text-lg text-red-600">{fieldErrors.career_years}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full text-2xl py-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              disabled={status === "loading"}
            >
              {status === "loading" ? "등록 중..." : "등록하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
