
import { app } from '@azure/functions';
import * as db from '../shared/cosmos.js';
import * as auth from '../shared/auth.js';

app.http('items-delete', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'items/{id}',
    handler: async (req, context) => {
        const user = auth.getUser(req);

        if (!auth.isAuthenticated(user)) {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        if (!auth.requireRoles(user, auth.ROLE_GROUPS.deleteItem)) {
            return { status: 403, jsonBody: { error: "Insufficient permissions" } };
        }

        const id = req.params.id;

        // Hent body for å få partitionKey
        let body;
        try {
            body = await req.json();
        } catch {
            return { status: 400, jsonBody: { error: "Invalid JSON" } };
        }

        if (!body.partitionKey) {
            return { status: 400, jsonBody: { error: "partitionKey is required" } };
        }

        try {
            await db.deleteItem('items', id, body.partitionKey);
            return { status: 204 };
        } catch (err) {
            context.log("Delete error:", err);
            return { status: 404, jsonBody: { error: "Item not found" } };
        }
    }
});
