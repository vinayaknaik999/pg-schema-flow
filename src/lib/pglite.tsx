"use client";

import { PGlite } from "@electric-sql/pglite";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const PGliteContext = createContext<PGlite | null>(null);

export function PGliteProvider({ children }: { children: ReactNode }) {
    const [db, setDb] = useState<PGlite | null>(null);

    useEffect(() => {
        let mounted = true;
        let pg: PGlite | null = null;

        async function initDB() {
            try {
                // In-memory PGlite instance for now
                if (!db) {
                    pg = await PGlite.create();
                    if (mounted) {
                        setDb(pg);
                        console.log("PGlite initialized");
                    }
                }
            } catch (err) {
                console.error("Failed to initialize PGlite:", err);
            }
        }

        initDB();

        return () => {
            mounted = false;
            // Only close if we created it and it's not being shared/persisted differently
            if (pg) {
                pg.close();
            }
        };
    }, []);

    return (
        <PGliteContext.Provider value={db}>
            {children}
        </PGliteContext.Provider>
    );
}

export function usePGlite() {
    return useContext(PGliteContext);
}
