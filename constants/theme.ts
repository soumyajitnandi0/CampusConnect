/**
 * Premium Glassmorphism Design System
 * CampusConnect - Student App Theme
 */

export const Theme = {
  // Colors
  colors: {
    // Backgrounds
    background: {
      primary: '#000000',      // Deep black
      secondary: '#0A0A0A',    // Gradient black
      tertiary: '#1A1A1A',    // Card background
      elevated: '#1F1F1F',     // Elevated cards
      surface: '#2A2A2A',     // Surface elements
    },
    
    // Text
    text: {
      primary: '#FFFFFF',     // Pure white
      secondary: '#A7A7A7',   // Secondary grey (updated)
      tertiary: '#CFCFCF',     // Icon grey (updated)
      muted: '#9CA3AF',       // Medium grey
      disabled: '#6B7280',    // Dark grey
    },
    
    // Glassmorphism
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.05)',  // Card glass (updated)
      dark: 'rgba(255, 255, 255, 0.04)',
      border: 'rgba(255, 255, 255, 0.08)',  // Borders (updated)
      borderLight: 'rgba(255, 255, 255, 0.08)',
    },
    
    // Accents
    accent: {
      purple: '#9B59B6',      // Event/club chips
      purpleLight: '#A855F7',
      purpleDark: '#7C3AED',
      green: '#2ECC71',        // Active/following
      greenLight: '#10B981',
      blue: '#2980FF',         // QR/tech elements
      blueLight: '#3B82F6',
      red: '#EF4444',          // Cancel/delete
      orange: '#F97316',       // Warnings
    },
    
    // Status
    status: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Border Radius
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 22,
    xxl: 24,
    full: 9999,
  },
  
  // Typography
  typography: {
    fontFamily: {
      regular: 'System',  // Inter/Manrope/SF Pro Rounded style
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 26,  // Title: 26-30
      '4xl': 30,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { width: 0, height: 5 },  // Updated offset
      shadowOpacity: 1,
      shadowRadius: 30,  // Updated blur
      elevation: 5,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { width: 0, height: 5 },  // Updated offset
      shadowOpacity: 1,
      shadowRadius: 45,  // Updated blur
      elevation: 8,
    },
  },
  
  // Blur
  blur: {
    light: 10,
    medium: 15,
    heavy: 25,
  },
  
  // Icon sizes
  icons: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
  
  // Layout
  layout: {
    padding: {
      horizontal: 20,
      vertical: 14,
    },
    cardPadding: {
      horizontal: 20,
      vertical: 18,
    },
  },
} as const;

