
const isDev =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1';

const apiURL = isDev
    ? "http://localhost:7071/api/"
    : "/api/";

// --- INTERNAL HELPER FUNCTION ---

/**
 * Internal helper for performing HTTP requests with retry, timeout and JSON handling.
 *
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method 
 *        HTTP method to use.
 *
 * @param {string} endpoint 
 *        API endpoint relative to apiURL.
 *
 * @param {object|null} [body=null] 
 *        Optional JSON body for POST/PUT requests.
 *
 * @param {object|null} [params=null] 
 *        Optional query parameters appended to the URL.
 *
 * @param {number} [retries=3] 
 *        Number of retry attempts for timeout or retriable server errors.
 *
 * @param {number} [timeoutMs=5000] 
 *        Timeout in milliseconds before the request is aborted.
 *
 * @returns {Promise<{
 *     success: boolean,
 *     status: number,
 *     data?: any,
 *     error?: string,
 *     endpoint: string,
 *     method: string
 * }>}
 *        A structured response object describing the result.
 *
 * @private
 */
async function apiRequest(method, endpoint, body = null, params = null, retries = 3, timeoutMs = 5000) {
    let attempt = 0;

    while (attempt <= retries) {
        try {
            // Build querystring if needed
            let url = apiURL + endpoint;
            if (params) {
                const qs = new URLSearchParams(params).toString();
                url += '?' + qs;
            }

            const options = {
                method,
                headers: {}
            };

            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }

            // --- TIMEOUT START ---
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            options.signal = controller.signal;
            // --- TIMEOUT END ---

            const response = await fetch(url, options);

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error('API response was not ok');
                error.status = response.status;
                throw error;
            }

            let data = null;
            try {
                data = await response.json();
            } catch {
                // No JSON? Helt greit for DELETE eller 204
            }

            return {
                success: true,
                status: response.status,
                data,
                endpoint,
                method
            };

        } catch (err) {
            const isTimeout = err.name === 'AbortError';
            const isRetriable =
                isTimeout ||
                [429, 500, 502, 503, 504].includes(err.status);

            if (isRetriable && attempt < retries) {
                attempt++;
                const backoff = Math.pow(2, attempt) * 100;
                await new Promise(resolve => setTimeout(resolve, backoff));
                continue;
            }

            return {
                success: false,
                status: err.status || 500,
                error: isTimeout ? 'Request timed out' : err.message,
                endpoint,
                method
            };
        }
    }
}

/**
 * Retrieves all items from the given API endpoint.
 *
 * @param {string} endpoint 
 *        The API endpoint to query.
 *
 * @returns {Promise<object>} 
 *        The API response object from apiRequest().
 */
export async function getAllItems(endpoint) {
    return await apiRequest(
        'GET',
        endpoint
    );
}

/**
 * Retrieves a single item by ID.
 *
 * @param {string} endpoint 
 *        The API endpoint.
 *
 * @param {string|number} id 
 *        The item ID.
 *
 * @param {string|null} [partitionKey=null] 
 *        Optional partition key. Defaults to the ID.
 *
 * @returns {Promise<object>} 
 *        The API response object.
 */
export async function getItemById(endpoint, id, partitionKey = null) {
    return await apiRequest(
        'GET',
        `${endpoint}/${id}`,
        null,
        { partitionKey: partitionKey || id }
    );
}

/**
 * Creates a new item in the database.
 *
 * @param {string} endpoint 
 *        The API endpoint.
 *
 * @param {object} itemData 
 *        The item data to create.
 *
 * @returns {Promise<object>} 
 *        The API response object.
 */
export async function createItem(endpoint, itemData) {
    return await apiRequest(
        'POST',
        endpoint,
        itemData
    );
}

/**
 * Updates an existing item.
 *
 * @param {string} endpoint 
 *        The API endpoint.
 *
 * @param {string|number} id 
 *        The ID of the item to update.
 *
 * @param {object} itemData 
 *        The updated item data.
 *
 * @returns {Promise<object>} 
 *        The API response object.
 */
export async function updateItem(endpoint, id, itemData) {
    return await apiRequest(
        'PUT',
        `${endpoint}/${id}`,
        {
            partitionKey: itemData.partitionKey || id,
            item: itemData
        }
    );
}

/**
 * Deletes an item by ID.
 *
 * @param {string} endpoint 
 *        The API endpoint.
 *
 * @param {string|number} id 
 *        The ID of the item to delete.
 *
 * @param {string|null} [partitionKey=null] 
 *        Optional partition key. Defaults to the ID.
 *
 * @returns {Promise<object>} 
 *        The API response object.
 */
export async function deleteItem(endpoint, id, partitionKey = null) {
    return await apiRequest(
        'DELETE',
        `${endpoint}/${id}`,
        {
            partitionKey: partitionKey || id
        }
    );
}

/**
 * Executes a query against the database.
 *
 * @param {string} endpoint 
 *        The API endpoint.
 *
 * @param {object} queryObject 
 *        The query definition object.
 *
 * @returns {Promise<object>} 
 *        The API response object.
 */
export async function queryItems(endpoint, queryObject) {
    return await apiRequest('POST', `${endpoint}/query`, queryObject);
}
