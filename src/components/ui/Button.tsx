"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "icon";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "rounded-md bg-[#3a4356] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2c3446] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400",
  secondary:
    "rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50",
  icon: "flex h-[30px] w-[30px] items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600",
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`transition ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
