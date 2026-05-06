import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RecommendationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-2">추천 일자리</h1>
      <p className="text-xl text-gray-500 mb-8">내 프로필과 가장 잘 맞는 일자리 순서로 보여 드립니다.</p>

      {/* 플레이스홀더 — 매칭 결과 목록 자리 */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2 border-green-100 shadow-md opacity-40">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl text-gray-400">일자리 제목 (준비 중)</CardTitle>
              <Badge className="text-lg px-4 py-1 bg-green-200 text-green-800">
                점수: —
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xl text-gray-400">
                <span>지역: —</span>
                <span>직종: —</span>
                <span>필요 경력: — 년</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-gray-400 text-xl mt-12">
        매칭 기능은 다음 단계에서 구현됩니다.
      </p>
    </div>
  );
}
