import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../../lib/prisma';
import { getSession } from '../../../../../../lib/session';
import { hasActiveSession } from '../../../../../../lib/auth';
import { groupMemberInputSchema } from '../../../../../../lib/validation/group';
import { loadGroupForAdmin } from '../../../../../../lib/admin';
import type { GroupMemberRecord } from '../../../../../admin/types';

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  const session = await getSession();
  const userId = session.userId;
  const groupId = params.groupId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!groupId) {
    return NextResponse.json({ error: 'ID grup tidak valid' }, { status: 400 });
  }

  const { allowed, exists, classId } = await loadGroupForAdmin(userId, groupId);

  if (!exists) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !classId) {
    return NextResponse.json({ error: 'Akses ke grup ini ditolak' }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 });
  }

  const parsed = groupMemberInputSchema.safeParse(payload);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? 'Permintaan tidak valid' }, { status: 400 });
  }

  const name = parsed.data.name.trim();
  const phoneInput = parsed.data.phone?.trim();
  const phone = phoneInput && phoneInput.length > 0 ? phoneInput : null;

  const created = await prisma.groupMember.create({
    data: {
      groupId,
      name,
      phone
    },
    select: {
      id: true,
      groupId: true,
      name: true,
      phone: true
    }
  });

  return NextResponse.json({ member: serializeMember(created) }, { status: 201 });
}

function serializeMember(member: {
  id: string;
  groupId: string;
  name: string;
  phone: string | null;
}): GroupMemberRecord {
  return {
    id: member.id,
    groupId: member.groupId,
    name: member.name,
    phone: member.phone
  };
}
