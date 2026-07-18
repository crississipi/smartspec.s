/**
 * Icon Library - Replaces all PNG images with React Icons
 * Provides a centralized location for all icon mappings
 */

import {
  FaUser,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaPlus,
  FaTrash,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaEllipsisV,
  FaLaptop,
  FaQuestionCircle,
  FaArrowRight,
  FaArrowLeft,
  FaChevronRight,
  FaChevronLeft,
  FaSearch,
  FaCog,
  FaBolt,
  FaBox,
  FaShoppingCart,
  FaLink,
  FaExternalLinkAlt,
  FaList,
  FaDatabase,
} from 'react-icons/fa';
import { PiWarningFill } from "react-icons/pi";
import { FcGoogle } from 'react-icons/fc';
import { RiSparkling2Line } from "react-icons/ri";

/**
 * Logo Icon - Replaces favicon.png
 * Uses a simple laptop icon representing SmartSpecs PC building
 */
export const LogoIcon = ({ className = '', style = {} }: { className?: string; style?: React.CSSProperties } = {}) => (
  <RiSparkling2Line className={`logo-icon ${className}`} style={{ fontSize: '2.5rem', ...style }} />
);

/**
 * Icon mapping for commonly used icons throughout the app
 */
export const Icons = {
  // User & Authentication
  User: FaUser,
  LogOut: FaSignOutAlt,
  Google: FcGoogle,

  // Theme & UI
  Moon: FaMoon,
  Sun: FaSun,
  Menu: FaBars,
  Close: FaTimes,
  Settings: FaCog,

  // Actions
  Send: FaPaperPlane,
  Plus: FaPlus,
  Delete: FaTrash,
  Add: FaPlus,
  Edit: FaCog,
  Search: FaSearch,

  // Status & Feedback
  Success: FaCheckCircle,
  Error: FaExclamationTriangle,
  Warning: PiWarningFill,
  Info: FaInfoCircle,
  Question: FaQuestionCircle,

  // Navigation
  ArrowRight: FaArrowRight,
  ArrowLeft: FaArrowLeft,
  ChevronRight: FaChevronRight,
  ChevronLeft: FaChevronLeft,
  More: FaEllipsisV,

  // Hardware & Components
  Laptop: FaLaptop,
  CPU: FaLaptop,
  RAM: FaDatabase,
  Storage: FaList,
  Database: FaDatabase,
  Cooling: FaBolt,
  Motherboard: FaLaptop,
  Power: FaBolt,
  Case: FaBox,
  Link: FaExternalLinkAlt,
  Cart: FaShoppingCart,

  // Logo
  Logo: LogoIcon,
};

/**
 * Icon Props Interface
 */
export interface IconProps {
  className?: string;
  size?: string | number;
  color?: string;
  title?: string;
  onClick?: () => void;
}

/**
 * Component: Icon Renderer
 * Usage: <IconRenderer icon="User" size={20} />
 */
export function IconRenderer({
  icon,
  className = '',
  size = 20,
  color,
  title,
  onClick,
}: IconProps & { icon: keyof typeof Icons }) {
  const IconComponent = Icons[icon];

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in Icons library`);
    return null;
  }

  return (
    <IconComponent
      className={className}
      size={size}
      color={color}
      title={title}
      onClick={onClick}
    />
  );
}

/**
 * Icon sizes for consistent sizing
 */
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;

/**
 * Component Icon Mapping - Specific icons for PC components
 */
export const ComponentIcons = {
  cpu: FaLaptop,
  gpu: FaLaptop,
  ram: FaDatabase,
  storage: FaList,
  motherboard: FaLaptop,
  psu: FaBolt,
  cooler: FaBolt,
  case: FaBox,
  monitor: FaLaptop,
  keyboard: FaCog,
  mouse: FaCog,
  headphones: FaCog,
  default: FaDatabase,
};

/**
 * Get component icon by type
 */
export function getComponentIcon(componentType: string) {
  return (
    ComponentIcons[componentType as keyof typeof ComponentIcons] ||
    ComponentIcons.default
  );
}
