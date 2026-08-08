export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon identifier or emoji
  color: string; // CSS color variable or hex for glow styling
  gradient: string; // CSS linear-gradient background values
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "sheriff",
    title: "Sheriff",
    description: "Link your verified Riot ID (name#tag) to fetch live stats on your profile.",
    icon: "ShieldAlert",
    color: "var(--accent-cyan)",
    gradient: "linear-gradient(135deg, #00f0ff 0%, #0072ff 100%)"
  },
  {
    id: "team_player",
    title: "Team Player",
    description: "Join a team roster or create a team as captain to play bracket matches.",
    icon: "Users",
    color: "var(--accent-violet)",
    gradient: "linear-gradient(135deg, #b5179e 0%, #7209b7 100%)"
  },
  {
    id: "first_blood",
    title: "First Blood",
    description: "Secure your first match victory in a registered tournament.",
    icon: "Trophy",
    color: "var(--accent-green)",
    gradient: "linear-gradient(135deg, #00ff87 0%, #60efff 100%)"
  },
  {
    id: "comeback_king",
    title: "Comeback King",
    description: "Win a match after trailing in scores, resolving a dispute, or claiming forfeit.",
    icon: "Award",
    color: "var(--accent-gold)",
    gradient: "linear-gradient(135deg, #ffb703 0%, #fb8500 100%)"
  },
  {
    id: "undefeated",
    title: "Undefeated Season",
    description: "Win a tournament and secure the ultimate champion crown.",
    icon: "Sparkles",
    color: "var(--accent-red)",
    gradient: "linear-gradient(135deg, #ff0055 0%, #ff5500 100%)"
  }
];
