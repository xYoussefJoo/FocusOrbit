// The workspace draws its own chrome (header, rail, panels) in WorkspaceShell,
// so this layout adds nothing. One component owns the page shell.
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
