import OpenAI from 'openai';
import type { RouteAction } from '../lib/supabase';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - move to backend in production
});

export interface PlayGenerationRequest {
  userMessage: string;
  context?: {
    formation?: string;
    situation?: {
      down: number;
      distance: number;
      fieldPosition: string;
    };
    previousPlay?: any;
  };
}

export interface GeneratedPlay {
  formation: string;
  formationDetails: {
    name: string;
    personnel: string;
    positions: Record<string, [number, number]>;
  };
  concept: string;
  protection: string;
  routes: RouteAction[];
  motion?: string;
  analysis: {
    whenToCall: string[];
    bestAgainst: string[];
    strengths: string[];
    weaknesses: string[];
    coachingPoints: string[];
    qbProgression: string[];
  };
  explanation: string;
}

export class OpenAIService {
  private static conversationHistory: any[] = [];

  // Determine which model to use based on request complexity
  private static selectModel(request: PlayGenerationRequest): string {
    const message = request.userMessage.toLowerCase();
    
    // Simple requests - use nano
    if (
      message.split(' ').length < 10 &&
      (message.includes('what is') || 
       message.includes('explain') ||
       message.includes('define') ||
       message.includes('simple'))
    ) {
      console.log('Using GPT-5-nano for simple request');
      return 'gpt-5-nano';
    }
    
    // Medium complexity - use mini
    if (
      message.split(' ').length < 20 ||
      message.includes('basic') ||
      message.includes('standard') ||
      !message.includes('complex') &&
      !message.includes('detailed') &&
      !message.includes('advanced')
    ) {
      console.log('Using GPT-5-mini for medium request');
      return 'gpt-5-mini';
    }
    
    // Complex requests - use full GPT-5
    console.log('Using GPT-5 for complex request');
    return 'gpt-5';
  }

  static async generatePlay(request: PlayGenerationRequest): Promise<GeneratedPlay> {
    // Try with progressively more powerful models if needed
    // Fallback to GPT-4 if GPT-5 models fail
    const models = ['gpt-5-nano', 'gpt-5-mini', 'gpt-5', 'gpt-4-turbo-preview', 'gpt-4'];
    const startModel = this.selectModel(request);
    const startIndex = models.indexOf(startModel);
    
    for (let i = startIndex; i < models.length; i++) {
      try {
        const model = models[i];
        console.log(`Attempting play generation with ${model}`);
        
        // Build the system prompt
        const systemPrompt = this.buildSystemPrompt();
        
        // Add user message to history
        if (i === startIndex) {
          this.conversationHistory.push({ role: 'user', content: request.userMessage });
        }
        
        // Create the completion
        const completionParams: any = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory
          ],
          // Note: GPT-5 models might not support response_format yet
          ...(model.includes('gpt-5') ? {} : { response_format: { type: "json_object" } })
        };
        
        // GPT-5 models have specific requirements
        if (model.includes('gpt-5')) {
          // GPT-5 models only support default temperature (1)
          completionParams.max_completion_tokens = model === 'gpt-5-nano' ? 1000 : 2000;
        } else {
          // GPT-4 and other models can use custom temperature
          completionParams.temperature = 0.7;
          completionParams.max_tokens = 2000;
        }
        
        const completion = await openai.chat.completions.create(completionParams);

        console.log(`${model} raw response:`, completion.choices[0].message.content);
        
        let response;
        try {
          response = JSON.parse(completion.choices[0].message.content || '{}');
        } catch (parseError) {
          console.error(`Failed to parse JSON from ${model}:`, completion.choices[0].message.content);
          throw new Error('Invalid JSON response from model');
        }
        
        // Validate response has required fields
        if (!response.formation || !response.routes || response.routes.length === 0) {
          console.error(`Incomplete response from ${model}:`, response);
          throw new Error('Incomplete response from model');
        }
        
        // Add assistant response to history
        this.conversationHistory.push({ 
          role: 'assistant', 
          content: completion.choices[0].message.content 
        });

        console.log(`Successfully generated play with ${model}`);
        return this.formatPlayResponse(response);
        
      } catch (error) {
        console.error(`Failed with ${models[i]}:`, error);
        
        // If we've tried all models, throw error
        if (i === models.length - 1) {
          throw new Error('Failed to generate play with all available models. The AI models may not be properly configured for play generation.');
        }
        
        // Otherwise, try next model
        console.log(`Escalating to ${models[i + 1]}`);
      }
    }
    
    throw new Error('Failed to generate play');
  }

  static async modifyPlay(modification: string, currentPlay: GeneratedPlay): Promise<GeneratedPlay> {
    // Modifications are usually simple, start with mini
    const models = ['gpt-5-mini', 'gpt-5'];
    
    for (let i = 0; i < models.length; i++) {
      try {
        const model = models[i];
        console.log(`Attempting play modification with ${model}`);
        
        const modificationPrompt = `
          Current play: ${JSON.stringify(currentPlay, null, 2)}
          
          User wants to modify: "${modification}"
          
          Generate the modified play maintaining the same structure.
        `;

        this.conversationHistory.push({ role: 'user', content: modificationPrompt });

        const completionParams: any = {
          model: model,
          messages: [
            { role: 'system', content: this.buildSystemPrompt() },
            ...this.conversationHistory
          ],
          // Note: GPT-5 models might not support response_format yet
          ...(model.includes('gpt-5') ? {} : { response_format: { type: "json_object" } })
        };
        
        // GPT-5 models have specific requirements
        if (model.includes('gpt-5')) {
          // GPT-5 models only support default temperature (1)
          completionParams.max_completion_tokens = 2000;
        } else {
          // Other models can use custom temperature
          completionParams.temperature = 0.7;
          completionParams.max_tokens = 2000;
        }
        
        const completion = await openai.chat.completions.create(completionParams);

        const response = JSON.parse(completion.choices[0].message.content || '{}');
        
        this.conversationHistory.push({ 
          role: 'assistant', 
          content: completion.choices[0].message.content 
        });

        console.log(`Successfully modified play with ${model}`);
        return this.formatPlayResponse(response);
        
      } catch (error) {
        console.error(`Failed with ${models[i]}:`, error);
        
        if (i === models.length - 1) {
          throw new Error('Failed to modify play with all available models');
        }
      }
    }
    
    throw new Error('Failed to modify play');
  }

  private static buildSystemPrompt(): string {
    return `You are an expert football offensive coordinator and play designer. Generate football plays based on user descriptions.

    IMPORTANT: You must respond ONLY with a valid JSON object, no other text before or after.
    The JSON object must contain:
    {
      "formation": "formation_id",
      "formationDetails": {
        "name": "Display name",
        "personnel": "11/12/21/etc",
        "positions": {
          "QB": [600, 380],
          "RB": [600, 420],
          "C": [600, 350],
          "LG": [570, 350],
          "RG": [630, 350],
          "LT": [540, 350],
          "RT": [660, 350],
          "X": [200, 350],
          "Z": [850, 350],
          "Y": [690, 350],
          "F": [750, 350]
        }
      },
      "concept": "concept_name",
      "protection": "protection_scheme",
      "routes": [
        {
          "player_id": "X",
          "action_type": "route",
          "action_value": "post",
          "path": "M200 350 L 300 250"
        }
      ],
      "motion": "optional motion description",
      "analysis": {
        "whenToCall": ["situation 1", "situation 2"],
        "bestAgainst": ["coverage 1", "coverage 2"],
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "coachingPoints": ["point 1", "point 2"],
        "qbProgression": ["read 1", "read 2", "read 3"]
      },
      "explanation": "Natural language explanation of the play"
    }

    Position coordinates:
    - Field is 1200x600 units
    - Line of scrimmage is at y=350
    - X-axis: 100 (left sideline) to 1100 (right sideline)
    - Offensive line spacing: 30 units apart
    - QB: 30 units behind center
    - RB: 70 units behind center

    Route paths use SVG syntax:
    - M = move to (start point)
    - L = line to
    - Q = quadratic curve
    - Example: "M200 350 L 300 250" (straight line from position to endpoint)

    Common formations:
    - trips_right: 3x1 with trips to the right
    - bunch_right: Compressed 3x1
    - empty_3x2: 5 receivers, no RB
    - i_form: FB and HB aligned behind QB
    - strong_right: TE and WR to strong side

    Common concepts:
    - mesh: Crossing routes at 6 yards
    - smash: Corner/hitch combination
    - flood: 3-level vertical stretch
    - stick: Quick game triangle stretch
    - four_verts: Vertical seams

    Common protections:
    - half_slide_right/left: 3-man slide one way
    - bob: Big on big (OL on DL)
    - scat: 5-man protection
    - max_pro: 7-man protection`;
  }

  private static formatPlayResponse(response: any): GeneratedPlay {
    // Ensure all required fields are present
    return {
      formation: response.formation || 'trips_right',
      formationDetails: response.formationDetails || {
        name: 'Trips Right',
        personnel: '11',
        positions: this.getDefaultPositions()
      },
      concept: response.concept || 'mesh',
      protection: response.protection || 'half_slide_right',
      routes: response.routes || [],
      motion: response.motion,
      analysis: {
        whenToCall: response.analysis?.whenToCall || [],
        bestAgainst: response.analysis?.bestAgainst || [],
        strengths: response.analysis?.strengths || [],
        weaknesses: response.analysis?.weaknesses || [],
        coachingPoints: response.analysis?.coachingPoints || [],
        qbProgression: response.analysis?.qbProgression || []
      },
      explanation: response.explanation || 'Generated play based on your request.'
    };
  }

  private static getDefaultPositions(): Record<string, [number, number]> {
    return {
      "QB": [600, 380],
      "RB": [600, 420],
      "C": [600, 350],
      "LG": [570, 350],
      "RG": [630, 350],
      "LT": [540, 350],
      "RT": [660, 350],
      "X": [200, 350],
      "Z": [850, 350],
      "Y": [690, 350],
      "F": [750, 350]
    };
  }

  static clearConversation() {
    this.conversationHistory = [];
  }

  static async askCoachingQuestion(question: string): Promise<string> {
    // Simple questions use nano
    const isSimple = question.split(' ').length < 15 && 
                     !question.includes('explain in detail') &&
                     !question.includes('comprehensive');
    
    // Try GPT-5 models first, then fallback to GPT-4
    const models = isSimple ? ['gpt-5-nano', 'gpt-4-turbo-preview'] : ['gpt-5-mini', 'gpt-4'];
    
    for (const model of models) {
      console.log(`Trying ${model} for coaching question`);
      
      try {
      const completionParams: any = {
        model: model,
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert football coach. Answer coaching questions concisely and accurately.' 
          },
          { role: 'user', content: question }
        ]
      };
      
      // GPT-5 models have specific requirements
      if (model.includes('gpt-5')) {
        // GPT-5 models only support default temperature (1)
        completionParams.max_completion_tokens = isSimple ? 300 : 500;
      } else {
        // Other models can use custom temperature
        completionParams.temperature = 0.7;
        completionParams.max_tokens = isSimple ? 300 : 500;
      }
      
      const completion = await openai.chat.completions.create(completionParams);

        return completion.choices[0].message.content || 'I need more information to answer that question.';
      } catch (error) {
        console.error(`Failed with ${model}:`, error);
        if (model === models[models.length - 1]) {
          throw new Error('Failed to get coaching advice from all available models.');
        }
        // Try next model
      }
    }
    
    throw new Error('Failed to get response from AI.');
  }
}