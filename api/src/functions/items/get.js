// api/items-get/index.js
import { app } from '@azure/functions';
import * as db from '../shared/cosmos.js';
import * as auth from '../shared/auth.js';

app.http('items-get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'items/{id}',
    handler: async (req, context) => {
        const user = auth.getUser(req);

        if (!auth.isAuthenticated(user)) {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        if (!auth.requireRoles(user, auth.ROLE_GROUPS.readItem)) {
            return { status: 403, jsonBody: { error: "Insufficient permissions" } };
        }

        const id = req.params.id;
        const partitionKey = req.query.get("partitionKey");

        if (!partitionKey) {
            return { status: 400, jsonBody: { error: "partitionKey is required" } };
        }

        try {
            const item = await db.getItem('items', id, partitionKey);

            if (!item) {
                return { status: 404, jsonBody: { error: "Item not found" } };
            }

            return {
                status: 200,
                jsonBody: item
            };
        } catch (err) {
            context.log("Get error:", err);
            return { status: 404, jsonBody: { error: "Item not found" } };
        }
    }
});
