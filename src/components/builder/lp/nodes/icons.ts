/**
 * The icons a landing-page element may carry, and the icons the builder draws
 * beside a node in its tree.
 *
 * Two registries because they answer different questions. `ELEMENT_ICONS` is
 * "what may an operator put on a page": a closed set, so an element stores a
 * NAME and only a name in that table renders. A typo or a stale value shows
 * nothing rather than throwing inside a public page render, and the picker in
 * the builder draws the same list, so what can be chosen and what can be drawn
 * are the same set by construction.
 *
 * `treeIcon` is builder chrome only. Letting the two lists merge is how a page
 * ends up able to render an icon nobody can pick.
 */

import {
  Activity, AlertTriangle, AlignLeft, ArrowRight, Award, BadgeCheck, Banknote, Building2,
  CalendarClock, Car, Check, CheckCircle2, Circle, CircleDollarSign, ClipboardList, Clock,
  DollarSign, Dot, Eye, FileText, Flame, Frame, Gavel, Gem, Handshake, Hash, Heading, HeartPulse,
  HelpCircle, Image as ImageIcon, Layers, Link as LinkIcon, ListOrdered, Lock, MapPin, Megaphone,
  MessageSquare, Minus, MousePointerClick, Phone, Quote, Rocket, Rows3, Scale, Search,
  SeparatorHorizontal, ShieldCheck, Sparkles, Square, Star, Stethoscope, Tag, ThumbsUp, Timer,
  Trophy, Truck, Users, Zap,
  type LucideIcon,
} from 'lucide-react'

export const ELEMENT_ICONS: Record<string, LucideIcon> = {
  AlertTriangle, ArrowRight, Award, BadgeCheck, Banknote, Building2, CalendarClock, Car,
  Check, CheckCircle2, CircleDollarSign, Clock, DollarSign, Eye, FileText, Flame, Gavel,
  Handshake, HeartPulse, Lock, MapPin, MessageSquare, Phone, Scale, Search, ShieldCheck,
  Sparkles, Star, Stethoscope, ThumbsUp, Timer, Trophy, Truck, Users, Zap,
}

export const ICON_NAMES = Object.keys(ELEMENT_ICONS)

export const iconFor = (name: unknown, fallback: LucideIcon | null = null): LucideIcon | null =>
  (typeof name === 'string' && ELEMENT_ICONS[name]) || fallback

const TREE_ICONS: Record<string, LucideIcon> = {
  Activity, AlignLeft, Award, Check, Circle, ClipboardList, Dot, FileText, Frame, Gem, Hash,
  Heading, HelpCircle, Image: ImageIcon, Layers, Link: LinkIcon, ListOrdered, Megaphone, Minus,
  MousePointerClick, Phone, Quote, Rocket, Rows3, SeparatorHorizontal, Square, Tag, Trophy,
}

export const treeIcon = (name: string | undefined, fallback: LucideIcon = Square): LucideIcon =>
  (name && TREE_ICONS[name]) || fallback
