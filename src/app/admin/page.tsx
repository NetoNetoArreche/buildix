import { prisma } from "@/lib/prisma";
import {
  Users,
  FolderKanban,
  Blocks,
  Code2,
  Image,
  FileCode,
  TrendingUp,
  Activity,
} from "lucide-react";

async function getStats() {
  const [
    totalUsers,
    totalProjects,
    totalPages,
    totalComponents,
    totalSnippets,
    totalGalleryImages,
    totalPublishedTemplates,
    recentUsers,
    recentProjects,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.page.count(),
    prisma.uIComponent.count(),
    prisma.codeSnippet.count(),
    prisma.buildixGalleryImage.count(),
    prisma.publishedProject.count({ where: { isPublished: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
    prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { pages: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    totalProjects,
    totalPages,
    totalComponents,
    totalSnippets,
    totalGalleryImages,
    totalPublishedTemplates,
    recentUsers,
    recentProjects,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "bg-green-500",
    },
    {
      title: "Total Pages",
      value: stats.totalPages,
      icon: FileCode,
      color: "bg-purple-500",
    },
    {
      title: "UI Components",
      value: stats.totalComponents,
      icon: Blocks,
      color: "bg-orange-500",
    },
    {
      title: "Code Snippets",
      value: stats.totalSnippets,
      icon: Code2,
      color: "bg-pink-500",
    },
    {
      title: "Gallery Images",
      value: stats.totalGalleryImages,
      icon: Image,
      color: "bg-cyan-500",
    },
    {
      title: "Community Templates",
      value: stats.totalPublishedTemplates,
      icon: FileCode,
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400">
          Overview of your Buildix platform metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{stat.title}</p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Users</h2>
            <a
              href="/admin/users"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              View all
            </a>
          </div>
          <div className="space-y-4">
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-zinc-500">No users yet</p>
            ) : (
              stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-medium text-white">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.name || "No name"}
                      </p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">
                      {user._count.projects} projects
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            <a
              href="/admin/projects"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              View all
            </a>
          </div>
          <div className="space-y-4">
            {stats.recentProjects.length === 0 ? (
              <p className="text-sm text-zinc-500">No projects yet</p>
            ) : (
              stats.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-sm font-medium text-white">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {project.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        by {project.user?.name || project.user?.email || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">
                      {project._count.pages} pages
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <a
            href="/admin/components"
            className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-violet-500"
          >
            <Blocks className="h-8 w-8 text-orange-500" />
            <div>
              <p className="font-medium text-white">Manage Components</p>
              <p className="text-sm text-zinc-400">Add or edit UI components</p>
            </div>
          </a>
          <a
            href="/admin/snippets"
            className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-violet-500"
          >
            <Code2 className="h-8 w-8 text-pink-500" />
            <div>
              <p className="font-medium text-white">Manage Snippets</p>
              <p className="text-sm text-zinc-400">Add or edit code snippets</p>
            </div>
          </a>
          <a
            href="/admin/gallery"
            className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-violet-500"
          >
            <Image className="h-8 w-8 text-cyan-500" />
            <div>
              <p className="font-medium text-white">Manage Gallery</p>
              <p className="text-sm text-zinc-400">Upload gallery images</p>
            </div>
          </a>
          <a
            href="/admin/templates"
            className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-violet-500"
          >
            <FileCode className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="font-medium text-white">Manage Templates</p>
              <p className="text-sm text-zinc-400">Add or edit templates</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
