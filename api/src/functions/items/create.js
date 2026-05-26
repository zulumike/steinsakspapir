
import { app } from '@azure/functions';
import * as db from '../shared/cosmos.js';
import * as auth from '../shared/auth.js';

app.http('items-create', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const user = auth.getUser(request);

        if (!auth.isAuthenticated(user)) {
            return { status: 401, jsonBody: { error: "Unauthorized" } };
        }

        if (!auth.requireRoles(user, auth.ROLE_GROUPS.createItem)) {
            return { status: 403, jsonBody: { error: "Insufficient permissions" } };
        }

        context.log('Creating item for user:', user.userId);

        let body;
        try {
            body = await request.json();
        } catch {
            return { status: 400, jsonBody: { error: "Invalid JSON" } };
        }
        
        if (typeof body !== "object" || body === null) {
            return { status: 400, jsonBody: { error: "Invalid request body" } };
        }

        // Audit-felter
        body.createdBy = user.userId;
        body.createdAt = new Date().toISOString();

        try {
            const result = await db.createItem('items', body);

            return {
                status: 201,
                jsonBody: result
            };
        } catch (err) {
            context.log('Create item error:', err);
            return { status: 500, jsonBody: { error: err.message } };
        }
    }
});