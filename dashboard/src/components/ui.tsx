import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props} />;
}
export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline" | "danger";
}) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <section className={`card ${className}`} {...props} />;
}
export function CardHeader(props: HTMLAttributes<HTMLDivElement>) {
  return <header className="card__header" {...props} />;
}
export function CardTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className="card__title" {...props} />;
}
export function CardDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p className="card__description" {...props} />;
}
export function CardContent(props: HTMLAttributes<HTMLDivElement>) {
  return <div className="card__content" {...props} />;
}
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  );
}
export function Empty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty">
      <span>—</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
export function Skeleton() {
  return <div className="skeleton" aria-label="Cargando" />;
}
