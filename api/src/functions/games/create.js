
import { app } from '@azure/functions';
import * as db from '../../helpers/cosmos.js';

app.http('items-create', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'games',
    handler: async (request, context) => {
       
        context.log('Creating item');

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
        body.createdAt = new Date().toISOString();

        try {
            const result = await db.createItem('games', body);

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