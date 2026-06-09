/**
 * The invite editor is a full-screen experience — bypass the (app) dashboard shell.
 * Auth is still enforced by the parent (app)/layout.tsx Node runtime.
 */
export default function EditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
