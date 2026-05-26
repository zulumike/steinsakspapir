// api/items-list/index.js
import { app } from '@azure/functions';
import * as db from '../shared/cosmos.js';
import * as auth from '../shared/auth.js';

app.http('items-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'items',
    handler: async (req, context) => {
        const user = auth.getUser(req);

        if (!auth.isAuthenticated(user)) {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        if (!auth.requireRoles(user, auth.ROLE_GROUPS.readItem)) {
            return { status: 403, jsonBody: { error: "Insufficient permissions" } };
        }

        try {
            const query = {
                query: "SELECT * FROM c"
            };

            const items = await db.queryItems('items', query);

            return {
                status: 200,
                jsonBody: items
            };
        } catch (err) {
            context.log("List error:", err);
            return { status: 500, jsonBody: { error: err.message } };
        }
    }
});
