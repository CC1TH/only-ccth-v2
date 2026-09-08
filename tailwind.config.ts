import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Embraer Color Palette
        primary: {
          DEFAULT: "#0E1C59", // Navy - สีหลักของ Logo/Header
          light: "#0067B1",   // Corporate Blue - ปุ่ม/ลิงก์
          dark: "#003366",    // Deep Navy - Hover/Active
        },
        secondary: "#F5F7FA", // Surface Light - พื้นหลังรอง
        surface: {
          DEFAULT: "#FFFFFF", // พื้นหลังหลัก
          dark: "#0A0F2E",    // พื้นหลังโหมดมืด/Hero
          soft: "#F5F7FA",    // พื้นหลังนุ่มนวล
        },
        text: {
          primary: "#1A1A2E", // ข้อความหลัก (Gray-800)
          secondary: "#5C6370", // ข้อความรอง (Gray-500)
          soft: "#B0B8C4",    // Placeholder (Gray-300)
        },
        status: {
          success: "#00875A",
          warning: "#E6A817",
          critical: "#D32F2F",
          info: "#0067B1",
        },
      },
      fontFamily: {
        // 🔤 Embraer Typography Stack
        sans: [
          '"EMB Sans"', 
          '"Helvetica Neue"', 
          'Helvetica', 
          'Arial', 
          'sans-serif'
        ],
      },
      fontSize: {
        // 📏 Typography Scale
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-1': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-2': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-3': ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'action': ['0.875rem', { lineHeight: '1.25', letterSpacing: '0.04em', fontWeight: '600', textTransform: 'uppercase' }],
      },
      borderRadius: {
        // 🔲 Engineering Sharpness
        'none': '0',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '16px',
      },
      boxShadow: {
        // 🌑 Technical Elevation
        'emb-1': '0 2px 8px rgba(10, 15, 46, 0.08)',
        'emb-2': '0 4px 16px rgba(10, 15, 46, 0.12)',
        'emb-3': '0 8px 32px rgba(10, 15, 46, 0.16)',
      },
      spacing: {
        // 📐 Generous Whitespace
        'section': '64px',
        'hero': '96px',
      }
    },
  },
  plugins: [],
};
export default config;