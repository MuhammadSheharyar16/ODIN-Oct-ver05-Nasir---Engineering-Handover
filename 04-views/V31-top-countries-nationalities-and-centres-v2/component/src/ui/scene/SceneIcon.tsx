import {
  ArrowLeftRight, BadgeCheck, Building2, CalendarCheck, CircleCheck, CircleDashed, CircleX, Clock, CloudUpload,
  CreditCard, FileText, FileUp, Fingerprint, FolderCheck, Globe, Hourglass, Info, Layers, MonitorSmartphone,
  ScanSearch, Trophy, Users, type LucideIcon,
} from 'lucide-react';
import type { IconName } from '../../odin/types';

const MAP: Record<IconName, LucideIcon> = {
  applications: FileText,
  clock: Clock,
  approved: CircleCheck,
  rejected: CircleX,
  closure: CircleDashed,
  processing: Hourglass,
  globe: Globe,
  centre: Building2,
  revenue: Layers,
  compare: ArrowLeftRight,
  ranking: Trophy,
  online: MonitorSmartphone,
  info: Info,
  submit: FileUp,
  payment: CreditCard,
  review: ScanSearch,
  upload: CloudUpload,
  biometric: Fingerprint,
  calendar: CalendarCheck,
  checkin: BadgeCheck,
  documents: FolderCheck,
  people: Users,
};

export function SceneIcon({ name, className }: { name: IconName; className?: string }) {
  const I = MAP[name] ?? Info;
  return <I className={className} strokeWidth={1.7} aria-hidden />;
}
