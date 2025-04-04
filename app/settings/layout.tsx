export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-6">
      {children}
    </div>
  );
} 