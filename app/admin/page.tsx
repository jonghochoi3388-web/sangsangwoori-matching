import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const columns = [
  { label: "미매칭", status: "unmatched", color: "bg-red-100 text-red-800 border-red-200", count: "—" },
  { label: "매칭 대기", status: "pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", count: "—" },
  { label: "배정 완료", status: "assigned", color: "bg-green-100 text-green-800 border-green-200", count: "—" },
];

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-orange-800 mb-2">담당자 대시보드</h1>
      <p className="text-xl text-gray-500 mb-8">매칭 진행 현황을 한눈에 확인하세요.</p>

      {/* 요약 카운터 */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        {columns.map((col) => (
          <Card key={col.status} className={`border-2 ${col.color} shadow-md`}>
            <CardHeader>
              <CardTitle className="text-2xl">{col.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-gray-400">{col.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 칸반 스타일 플레이스홀더 */}
      <div className="grid grid-cols-3 gap-6">
        {columns.map((col) => (
          <div key={col.status} className={`rounded-xl border-2 ${col.color} p-4 min-h-64`}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">{col.label}</h2>
              <Badge className={`text-base px-3 ${col.color}`}>0</Badge>
            </div>
            <div className="space-y-3 opacity-40">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow-sm border">
                  <p className="text-xl text-gray-400">시니어 이름 (준비 중)</p>
                  <p className="text-lg text-gray-300">일자리: —</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-gray-400 text-xl mt-12">
        대시보드 기능은 다음 단계에서 구현됩니다.
      </p>
    </div>
  );
}
