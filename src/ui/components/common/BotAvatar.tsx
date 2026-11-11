import React from "react";
import { AGENT_BOTS, type AgentId } from "../../utils/agents";

export type BotType = AgentId;

interface BotAvatarProps {
  bot: BotType;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showHalo?: boolean;
}

const SIZES = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
  xl: 60,
};

export function BotAvatar({
  bot,
  size = "md",
  className = "",
  showHalo = false,
}: BotAvatarProps) {
  const px = SIZES[size] || 32;

  switch (bot) {
    case "reader":
      // Reader - Electric Blue Analytical Scanner
      return (
        <div
          className={`bot-avatar-wrapper bot-reader ${className}`.trim()}
          style={{ width: px, height: px }}
          title={AGENT_BOTS.reader.name}
          aria-label={AGENT_BOTS.reader.name}
        >
          <svg viewBox="0 0 100 100" width={px} height={px} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="readerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="readerVisor" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {showHalo && <circle cx="50" cy="50" r="46" fill="#3b82f6" fillOpacity="0.15" />}
            {/* Top antenna & signal bulb */}
            <line x1="50" y1="24" x2="50" y2="10" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="9" r="6" fill="#38bdf8" />
            {/* Ears / Sensor cups */}
            <rect x="14" y="38" width="8" height="24" rx="4" fill="#2563eb" />
            <rect x="78" y="38" width="8" height="24" rx="4" fill="#2563eb" />
            {/* Head chassis */}
            <rect x="20" y="22" width="60" height="56" rx="16" fill="url(#readerGrad)" stroke="#60a5fa" strokeWidth="2.5" />
            {/* Wide analytical visor */}
            <rect x="27" y="36" width="46" height="22" rx="7" fill="url(#readerVisor)" />
            {/* Optical scanning lines */}
            <circle cx="40" cy="47" r="5" fill="#ffffff" />
            <circle cx="60" cy="47" r="5" fill="#ffffff" />
            <rect x="33" y="46" width="34" height="2" fill="#bae6fd" opacity="0.8" />
            {/* Mouth data grating */}
            <line x1="36" y1="67" x2="44" y2="67" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="67" x2="52" y2="67" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
            <line x1="56" y1="67" x2="64" y2="67" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );

    case "organiser":
      // Organiser - Emerald Story Weaver
      return (
        <div
          className={`bot-avatar-wrapper bot-organiser ${className}`.trim()}
          style={{ width: px, height: px }}
          title={AGENT_BOTS.organiser.name}
          aria-label={AGENT_BOTS.organiser.name}
        >
          <svg viewBox="0 0 100 100" width={px} height={px} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="orgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            {showHalo && <circle cx="50" cy="50" r="46" fill="#10b981" fillOpacity="0.15" />}
            {/* Twin angled thread antennae */}
            <line x1="36" y1="24" x2="26" y2="10" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="25" cy="9" r="5" fill="#a7f3d0" />
            <line x1="64" y1="24" x2="74" y2="10" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="75" cy="9" r="5" fill="#a7f3d0" />
            {/* Spool cheeks */}
            <circle cx="16" cy="52" r="7" fill="#065f46" stroke="#34d399" strokeWidth="2" />
            <circle cx="84" cy="52" r="7" fill="#065f46" stroke="#34d399" strokeWidth="2" />
            {/* Hexagonal head chassis */}
            <path
              d="M32 24 L68 24 L82 52 L68 80 L32 80 L18 52 Z"
              fill="url(#orgGrad)"
              stroke="#34d399"
              strokeWidth="2.5"
            />
            {/* Gear optical eyes */}
            <circle cx="38" cy="48" r="8" fill="#064e3b" stroke="#6ee7b7" strokeWidth="2" />
            <circle cx="38" cy="48" r="3.5" fill="#ffffff" />
            <circle cx="62" cy="48" r="8" fill="#064e3b" stroke="#6ee7b7" strokeWidth="2" />
            <circle cx="62" cy="48" r="3.5" fill="#ffffff" />
            {/* Interconnecting story thread */}
            <path d="M38 65 Q50 72 62 65" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      );

    case "curator":
      // Curator - Royal Violet Knowledge Librarian
      return (
        <div
          className={`bot-avatar-wrapper bot-curator ${className}`.trim()}
          style={{ width: px, height: px }}
          title={AGENT_BOTS.curator.name}
          aria-label={AGENT_BOTS.curator.name}
        >
          <svg viewBox="0 0 100 100" width={px} height={px} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="curGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
            </defs>
            {showHalo && <circle cx="50" cy="50" r="46" fill="#8b5cf6" fillOpacity="0.15" />}
            {/* Bookmark crest top */}
            <path d="M44 8 L56 8 L56 22 L50 17 L44 22 Z" fill="#c4b5fd" />
            {/* Rounded book-spine chassis */}
            <rect x="22" y="22" width="56" height="58" rx="14" fill="url(#curGrad)" stroke="#a78bfa" strokeWidth="2.5" />
            {/* Scholar spectacles / dual lenses */}
            <rect x="28" y="38" width="18" height="18" rx="5" fill="#2e1065" stroke="#ddd6fe" strokeWidth="2.5" />
            <circle cx="37" cy="47" r="4" fill="#a78bfa" />
            <rect x="54" y="38" width="18" height="18" rx="5" fill="#2e1065" stroke="#ddd6fe" strokeWidth="2.5" />
            <circle cx="63" cy="47" r="4" fill="#a78bfa" />
            <line x1="46" y1="47" x2="54" y2="47" stroke="#ddd6fe" strokeWidth="3" />
            {/* Shelf lines mouth */}
            <rect x="36" y="66" width="28" height="3" rx="1.5" fill="#c4b5fd" />
          </svg>
        </div>
      );

    case "scout":
      // Scout - Cyan / Sky Fast Triage Radar Bot
      return (
        <div
          className={`bot-avatar-wrapper bot-scout ${className}`.trim()}
          style={{ width: px, height: px }}
          title={AGENT_BOTS.scout.name}
          aria-label={AGENT_BOTS.scout.name}
        >
          <svg viewBox="0 0 100 100" width={px} height={px} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scoutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
              <linearGradient id="scoutRadar" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {showHalo && <circle cx="50" cy="50" r="46" fill="#0284c7" fillOpacity="0.18" />}
            {/* Speed antenna */}
            <line x1="50" y1="20" x2="50" y2="10" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="8" r="4" fill="#38bdf8" />
            {/* Aerodynamic helmet chassis */}
            <rect x="22" y="20" width="56" height="54" rx="16" fill="url(#scoutGrad)" stroke="#38bdf8" strokeWidth="2.5" />
            {/* Fast scanner visor */}
            <rect x="28" y="34" width="44" height="20" rx="8" fill="#082f49" stroke="#7dd3fc" strokeWidth="2" />
            {/* Target reticle crosshair */}
            <circle cx="50" cy="44" r="6" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="50" cy="44" r="2.5" fill="#f0f9ff" />
            <line x1="38" y1="44" x2="42" y2="44" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="58" y1="44" x2="62" y2="44" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Triage indicator chevron */}
            <path d="M42 62 L50 67 L58 62" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    case "assistant":
      // Assistant - Indigo Executive Personal Butler Bot
      return (
        <div
          className={`bot-avatar-wrapper bot-assistant ${className}`.trim()}
          style={{ width: px, height: px }}
          title={AGENT_BOTS.assistant.name}
          aria-label={AGENT_BOTS.assistant.name}
        >
          <svg viewBox="0 0 100 100" width={px} height={px} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="asstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3730a3" />
              </linearGradient>
            </defs>
            {showHalo && <circle cx="50" cy="50" r="46" fill="#6366f1" fillOpacity="0.18" />}
            {/* Executive collar & tie top antenna */}
            <circle cx="50" cy="11" r="5" fill="#a5b4fc" stroke="#4f46e5" strokeWidth="2" />
            <rect x="48" y="16" width="4" height="6" fill="#4f46e5" />
            {/* Distinguished curved chassis */}
            <rect x="22" y="22" width="56" height="56" rx="18" fill="url(#asstGrad)" stroke="#818cf8" strokeWidth="2.5" />
            {/* Attentive friendly eyes */}
            <circle cx="38" cy="42" r="6" fill="#1e1b4b" stroke="#c7d2fe" strokeWidth="2" />
            <circle cx="39" cy="41" r="2.5" fill="#c7d2fe" />
            <circle cx="62" cy="42" r="6" fill="#1e1b4b" stroke="#c7d2fe" strokeWidth="2" />
            <circle cx="63" cy="41" r="2.5" fill="#c7d2fe" />
            {/* Valet bow tie on chest */}
            <path d="M42 63 L58 71 L58 63 L42 71 Z" fill="#e0e7ff" stroke="#4338ca" strokeWidth="1.2" />
            <circle cx="50" cy="67" r="2.5" fill="#4338ca" />
          </svg>
        </div>
      );

    case "supervisor":
      // Supervisor - Golden Amber Prompt Sentinel
      return (
        <div
          className={`bot-avatar-wrapper bot-supervisor ${className}`.trim()}
          style={{ width: px, height: px }}
          title={AGENT_BOTS.supervisor.name}
          aria-label={AGENT_BOTS.supervisor.name}
        >
          <svg viewBox="0 0 100 100" width={px} height={px} fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="supGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {showHalo && <circle cx="50" cy="50" r="46" fill="#f59e0b" fillOpacity="0.15" />}
            {/* Guardian beacon light */}
            <circle cx="50" cy="11" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <rect x="47" y="18" width="6" height="8" fill="#b45309" />
            {/* Shield-shaped helmet chassis */}
            <path
              d="M22 26 C22 26 50 18 50 18 C50 18 78 26 78 26 L78 58 C78 72 50 84 50 84 C50 84 22 72 22 58 Z"
              fill="url(#supGrad)"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            {/* Watchful horizontal radar slit visor */}
            <path
              d="M30 44 L70 44 L66 54 L34 54 Z"
              fill="#451a03"
              stroke="#fef3c7"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="49" r="4" fill="#fef08a" />
            {/* Safety chevron badge */}
            <path d="M44 65 L50 71 L56 65" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
  }
}

