// api/items-query/index.js
import { app } from '@azure/functions';
import * as db from '../shared/cosmos.js';
import * as auth from '../shared/auth.js';

app.http('items-query', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'items/query',
    handler: async (req, context) => {
        const user = auth.getUser(req);

        if (!auth.isAuthenticated(user)) {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        if (!auth.requireRoles(user, auth.ROLE_GROUPS.readItem)) {
            return { status: 403, jsonBody: { error: "Insufficient permissions" } };
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return { status: 400, jsonBody: { error: "Invalid JSON" } };
        }

        if (!body.query) {
            return { status: 400, jsonBody: { error: "query is required" } };
        }

        try {
            const items = await db.queryItems('items', body);
            return {
                status: 200,
                jsonBody: items
            };
        } catch (err) {
            context.log("Query error:", err);
            return { status: 500, jsonBody: { error: err.message } };
        }
    }
});
