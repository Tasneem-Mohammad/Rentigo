import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };
export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}
export function ButtonLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link className={`button button-primary ${className}`} {...props} />;
}
