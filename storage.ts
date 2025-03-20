import { Storage } from "@plasmohq/storage"

// Define the credentials interface
export interface Credentials {
  email: string
  password: string
  autoFillEnabled: boolean
}

// Default credentials
export const defaultCredentials: Credentials = {
  email: "",
  password: "",
  autoFillEnabled: true
}

// Create a storage instance
export const storage = new Storage()

// Function to save credentials
export async function saveCredentials(credentials: Credentials): Promise<void> {
  await storage.set("credentials", credentials)
}

// Function to get credentials
export async function getCredentials(): Promise<Credentials> {
  const credentials = await storage.get<Credentials>("credentials")
  return credentials || defaultCredentials
}

// Function to check if credentials are set
export async function hasCredentials(): Promise<boolean> {
  const credentials = await getCredentials()
  return credentials.email !== "" && credentials.password !== ""
}