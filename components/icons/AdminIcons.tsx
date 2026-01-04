import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const baseIconProps = (props: IconProps): IconProps => ({
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

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M7.5 5.5h9v3.5c0 2.5-2 4.5-4.5 4.5S7.5 11.5 7.5 9V5.5Z" />
      <path d="M9 15.5h6v2.5H9z" />
      <path d="M10.5 18h3v1.5h-3z" />
      <path d="M8.5 19.5h7" />
      <path d="M10.5 5.5V4a1.5 1.5 0 0 1 1.5-1.5h0a1.5 1.5 0 0 1 1.5 1.5v1.5" />
    </svg>
  );
}

export function WalkIcon(props: IconProps) {
  // Ionicons "walk" icon - exact SVG from Ionicons
  return (
    <svg 
      width={props.width || 18} 
      height={props.height || 18} 
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={props.style}
    >
      <path d="M312.55,479.9l-56.42-114-44.62-57A72.37,72.37,0,0,1,201.45,272V143.64H217a40,40,0,0,1,40,40V365.85"/>
      <path d="M127.38,291.78V217.71s37-74.07,74.07-74.07"/>
      <path d="M368.09,291.78a18.49,18.49,0,0,1-10.26-3.11L297.7,250A21.18,21.18,0,0,1,288,232.21v-23.7a5.65,5.65,0,0,1,8.69-4.77l81.65,54.11a18.52,18.52,0,0,1-10.29,33.93Z"/>
      <path d="M171.91,493.47a18.5,18.5,0,0,1-14.83-7.41c-6.14-8.18-4-17.18,3.7-25.92l59.95-74.66a7.41,7.41,0,0,1,10.76,2.06c1.56,2.54,3.38,5.65,5.19,9.09,5.24,9.95,6,16.11-1.68,25.7-8,10-52,67.44-52,67.44C180.38,492.75,175.77,493.47,171.91,493.47Z"/>
      <circle cx="257" cy="69.56" r="37.04" strokeWidth="16"/>
    </svg>
  );
}

export function NutritionIcon(props: IconProps) {
  // Ionicons "nutrition" icon - exact SVG from Ionicons (apple)
  return (
    <svg 
      width={props.width || 18} 
      height={props.height || 18} 
      viewBox="0 0 512 512"
      fill="currentColor"
      style={props.style}
    >
      <path d="M439,166.29c-18.67-32.57-47.46-50.81-85.57-54.23-20.18-1.8-39,3.37-57.23,8.38C282.05,124.33,268.68,128,256,128s-26-3.68-40.06-7.57c-18.28-5-37.18-10.26-57.43-8.36C122.12,115.48,93,134.18,74.2,166.15,56.82,195.76,48,236.76,48,288c0,40.4,15,90.49,40,134,12.82,22.25,47,74,87.16,74,30.77,0,47.15-9.44,59.11-16.33,8.3-4.78,13.31-7.67,21.69-7.67s13.39,2.89,21.69,7.67C289.65,486.56,306,496,336.8,496c40.17,0,74.34-51.76,87.16-74,25.07-43.5,40-93.59,40-134C464,235.43,455.82,195.62,439,166.29ZM216,352c-13.25,0-24-21.49-24-48s10.75-48,24-48,24,21.49,24,48S229.25,352,216,352Zm80,0c-13.25,0-24-21.49-24-48s10.75-48,24-48,24,21.49,24,48S309.25,352,296,352Z"/>
      <path d="M265.1,111.93c13.16-1.75,37.86-7.83,58.83-28.79a98,98,0,0,0,28-58.2A8,8,0,0,0,343.38,16c-12.71.95-36.76,5.87-58.73,27.85A97.6,97.6,0,0,0,256,103.2,8,8,0,0,0,265.1,111.93Z"/>
    </svg>
  );
}

export function BarbellIcon(props: IconProps) {
  // Ionicons "barbell" icon - exact SVG from Ionicons
  return (
    <svg 
      width={props.width || 18} 
      height={props.height || 18} 
      viewBox="0 0 512 512"
      fill="currentColor"
      style={props.style}
    >
      <path d="M467,176a29.94,29.94,0,0,0-25.32,12.5,2,2,0,0,1-3.64-1.14V150.71c0-20.75-16.34-38.21-37.08-38.7A38,38,0,0,0,362,150v82a2,2,0,0,1-2,2H152a2,2,0,0,1-2-2V150.71c0-20.75-16.34-38.21-37.08-38.7A38,38,0,0,0,74,150v37.38a2,2,0,0,1-3.64,1.14A29.94,29.94,0,0,0,45,176c-16.3.51-29,14.31-29,30.62v98.72c0,16.31,12.74,30.11,29,30.62a29.94,29.94,0,0,0,25.32-12.5A2,2,0,0,1,74,324.62v36.67C74,382,90.34,399.5,111.08,400A38,38,0,0,0,150,362V280a2,2,0,0,1,2-2H360a2,2,0,0,1,2,2v81.29c0,20.75,16.34,38.21,37.08,38.7A38,38,0,0,0,438,362V324.62a2,2,0,0,1,3.64-1.14A29.94,29.94,0,0,0,467,336c16.3-.51,29-14.31,29-30.62V206.64C496,190.33,483.26,176.53,467,176Z"/>
    </svg>
  );
}

export function FitnessIcon(props: IconProps) {
  // Ionicons "pulse" icon - heart rate monitor for cardio (heart with pulse line)
  return (
    <svg 
      width={props.width || 18} 
      height={props.height || 18} 
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={props.style}
    >
      <path d="M352.92,80C288,80,256,144,256,144s-32-64-96.92-64C106.32,80,64.54,124.14,64,176.81c-1.1,109.33,86.73,187.08,183,252.42a16,16,0,0,0,18,0c96.26-65.34,184.09-143.09,183-252.42C447.46,124.14,405.68,80,352.92,80Z"/>
      <polyline points="48 256 160 256 208 160 256 320 304 224 336 288 464 288"/>
    </svg>
  );
}

export function BoatIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M4.5 16.5c1.5-1 3.5-1.5 5.5-1.5s4 .5 5.5 1.5" />
      <path d="M4.5 16.5l-2-3 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 3" />
      <path d="M8.5 13.5h7" />
      <path d="M10.5 10.5l1-2 1 2" />
    </svg>
  );
}

export function SnowIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <path d="M12 4.5v15" />
      <path d="M8.5 8.5l3.5-4 3.5 4" />
      <path d="M8.5 15.5l3.5 4 3.5-4" />
      <path d="M6 12h12" />
      <path d="M9 6l6 12" />
      <path d="M15 6l-6 12" />
    </svg>
  );
}

export function BicycleIcon(props: IconProps) {
  return (
    <svg {...baseIconProps(props)}>
      <circle cx="7.5" cy="17.5" r="3" />
      <circle cx="16.5" cy="17.5" r="3" />
      <path d="M10.5 17.5h6" />
      <path d="M12 4.5l-2 4h3l2-4" />
      <path d="M14.5 8.5l2 9" />
      <path d="M9.5 8.5l-2 9" />
    </svg>
  );
}
