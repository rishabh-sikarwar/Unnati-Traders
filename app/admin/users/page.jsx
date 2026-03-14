import { prisma } from "@/lib/prisma";
import UpdateUser from "@/components/admin/update-user";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: { location: true },
  });

  const locations = await prisma.location.findMany();

  return (
    <div className="p-8 pt-24 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Manage Users</h1>

        <table className="w-full bg-white shadow rounded">
          <thead className="border-b">
            <tr>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Mobile</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Shop</th>
              <th className="p-4 text-left">Update</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">{user.fullName}</td>
                <td className="p-4">{user.mobile}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">{user.location?.name}</td>

                <td className="p-4">
                  <UpdateUser user={user} locations={locations} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
