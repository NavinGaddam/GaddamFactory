import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

type AuditRole = 'owner' | 'manager' | 'employee' | 'watchman';
export type AuditActor = { email: string; displayName: string; uid?: string; role?: AuditRole; active?: boolean };

export async function writeAudit(
  actor: AuditActor,
  entity: string,
  summary: string,
  action = 'CREATE',
  severity = 'blue'
) {
  if (!db) return;
  await addDoc(collection(db, 'audit_logs'), {
    actorUid: actor.uid || '',
    actorEmail: actor.email,
    actorName: actor.displayName,
    actorRole: actor.role || '',
    action,
    entity,
    summary,
    severity,
    createdAt: serverTimestamp(),
  });
}
