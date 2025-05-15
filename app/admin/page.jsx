import { redirect } from "next/navigation";
import { checkRole } from "@/utils/roles";
import { SearchUsers } from "./SearchUsers";
import { clerkClient } from "@clerk/nextjs/server";
import { removeRole, setRole } from "./_actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard({ searchParams }) {
  if (!checkRole("admin")) {
    redirect("/");
  }

  const query = searchParams?.search;
  const client = await clerkClient();

  const users = query ? (await client.users.getUserList({ query })).data : [];

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-purple-700 mb-6">
          Admin Dashboard
        </h1>

        <p className="text-muted-foreground mb-8">
          This is the protected admin dashboard restricted to users with the
          <span className="font-semibold text-purple-700"> `admin` </span> role.
        </p>

        <SearchUsers />

        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6 space-y-4">
                <div className="text-xl font-semibold text-gray-800">
                  {user.firstName} {user.lastName}
                </div>

                <div className="text-gray-500">
                  {
                    user.emailAddresses.find(
                      (email) => email.id === user.primaryEmailAddressId
                    )?.emailAddress
                  }
                </div>

                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-700 border-none"
                >
                  {user.publicMetadata.role || "No role"}
                </Badge>

                <div className="flex flex-wrap gap-3 pt-2">
                  <form action={setRole}>
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="role" value="admin" />
                    <Button className="bg-purple-700 hover:bg-purple-800 text-white">
                      Make Admin
                    </Button>
                  </form>

                  <form action={setRole}>
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="role" value="employee" />
                    <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                      Make employee
                    </Button>
                  </form>

                  <form action={removeRole}>
                    <input type="hidden" name="id" value={user.id} />
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-100"
                    >
                      Remove Role
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
