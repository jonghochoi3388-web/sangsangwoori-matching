"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SeniorRow = {
  id: string;
  name: string;
  region: string;
  desired_job: string;
  career_years: number;
  maxScore: number;
  hasAssigned: boolean;
  hasPending: boolean;
};

export default function RecommendationsPage() {
  const [seniors, setSeniors] = useState<SeniorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: seniorData }, { data: matchData }] = await Promise.all([
        supabase
          .from("seniors")
          .select("id, name, region, desired_job, career_years")
          .order("created_at", { ascending: false }),
        supabase.from("matches").select("senior_id, score, status"),
      ]);

      const matchesBySenior: Record<string, { score: number; status: string }[]> = {};
      for (const m of (matchData ?? []) as { senior_id: string; score: number; status: string }[]) {
        if (!matchesBySenior[m.senior_id]) matchesBySenior[m.senior_id] = [];
        matchesBySenior[m.senior_id].push(m);
      }

      setSeniors(
        (seniorData ?? []).map((s) => {
          const ms = matchesBySenior[s.id] ?? [];
          return {
            ...s,
            maxScore: ms.length ? Math.max(...ms.map((m) => m.score)) : 0,
            hasAssigned: ms.some((m) => m.status === "assigned" || m.status === "done"),
            hasPending: ms.some((m) => m.score > 0 && m.status !== "assigned" && m.status !== "done"),
          };
        })
      );
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-1">구직자 목록</h1>
        <p className="text-xl text-gray-500">구직자를 선택하면 매칭된 일자리를 확인할 수 있습니다.</p>
      </div>

      {loading ? (
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
                  <TableHead className="text-lg font-bold text-gray-700 text-center">매칭 보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seniors.map((s) => (
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
                      <Link href={`/recommendations/${s.id}`}>
                        <Button variant="outline" className="text-lg px-4 py-2 border-2">
                          상세 보기
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
