import { PGlite } from "@electric-sql/pglite";
import { TableNode } from "./store";
import { Edge, MarkerType } from "@xyflow/react";

export async function parseSqlToSchema(sql: string): Promise<{ nodes: TableNode[]; edges: Edge[] }> {
    const db = new PGlite();

    try {
        // 1. Execute the user's SQL to build the schema in memory
        await db.exec(sql);

        // 2. Query Information Schema for Tables
        const tablesRes = await db.query<{ table_name: string }>(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
        `);

        const nodes: TableNode[] = [];
        const edges: Edge[] = [];

        // 3. For each table, get columns and constraints
        for (const row of tablesRes.rows) {
            const tableName = row.table_name;
            const nodeId = crypto.randomUUID();

            // Get Columns
            const columnsRes = await db.query<{ column_name: string; data_type: string; is_nullable: string }>(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);

            // Get Primary Keys
            const pkRes = await db.query<{ column_name: string }>(`
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = $1
            `, [tableName]);

            const pks = new Set(pkRes.rows.map(r => r.column_name));

            // Get Unique Constraints
            const uniqueRes = await db.query<{ column_name: string }>(`
                SELECT kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'UNIQUE'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = $1
            `, [tableName]);

            const uniques = new Set(uniqueRes.rows.map(r => r.column_name));

            // Map PG types to our types (simplification)
            const mapType = (pgType: string): string => {
                if (pgType.includes('int')) return 'integer';
                if (pgType.includes('char') || pgType.includes('text')) return 'text';
                if (pgType.includes('bool')) return 'boolean';
                if (pgType.includes('date') || pgType.includes('time')) return 'timestamp';
                if (pgType === 'uuid') return 'uuid';
                if (pgType === 'json' || pgType === 'jsonb') return 'jsonb';
                return 'text'; // Fallback
            };

            const columns = columnsRes.rows.map(col => ({
                id: crypto.randomUUID(),
                name: col.column_name,
                type: mapType(col.data_type) as any,
                isPk: pks.has(col.column_name),
                isNullable: col.is_nullable === 'YES',
                isUnique: uniques.has(col.column_name),
            }));

            nodes.push({
                id: nodeId,
                type: 'table',
                position: { x: 0, y: 0 }, // Layout will handle this
                data: {
                    name: tableName,
                    columns,
                },
            });
        }

        // 4. Get Foreign Keys (Edges)
        const fkRes = await db.query<{
            constraint_name: string;
            table_name: string;
            column_name: string;
            foreign_table_name: string;
            foreign_column_name: string;
        }>(`
            SELECT
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
        `);

        for (const row of fkRes.rows) {
            const sourceTable = nodes.find(n => n.data.name === row.foreign_table_name); // Referenced table
            const targetTable = nodes.find(n => n.data.name === row.table_name); // Table with FK

            if (sourceTable && targetTable) {
                const sourceCol = sourceTable.data.columns.find(c => c.name === row.foreign_column_name);
                const targetCol = targetTable.data.columns.find(c => c.name === row.column_name);

                if (sourceCol && targetCol) {
                    const edgeId = `e-${sourceTable.id}-${targetTable.id}-${crypto.randomUUID()}`;
                    edges.push({
                        id: edgeId,
                        source: sourceTable.id,
                        target: targetTable.id,
                        sourceHandle: `${sourceCol.id}-source`,
                        targetHandle: `${targetCol.id}-target`,
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#64748b', strokeWidth: 1.5 },
                        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#64748b' } as any, // Type cast for simpler assignment
                    });
                }
            }
        }

        return { nodes, edges };

    } catch (e) {
        console.error("SQL Import Error", e);
        throw e;
    }
}
