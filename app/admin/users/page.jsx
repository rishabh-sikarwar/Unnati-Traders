import { prisma } from "@/lib/prisma";
import UpdateUser from "@/components/admin/update-user";
import { Users } from "lucide-react";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { location: true },
    orderBy: { createdAt: "desc" },
  });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-6 md:px-8 pb-8 pt-28 md:pt-32 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-[#522874] h-8 w-8" />
            Manage Users
          </h1>
          <p className="text-gray-500 mt-1">
            Update employee roles, contact info, and shop assignments.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {/* Added strict min-width to prevent squishing */}
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600 w-1/4">
                    Employee Name
                  </th>
                  <th className="p-4 text-sm font-semibold text-gray-600 w-3/4">
                    Profile Settings & Permissions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                  >
                    {/* User Info Column */}
                    <td className="p-4">
                      <div className="font-bold text-gray-900">
                        {user.fullName || "Unnamed User"}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">
                        ID: {user.id.slice(0, 15)}...
                      </div>
                    </td>

                    {/* Settings Form Column */}
                    <td className="p-4">
                      <UpdateUser user={user} locations={locations} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
