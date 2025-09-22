import { NextRequest, NextResponse } from 'next/server';

import prisma from '../../../../../lib/prisma';
import { getSession } from '../../../../../lib/session';
import { hasActiveSession } from '../../../../../lib/auth';
import { groupMemberInputSchema } from '../../../../../lib/validation/group';
import { loadGroupMemberForAdmin } from '../../../../../lib/admin';
import type { GroupMemberRecord } from '../../../../admin/types';

export async function PATCH(request: NextRequest, { params }: { params: { memberId: string } }) {
  const session = await getSession();
  const userId = session.userId;
  const memberId = params.memberId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!memberId) {
    return NextResponse.json({ error: 'ID anggota tidak valid' }, { status: 400 });
  }

  const { member: existingMember, allowed, exists } = await loadGroupMemberForAdmin(userId, memberId);

  if (!exists) {
    return NextResponse.json({ error: 'Anggota grup tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingMember) {
    return NextResponse.json({ error: 'Akses ke anggota ini ditolak' }, { status: 403 });
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

  const updated = await prisma.groupMember.update({
    where: { id: memberId },
    data: {
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

  return NextResponse.json({ member: serializeMember(updated) });
}

export async function DELETE(_request: NextRequest, { params }: { params: { memberId: string } }) {
  const session = await getSession();
  const userId = session.userId;
  const memberId = params.memberId;

  if (!hasActiveSession(session) || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!memberId) {
    return NextResponse.json({ error: 'ID anggota tidak valid' }, { status: 400 });
  }

  const { member: existingMember, allowed, exists, groupId } = await loadGroupMemberForAdmin(userId, memberId);

  if (!exists) {
    return NextResponse.json({ error: 'Anggota grup tidak ditemukan' }, { status: 404 });
  }

  if (!allowed || !existingMember || !groupId) {
    return NextResponse.json({ error: 'Akses ke anggota ini ditolak' }, { status: 403 });
  }

  await prisma.groupMember.delete({ where: { id: memberId } });

  return NextResponse.json({ ok: true, groupId });
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
