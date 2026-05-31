// api/items-get/index.js
import { app } from '@azure/functions';
import * as db from '../../helpers/cosmos.js';

app.http('items-get', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'games/{id}',
    handler: async (req, context) => {

        const id = req.params.id;
        const partitionKey = req.query.get("partitionKey");

        if (!partitionKey) {
            return { status: 400, jsonBody: { error: "partitionKey is required" } };
        }

        try {
            const item = await db.getItem('games', id, partitionKey);

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
