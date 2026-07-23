export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-accent-light/6 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-accent/5 blur-[90px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
