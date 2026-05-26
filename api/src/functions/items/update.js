
import { app } from '@azure/functions';
import * as db from '../shared/cosmos.js';
import * as auth from '../shared/auth.js';

app.http('items-update', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'items/{id}',
    handler: async (req, context) => {
        const user = auth.getUser(req);

        if (!auth.isAuthenticated(user)) {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        if (!auth.requireRoles(user, auth.ROLE_GROUPS.updateItem)) {
            return { status: 403, jsonBody: { error: "Insufficient permissions" } };
        }

        const id = req.params.id;

        let body;
        try {
            body = await req.json();
        } catch {
            return { status: 400, jsonBody: { error: "Invalid JSON" } };
        }

        if (!body.partitionKey) {
            return { status: 400, jsonBody: { error: "partitionKey is required" } };
        }

        if (!body.item) {
            return { status: 400, jsonBody: { error: "item is required" } };
        }

        if (typeof body.item !== "object" || body.item === null) {
            return { status: 400, jsonBody: { error: "item must be an object" } };
        }

        const partitionKey = body.partitionKey;
        const item = body.item;

        // Audit
        item.updatedBy = user.userId;
        item.updatedAt = new Date().toISOString();

        try {
            const updated = await db.updateItem('items', id, partitionKey, item);

            return {
                status: 200,
                jsonBody: updated
            };
        } catch (err) {
            context.log("Update error:", err);
            return { status: 404, jsonBody: { error: "Item not found" } };
        }
    }
});
