// API client for CoachGrind backend
const API_BASE_URL = 'http://localhost:8002/api';

interface PlayAnalysis {
  whenToCall: string[];
  bestAgainst: string[];
  strengths: string[];
  weaknesses: string[];
  coachingPoints: string[];
  qbProgression: string[];
  adjustments?: {
    vsMan: string;
    vsZone: string;
    vsBlitz: string;
  };
  redZone?: string;
  keyMatchups?: string[];
}

interface GeneratedPlay {
  name: string;
  formation: string;
  personnel: string;
  concept: string;
  players: Array<{ id: string; x: number; y: number }>;
  routes: Array<{
    from: string;
    routeType: string;
    path: string;
    label: string;
  }>;
  blocking?: {
    scheme: string;
    assignments: Record<string, string>;
  };
  description: string;
  coachingNotes: string;
}

class CoachGrindAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Analysis endpoints
  async analyzePlay(
    playName: string,
    formation: string,
    personnel: string,
    routes: any[],
    concept?: string
  ): Promise<PlayAnalysis> {
    const result = await this.request('/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({
        play_name: playName,
        formation,
        personnel,
        routes,
        concept,
      }),
    });
    return result.analysis;
  }

  async generatePlay(description: string): Promise<GeneratedPlay> {
    const result = await this.request('/analysis/generate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
    return result.play;
  }

  async suggestCounterPlays(defensiveScheme: string): Promise<any[]> {
    const result = await this.request('/analysis/suggest-counters', {
      method: 'POST',
      body: JSON.stringify({ defensive_scheme: defensiveScheme }),
    });
    return result.suggestions;
  }

  // Play management endpoints
  async getAllPlays(): Promise<any[]> {
    const result = await this.request('/plays/');
    return result.plays;
  }

  async getPlay(playId: string): Promise<any> {
    const result = await this.request(`/plays/${playId}`);
    return result.play;
  }

  async savePlay(
    play: any,
    category: string = 'offense',
    tags: string[] = []
  ): Promise<string> {
    const result = await this.request('/plays/save', {
      method: 'POST',
      body: JSON.stringify({ play, category, tags }),
    });
    return result.play_id;
  }

  async deletePlay(playId: string): Promise<void> {
    await this.request(`/plays/${playId}`, {
      method: 'DELETE',
    });
  }

  async getFormations(): Promise<any[]> {
    const result = await this.request('/plays/library/formations');
    return result.formations;
  }

  async getRouteConcepts(): Promise<any[]> {
    const result = await this.request('/plays/library/concepts');
    return result.concepts;
  }

  // Playbook endpoints
  async getPlaybooks(): Promise<any[]> {
    const result = await this.request('/playbook/');
    return result.playbooks;
  }

  async createPlaybook(
    name: string,
    team?: string,
    season?: string,
    description?: string
  ): Promise<string> {
    const result = await this.request('/playbook/create', {
      method: 'POST',
      body: JSON.stringify({ name, team, season, description }),
    });
    return result.playbook_id;
  }

  async addPlayToPlaybook(playbookId: string, playId: string): Promise<void> {
    await this.request(`/playbook/${playbookId}/add-play`, {
      method: 'POST',
      body: JSON.stringify({ play_id: playId }),
    });
  }

  async createPlaySheet(
    name: string,
    situation: string,
    playIds: string[]
  ): Promise<string> {
    const result = await this.request('/playbook/sheets/create', {
      method: 'POST',
      body: JSON.stringify({ name, situation, play_ids: playIds }),
    });
    return result.sheet_id;
  }

  async getPlaySheets(): Promise<any[]> {
    const result = await this.request('/playbook/sheets');
    return result.sheets;
  }

  async exportPlaybook(playbookId: string, format: string = 'pdf'): Promise<any> {
    const result = await this.request(`/playbook/export/${playbookId}?format=${format}`);
    return result;
  }

  // Auth endpoints
  async signup(
    email: string,
    password: string,
    name: string,
    team?: string,
    role: string = 'coach'
  ): Promise<any> {
    const result = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, team, role }),
    });
    this.token = result.session_token;
    return result;
  }

  async login(email: string, password: string): Promise<any> {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = result.session_token;
    return result;
  }

  async logout(): Promise<void> {
    if (this.token) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ session_token: this.token }),
      });
      this.token = null;
    }
  }

  async getProfile(): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    const result = await this.request(`/auth/profile?session_token=${this.token}`);
    return result.user;
  }

  async updateProfile(name: string, team?: string, role?: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    await this.request(`/auth/profile?session_token=${this.token}`, {
      method: 'PUT',
      body: JSON.stringify({ name, team, role }),
    });
  }
}

export const coachGrindAPI = new CoachGrindAPI();
export type { PlayAnalysis, GeneratedPlay };