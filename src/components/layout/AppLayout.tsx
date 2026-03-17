import AppSidebar from "./AppSidebar";

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
