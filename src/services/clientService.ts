import type { Client } from "@/types";
import { initClients } from "@/data/mockData";
export interface ClientService { list(): Client[]; findById(id: string): Client | undefined; }
export const clientService: ClientService = { list: () => [...initClients], findById: id => initClients.find(client => client.id === id) };
