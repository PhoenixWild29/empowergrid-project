const BASE_URL = 'http://localhost:8000';

export interface Project {
  id: string;
  title: string;
  description: string;
  owner_wallet: string;
  total_funding: number;
  status: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  status: string;
  proof_url?: string;
}

export interface Escrow {
  id: string;
  project_id: string;
  amount: number;
  status: string;
}

export interface Portfolio {
  total_invested: number;
  projects: Array<{project_id: string; amount: number; status: string}>;
}

export interface Returns {
  estimated: number;
  realized: number;
}

const authHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export async function getProjects(token?: string): Promise<Project[]> {
  const response = await fetch(`${BASE_URL}/projects`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(`Failed to fetch projects: ${response.statusText}`);
  return response.json();
}

export async function getProject(id: string, token?: string): Promise<Project> {
  const response = await fetch(`${BASE_URL}/projects/${id}`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(`Failed to fetch project: ${response.statusText}`);
  return response.json();
}

export async function getMilestones(projectId: string, token?: string): Promise<Milestone[]> {
  const response = await fetch(`${BASE_URL}/projects/${projectId}/milestones`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(`Failed to fetch milestones: ${response.statusText}`);
  return response.json();
}

export async function completeMilestone(milestoneId: string, proofUrl: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/milestones/${milestoneId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify({ proof_url: proofUrl }),
  });
  if (!response.ok) throw new Error(`Failed to complete milestone: ${response.statusText}`);
}

export async function fundEscrow(projectId: string, amount: number, token: string): Promise<Escrow> {
  const response = await fetch(`${BASE_URL}/escrow/fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token)
    },
    body: JSON.stringify({ project_id: projectId, amount }),
  });
  if (!response.ok) throw new Error(`Failed to fund escrow: ${response.statusText}`);
  return response.json();
}

export async function releaseEscrow(escrowId: string, token: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/escrow/release?escrow_id=${escrowId}`, {
    method: 'POST',
    headers: authHeaders(token)
  });
  if (!response.ok) throw new Error(`Failed to release escrow: ${response.statusText}`);
}

export async function getEscrowStatus(escrowId: string, token?: string): Promise<Escrow> {
  const response = await fetch(`${BASE_URL}/escrow/${escrowId}/status`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(`Failed to fetch escrow status: ${response.statusText}`);
  return response.json();
}

export async function getPortfolio(wallet: string): Promise<Portfolio> {
  const response = await fetch(`${BASE_URL}/investors/${wallet}/portfolio`, { headers: authHeaders(wallet) });
  if (!response.ok) throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
  return response.json();
}

export async function getReturns(wallet: string): Promise<Returns> {
  const response = await fetch(`${BASE_URL}/investors/${wallet}/returns`, { headers: authHeaders(wallet) });
  if (!response.ok) throw new Error(`Failed to fetch returns: ${response.statusText}`);
  return response.json();
}
