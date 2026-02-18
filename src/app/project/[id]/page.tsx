"use client";

import { use } from "react";
import Editor from "@/components/Editor";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <Editor projectId={id} />;
}
