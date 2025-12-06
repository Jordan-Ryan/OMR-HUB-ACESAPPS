import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseIconProps = (props: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...props,
});

export function UsersIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M4.5 18c0-2.7 1.9-4.5 4.5-4.5s4.5 1.8 4.5 4.5" />
      <path d="M15.5 11a2.5 2.5 0 1 0-2-4" />
      <path d="M14.5 12.5c1.9 0 3.5 1.4 3.5 3.1" />
    </svg>
  );
}

export function DumbbellIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M4 9v6" />
      <path d="M7 7.5v9" />
      <path d="M17 7.5v9" />
      <path d="M20 9v6" />
      <path d="M7 12h10" />
    </svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <rect x="6.5" y="5.5" width="11" height="15" rx="2.2" />
      <path d="M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
      <path d="M9.5 11h5" />
      <path d="M9.5 14.5h5" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <rect x="4.5" y="6" width="15" height="14" rx="2.5" />
      <path d="M9 4v3.5" />
      <path d="M15 4v3.5" />
      <path d="M4.5 10.5h15" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M9.5 7.5h9" />
      <path d="M9.5 12h9" />
      <path d="M9.5 16.5h9" />
      <circle cx="6" cy="7.5" r="1.1" />
      <circle cx="6" cy="12" r="1.1" />
      <circle cx="6" cy="16.5" r="1.1" />
    </svg>
  );
}

export function CoachIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M12 4.5 14.1 9l4.6.4-3.6 3.1 1 4.5L12 14.7 7.9 17l1-4.5-3.6-3.1L9.9 9 12 4.5Z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M4.5 12h15" />
      <path d="M12 4.5c2.4 2.3 3.6 4.9 3.6 7.5S14.4 17.7 12 19.5C9.6 17.7 8.4 15.1 8.4 12S9.6 6.8 12 4.5Z" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <rect x="6.5" y="11" width="11" height="8.5" rx="2.2" />
      <path d="M9.5 11V8.5a2.5 2.5 0 0 1 5 0V11" />
      <path d="M12 14.5v2" />
      <circle cx="12" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 7.5v5l3 1.8" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <rect x="4.5" y="5.5" width="15" height="13" rx="2.5" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="11" cy="11" r="5.5" />
      <path d="M15 15l4 4" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M12 20a2 2 0 0 0 1.8-1.1M5.5 14.5V11a6.5 6.5 0 1 1 13 0v3.5" />
      <path d="M5.5 14.5c0 .8-.6 1.5-1.4 1.7L4 16.4c-.5.1-.8.6-.6 1.1.1.3.4.5.7.5h15.8c.6 0 1-.5.9-1.1-.1-.3-.3-.6-.6-.7l-.1-.1c-.8-.2-1.4-.9-1.4-1.7" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v2" />
      <path d="M12 17.5v2" />
      <path d="m7.2 6.2 1.4 1.4" />
      <path d="m15.4 14.4 1.4 1.4" />
      <path d="M4.5 12h2" />
      <path d="M17.5 12h2" />
      <path d="m7.2 17.8 1.4-1.4" />
      <path d="m15.4 9.6 1.4-1.4" />
    </svg>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M12 20s-5-4.5-5-9a5 5 0 1 1 10 0c0 4.5-5 9-5 9Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="8.5" r="3" />
      <path d="M7.5 18c0-2.7 2-4.5 4.5-4.5s4.5 1.8 4.5 4.5" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="9" cy="9" r="2.7" />
      <path d="M4.8 17c0-2.4 1.7-4 4.2-4" />
      <circle cx="16" cy="9.8" r="2.3" />
      <path d="M12.5 17c0-1.9 1.6-3.4 3.5-3.4" />
    </svg>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <rect x="6" y="4.5" width="12" height="15" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h4" />
    </svg>
  );
}

export function CreditsIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 7.5v9" />
      <path d="M7.5 12h9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
