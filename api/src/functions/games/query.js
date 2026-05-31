import { app } from '@azure/functions';
import * as db from '../../helpers/cosmos.js';

app.http('items-query', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'games/query',
    handler: async (req, context) => {
        
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
            const items = await db.queryItems('games', body);
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
