
export type PostgresTypeCategory = 'Numeric' | 'Character' | 'Date/Time' | 'Boolean' | 'Binary' | 'Network' | 'Bit String' | 'Text Search' | 'Geometry' | 'Range' | 'JSON' | 'System' | 'Other';

export interface PostgresType {
    name: string;
    category: PostgresTypeCategory;
    hasLength?: boolean; // precision for numeric, length for char/bit
    hasScale?: boolean;
    description?: string;
}

export const POSTGRES_TYPES: PostgresType[] = [
    // Numeric
    { name: 'smallint', category: 'Numeric', description: 'small-range integer' },
    { name: 'integer', category: 'Numeric', description: 'typical choice for integer' },
    { name: 'bigint', category: 'Numeric', description: 'large-range integer' },
    { name: 'decimal', category: 'Numeric', hasLength: true, hasScale: true, description: 'user-specified precision, exact' },
    { name: 'numeric', category: 'Numeric', hasLength: true, hasScale: true, description: 'user-specified precision, exact' },
    { name: 'real', category: 'Numeric', description: 'variable-precision, inexact' },
    { name: 'double precision', category: 'Numeric', description: 'variable-precision, inexact' },
    { name: 'smallserial', category: 'Numeric', description: 'auto-incrementing small integer' },
    { name: 'serial', category: 'Numeric', description: 'auto-incrementing integer' },
    { name: 'bigserial', category: 'Numeric', description: 'auto-incrementing large integer' },
    { name: 'money', category: 'Numeric', description: 'currency amount' },

    // Character
    { name: 'character varying', category: 'Character', hasLength: true, description: 'variable-length with limit' },
    { name: 'varchar', category: 'Character', hasLength: true, description: 'variable-length with limit' },
    { name: 'character', category: 'Character', hasLength: true, description: 'fixed-length, blank padded' },
    { name: 'char', category: 'Character', hasLength: true, description: 'fixed-length, blank padded' },
    { name: 'text', category: 'Character', description: 'variable unlimited length' },

    // Boolean
    { name: 'boolean', category: 'Boolean', description: 'state of true or false' },

    // Date/Time
    { name: 'timestamp', category: 'Date/Time', hasLength: true, description: 'date and time (no time zone)' },
    { name: 'timestamp with time zone', category: 'Date/Time', hasLength: true, description: 'date and time, including time zone' },
    { name: 'date', category: 'Date/Time', description: 'calendar date (year, month, day)' },
    { name: 'time', category: 'Date/Time', hasLength: true, description: 'time of day (no time zone)' },
    { name: 'time with time zone', category: 'Date/Time', hasLength: true, description: 'time of day, including time zone' },
    { name: 'interval', category: 'Date/Time', hasLength: true, description: 'time span' },

    // Binary
    { name: 'bytea', category: 'Binary', description: 'binary data ("byte array")' },

    // Network
    { name: 'cidr', category: 'Network', description: 'IPv4 or IPv6 network address' },
    { name: 'inet', category: 'Network', description: 'IPv4 or IPv6 host address' },
    { name: 'macaddr', category: 'Network', description: 'MAC address' },
    { name: 'macaddr8', category: 'Network', description: 'MAC address (EUI-64)' },

    // Bit String
    { name: 'bit', category: 'Bit String', hasLength: true, description: 'fixed-length bit string' },
    { name: 'bit varying', category: 'Bit String', hasLength: true, description: 'variable-length bit string' },

    // Text Search
    { name: 'tsvector', category: 'Text Search', description: 'text search document' },
    { name: 'tsquery', category: 'Text Search', description: 'text search query' },

    // Geometry
    { name: 'point', category: 'Geometry', description: 'geometric point' },
    { name: 'line', category: 'Geometry', description: 'geometric line' },
    { name: 'lseg', category: 'Geometry', description: 'geometric line segment' },
    { name: 'box', category: 'Geometry', description: 'geometric box' },
    { name: 'path', category: 'Geometry', description: 'geometric path' },
    { name: 'polygon', category: 'Geometry', description: 'geometric polygon' },
    { name: 'circle', category: 'Geometry', description: 'geometric circle' },

    // JSON
    { name: 'json', category: 'JSON', description: 'textual JSON data' },
    { name: 'jsonb', category: 'JSON', description: 'binary JSON data, decomposed' },

    // Range
    { name: 'int4range', category: 'Range', description: 'range of integer' },
    { name: 'int8range', category: 'Range', description: 'range of bigint' },
    { name: 'numrange', category: 'Range', description: 'range of numeric' },
    { name: 'tsrange', category: 'Range', description: 'range of timestamp without time zone' },
    { name: 'tstzrange', category: 'Range', description: 'range of timestamp with time zone' },
    { name: 'daterange', category: 'Range', description: 'range of date' },

    // System / Other
    { name: 'uuid', category: 'Other', description: 'universally unique identifier' },
    { name: 'xml', category: 'Other', description: 'XML data' },
    { name: 'oid', category: 'System', description: 'numeric object identifier' },
    { name: 'regclass', category: 'System', description: 'object identifier registered class' },
    { name: 'regtype', category: 'System', description: 'object identifier registered type' },
    { name: 'regproc', category: 'System', description: 'object identifier registered procedure' },
    { name: 'regrole', category: 'System', description: 'object identifier registered role' },
    { name: 'regnamespace', category: 'System', description: 'object identifier registered namespace' },
];

export const getTypeCapabilities = (typeName: string) => {
    return POSTGRES_TYPES.find(t => t.name === typeName);
};
