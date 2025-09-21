import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dayjs from 'dayjs';
import type { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session/edge';

import prisma from '../../../../lib/prisma';
import { normalizePhoneNumber } from '../../../../lib/auth';
import { verifyOtp } from '../../../../lib/otp';
import { sessionOptions, type SessionData } from '../../../../lib/session';

const verifySchema = z.object({
  phone: z.string().min(6).max(32),
  code: z.string().length(6, 'OTP harus 6 digit')
});

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message ?? 'Permintaan tidak valid'
    }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneNumber(parsed.data.phone);

  if (!normalizedPhone) {
    return NextResponse.json({ error: 'Nomor telepon tidak dikenali' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      phone: normalizedPhone,
      classes: {
        some: {
          role: 'admin'
        }
      }
    },
    select: {
      id: true,
      phone: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'Nomor tidak terdaftar sebagai ketua kelas' }, { status: 404 });
  }

  const latestOtp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!latestOtp) {
    return NextResponse.json({ error: 'Kode OTP belum diminta' }, { status: 400 });
  }

  if (latestOtp.expiresAt && dayjs(latestOtp.expiresAt).isBefore(dayjs())) {
    return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa' }, { status: 400 });
  }

  const isValid = verifyOtp(parsed.data.code, latestOtp.code);

  if (!isValid) {
    return NextResponse.json({ error: 'Kode OTP salah' }, { status: 401 });
  }

  await prisma.otpCode.delete({ where: { id: latestOtp.id } });

  const response = NextResponse.json({ ok: true });
  const session = (await getIronSession(request, response, sessionOptions)) as IronSession & SessionData;

  session.userId = user.id;
  session.phoneNumber = user.phone ?? normalizedPhone;
  await session.save();

  return response;
}
