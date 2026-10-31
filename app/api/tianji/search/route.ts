
import { NextResponse } from 'next/server';
import { searchTianji } from '@/lib/tianji/lookup';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const raw = await request.text();

    if (raw.length > 4096) {
      return NextResponse.json(
        { error: '请求过大' },
        { status: 413 }
      );
    }

    const data = JSON.parse(raw) as {
      mode?: unknown;
      terms?: unknown;
    };

    if (
      data.mode !== 'heming' &&
      data.mode !== 'xiaoliuren'
    ) {
      return NextResponse.json(
        { error: '不支持的检索类型' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await searchTianji({
        mode: data.mode,
        terms: Array.isArray(data.terms)
          ? data.terms
          : []
      })
    );
  } catch {
    return NextResponse.json(
      { error: '请求无效' },
      { status: 400 }
    );
  }
}
