"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from "@/lib/projects";
import ProjectDashboard from "@/components/ProjectDashboard";
import { FolderOpen } from 'lucide-react';
import { PGliteProvider } from "@/lib/pglite";
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // If we have a current project, redirect to it
    if (currentProjectId) {
      router.push(`/project/${currentProjectId}`);
    } else {
      // Otherwise show dashboard
      setShowDashboard(true);
    }
  }, [currentProjectId, router]);

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Image
          src="/logo.png"
          alt="PGSchemaFlow Logo"
          width={80}
          height={80}
          className="w-20 h-20 object-contain drop-shadow-xl"
        />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">PGSchemaFlow</h1>
      </div>

      {showDashboard && (
        <ProjectDashboard
          isOpen={true}
          onClose={() => { }} // Cannot close on home page, must select/create
        />
      )}
    </main>
  );
}
