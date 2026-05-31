import { app } from '@azure/functions';
import * as db from '../../helpers/cosmos.js';

app.http('items-list', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'games',
    handler: async (req, context) => {

        try {
            const query = {
                query: "SELECT * FROM c"
            };

            const items = await db.queryItems('games', query);

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
