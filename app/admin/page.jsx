import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { SearchUsers } from "./SearchUsers";
import { clerkClient } from "@clerk/nextjs/server";
import { removeRole, setRole } from "./_actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Users, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }) {
  if (!checkRole("admin")) {
    redirect("/");
  }

  const query = searchParams?.search;
  const client = await clerkClient();

  const users = query ? (await client.users.getUserList({ query })).data : [];

  return (
    <div className="p-8 pt-28 md:pt-36 lg:pt-28 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Admin Command Center
          </h1>
          <p className="text-gray-500 mt-1 text-base font-medium">
            Manage users, database tools, and global ERP settings.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/shops">
            <Card className="cursor-pointer group hover:shadow-lg hover:border-purple-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">
                    ERP Settings
                  </p>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-purple-700 transition-colors">
                    Manage Locations
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Add or update retail shops and warehouses.
                  </p>
                </div>
                <Store className="text-purple-700 w-10 h-10 group-hover:scale-110 transition-transform shrink-0 ml-4" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/merge-customers">
            <Card className="cursor-pointer group hover:shadow-lg hover:border-blue-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                    Database Tools
                  </p>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                    Merge Customers
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Merge duplicate dealer accounts and transfer ledger history.
                  </p>
                </div>
                <Users className="text-blue-600 w-10 h-10 group-hover:scale-110 transition-transform shrink-0 ml-4" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/inventory-export">
            <Card className="cursor-pointer group hover:shadow-lg hover:border-green-400 border-2 transition-all duration-300 hover:-translate-y-1 bg-white h-full">
              <CardContent className="p-6 md:p-8 flex justify-between items-center h-full">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-green-500 uppercase tracking-widest">
                    Data Export
                  </p>
                  <h3 className="text-lg font-black text-gray-900 group-hover:text-green-700 transition-colors">
                    Export Inventory
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Download full stock master as Excel/CSV.
                  </p>
                </div>
                <Download className="text-green-600 w-10 h-10 group-hover:scale-110 transition-transform shrink-0 ml-4" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <hr className="border-gray-200" />

        {/* User Management Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              User Access & Roles
            </h2>
            <p className="text-gray-500 text-sm mt-0.5 font-medium">
              Search users and assign security authorization levels.
            </p>
          </div>

          <SearchUsers />

          {users.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {users.map((user) => (
                <Card key={user.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {
                            user.emailAddresses.find(
                              (email) => email.id === user.primaryEmailAddressId,
                            )?.emailAddress
                          }
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-700 border-none font-bold px-3 py-1 rounded-lg text-xs"
                      >
                        {user.publicMetadata.role || "No role"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                      <form action={setRole} className="flex-1 min-w-[120px]">
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="role" value="admin" />
                        <Button className="w-full bg-[#522874] hover:bg-[#3d1d56] text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer">
                          Make Admin
                        </Button>
                      </form>

                      <form action={setRole} className="flex-1 min-w-[120px]">
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="role" value="employee" />
                        <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer">
                          Make Employee
                        </Button>
                      </form>

                      <form action={removeRole} className="flex-1 min-w-[120px]">
                        <input type="hidden" name="id" value={user.id} />
                        <Button
                          variant="outline"
                          className="w-full text-red-600 border border-red-200 hover:bg-red-50 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Remove Role
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : query ? (
            <p className="text-sm text-gray-500 italic">No users found matching your search.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
