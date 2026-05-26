// helpers/cosmos.js
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({
    endpoint: process.env.DBEndpoint,
    key: process.env.DBKey
});

const database = client.database(process.env.DBId);

export function container(name) {
    return database.container(name);
}

export async function createItem(containerName, item) {
    const container = database.container(containerName);
    const { resource } = await container.items.create(item);
    return resource;
}

export async function getItem(containerName, id, partitionKey) {
    const container = database.container(containerName);
    const { resource } = await container.item(id, partitionKey).read();
    return resource;
}

export async function updateItem(containerName, id, partitionKey, item) {
    const container = database.container(containerName);
    const { resource } = await container.item(id, partitionKey).replace(item);
    return resource;
}

export async function deleteItem(containerName, id, partitionKey) {
    const container = database.container(containerName);
    await container.item(id, partitionKey).delete();
    return true;
}

export async function queryItems(containerName, querySpec) {
    const container = database.container(containerName);
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
}