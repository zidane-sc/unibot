import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { phoneFromJid } from '../../../../../lib/auth';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

type IntentPayload = {
  name: string;
  confidence?: number;
  matchedPhrase?: string;
} | null;

type ContextPayload = {
  groupJid: string;
  senderJid: string;
  message?: string;
  classId?: string | null;
};

type RegisterResult = {
  message?: string;
  mentions?: string[];
  register?: { classId: string };
};

export async function POST(request: NextRequest) {
  if (!INTERNAL_SECRET || request.headers.get('x-internal-secret') !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { intent?: IntentPayload; context?: ContextPayload } | null = null;

  try {
    body = (await request.json()) as { intent?: IntentPayload; context?: ContextPayload } | null;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const intent = body?.intent ?? null;
  const context = body?.context;

  if (!context?.groupJid || !context.senderJid) {
    return NextResponse.json({});
  }

  if (intent?.name === 'register') {
    const result = await handleRegister(context);
    return NextResponse.json(result);
  }

  return NextResponse.json({});
}

async function handleRegister(context: ContextPayload): Promise<RegisterResult> {
  const { groupJid, senderJid } = context;

  if (!groupJid.endsWith('@g.us')) {
    return {
      message: 'Perintah register hanya bisa dipakai dari dalam grup.',
      mentions: [senderJid]
    };
  }

  const classCandidate = await prisma.class.findFirst({
    where: {
      groupJid: null
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (!classCandidate) {
    return {
      message: 'Tidak ada kelas yang menunggu aktivasi. Hubungi superadmin.',
      mentions: [senderJid]
    };
  }

  const updated = await prisma.class.update({
    where: {
      id: classCandidate.id
    },
    data: {
      groupJid
    }
  });

  const classLabel = updated.name ?? updated.id;

  return {
    message: `Kelas ${classLabel} berhasil terhubung ke grup ini.`,
    mentions: [senderJid],
    register: {
      classId: updated.id
    }
  };
}
