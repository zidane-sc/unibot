import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import dayjs from 'dayjs';

import prisma from '../../../../lib/prisma';
import { normalizePhoneNumber } from '../../../../lib/auth';
import { hashOtp } from '../../../../lib/otp';
import { callWorkerApi } from '../../../../lib/wa-client';

const requestSchema = z.object({
  phone: z.string().min(6, 'Nomor tidak valid').max(32)
});

const OTP_TTL_MINUTES = 3;

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message ?? 'Permintaan tidak valid'
    }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneNumber(parsed.data.phone);

  if (!normalizedPhone) {
    return NextResponse.json({ error: 'Nomor telepon tidak dikenali' }, { status: 400 });
  }

  const adminUser = await prisma.user.findFirst({
    where: {
      phone: normalizedPhone,
      classes: {
        some: {
          role: 'admin'
        }
      }
    },
    select: {
      id: true
    }
  });

  if (!adminUser) {
    return NextResponse.json({ error: 'Nomor tidak terdaftar sebagai ketua kelas' }, { status: 404 });
  }

  await prisma.otpCode.deleteMany({
    where: {
      userId: adminUser.id
    }
  });

  const code = generateOtp();
  const expiresAt = dayjs().add(OTP_TTL_MINUTES, 'minute').toDate();

  await prisma.otpCode.create({
    data: {
      userId: adminUser.id,
      code: hashOtp(code),
      expiresAt
    }
  });

  try {
    await callWorkerApi({
      path: '/api/otp/send',
      body: {
        phone: normalizedPhone,
        code,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Gagal mengirim OTP via worker', error);
    return NextResponse.json({
      error: 'Gagal mengirim kode OTP. Coba lagi beberapa saat.'
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Kode OTP telah dikirim ke WhatsApp kamu.',
    debug: process.env.NODE_ENV !== 'production' ? { code } : undefined
  });
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
