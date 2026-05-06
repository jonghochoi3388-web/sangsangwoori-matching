import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-5xl font-bold text-blue-800 mb-4 text-center">
        상상우리 일자리 매칭
      </h1>
      <p className="text-2xl text-gray-600 text-center mb-16">
        시니어의 경험을 이어주는 자동 매칭 시스템
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-2 border-blue-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-700">📝 프로필 등록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xl text-gray-600">이름, 지역, 희망 직종, 경력을 입력하세요.</p>
            <Link href="/register">
              <Button className="w-full text-xl py-6 bg-blue-600 hover:bg-blue-700">
                등록하러 가기
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700">🎯 추천 일자리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xl text-gray-600">내 조건에 맞는 일자리를 확인하세요.</p>
            <Link href="/recommendations">
              <Button className="w-full text-xl py-6 bg-green-600 hover:bg-green-700">
                추천 보기
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-700">📊 담당자 대시보드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xl text-gray-600">매칭 현황을 한눈에 관리하세요.</p>
            <Link href="/admin">
              <Button className="w-full text-xl py-6 bg-orange-600 hover:bg-orange-700">
                대시보드 열기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
