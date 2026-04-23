import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Import your role-specific components
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ShopkeeperDashboard from "@/components/dashboard/ShopkeeperDashboard";
import DealerDashboard from "@/components/dashboard/DealerDashboard";
import VisitorDashboard from "@/components/dashboard/VisitorDashboard";

// Import our new invisible toast component
import DashboardToasts from "@/components/dashboard/DashboardToasts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Verify Clerk Auth
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // 2. Fetch the true role from your Supabase database
  const dbUser = await prisma.user.findUnique({
    where: { id: clerkUser.id },
    include: { location: true } // <--- FIX 1: MUST INCLUDE LOCATION DATA
  });

  // Failsafe: If they bypassed the sync API somehow, force them through it
  if (!dbUser) {
    redirect("/api/auth/sync");
  }

  // 3. Determine which dashboard to show based on the Prisma Enum
  const role = dbUser.role;

  let DashboardView;
  switch (role) {
    case "ADMIN":
      // Pass the user here if your AdminDashboard needs it!
      DashboardView = <AdminDashboard user={dbUser} />; 
      break;
    case "SHOPKEEPER":
      // <--- FIX 2: PASS THE USER OBJECT HERE!
      DashboardView = <ShopkeeperDashboard user={dbUser} />; 
      break;
    case "DEALER":
      DashboardView = <DealerDashboard user={dbUser} />;
      break;
    case "VISITOR":
    default:
      DashboardView = <VisitorDashboard user={dbUser} />;
  }

  // 4. Render the page
  return (
    <>
      <DashboardToasts />
      {DashboardView}
    </>
  );
}