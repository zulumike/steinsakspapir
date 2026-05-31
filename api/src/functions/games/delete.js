
import { app } from '@azure/functions';
import * as db from '../../helpers/cosmos.js';

app.http('items-delete', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'games/{id}',
    handler: async (req, context) => {
        
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
            await db.deleteItem('games', id, body.partitionKey);
            return { status: 204 };
        } catch (err) {
            context.log("Delete error:", err);
            return { status: 404, jsonBody: { error: "Item not found" } };
        }
    }
});
