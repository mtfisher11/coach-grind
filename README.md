# CoachGrind 🏈⚽🏀🏒

**Be Seen. Be Heard. Be Hired.**  
CoachGrind is a next-generation AI-powered playbook and coaching platform designed for football (and later basketball, soccer, hockey). Our mission is to empower coaches with modern tools that go far beyond traditional whiteboards and Hudl playbooks.

---

## 🚀 Vision & Goals

1. **AI Play Design & Analysis**
   - Coaches can *generate plays by name, style, or description* and see them instantly drawn as crisp SVG diagrams.
   - AI provides **coaching analysis**: what personnel to use, when to call the play, strengths & weaknesses, and how opponents may counter.

2. **Playbook Builder**
   - Organize plays by **Offense, Defense, Special Teams**.
   - Drill down further: **offensive styles → formations → plays → player routes**.
   - Select blocking schemes, WR routes, and protections via dropdowns or natural language.
   - Save plays to your library and export play sheets by situation (down/distance, opponent tendency).

3. **Coach-Ready Explanations**
   - Each play card includes:
     - **What it is**
     - **When to run it**
     - **Personnel groupings**
     - **Strengths / weaknesses**
     - **Best vs. specific defenses or offenses**

4. **Scouting & Game Planning**
   - Build play sheets tailored to:
     - Opponent defenses
     - Down & distance
     - Game tempo
     - Special situations (2-minute drill, red zone, etc.)

5. **Future Video Integration**
   - Upload or tag **game film**.
   - AI will align video with drawn plays for *install teaching* and *player development*.
   - (Currently expensive—deferred until affordable AI video pipelines become feasible.)

---

## 🆚 What Makes CoachGrind Different

- **AI as a Coaching Assistant**  
  Not just diagrams. AI *tutors coaches* on football theory, giving breakdowns in plain English.

- **Full Play Libraries + AI Generation**  
  - Comes with a pre-installed play database.  
  - Coaches can design new plays via chat: *"Trips Right Mesh Half-Slide Right, Z Fast"* → SVG + analysis.

- **SVG-Based Field (No Canvas)**  
  Clean, scalable, and print-ready. Perfect for play sheets, presentations, and PDFs. No pixel blur.

- **Military Precision Meets Coaching**  
  Drawing inspiration from leadership and operations playbooks used in the military, emphasizing discipline, clarity, and situational adaptability.

- **Multi-Sport Expansion**  
  Football first, then expanding to basketball, soccer, hockey with their own play schemas.

---

## 🖥️ Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Styling:** Custom CSS (dark theme with blue accents)
- **State Management:** React hooks (useState, useMemo)
- **Backend:** (Coming soon) Supabase (auth, DB, storage) + FastAPI (AI + WebSocket + REST API)
- **AI Layer:** (Coming soon) GPT-4 / Claude for real-time play generation and analysis
- **Play Diagrams:** SVG (vector graphics, crisp print/export)
- **Export:** Print-ready PDF, direct SVG download

---

## 📂 Core Features Implemented

- ✅ `Field.tsx` → SVG football field renderer with realistic yard lines and hash marks
- ✅ `App.tsx` → Play input + rendering pipeline
- ✅ Formation library with proper offensive line spacing
- ✅ Route concept rendering (Mesh, Smash)
- ✅ Professional dark theme UI
- ✅ Export to PDF functionality

---

## 🎯 Example Play Breakdown

### Input: "Trips Right Mesh Half-Slide Right, Z fast"

**Visual Output:**
- Professional football field with yard lines and hash marks
- Offensive line properly spaced (C, LG, RG, LT, RT)
- Trips formation to the right with correct receiver alignment
- Mesh concept routes with arrows and labels
- Running back swing route option

**Coaching Analysis:**
- **When to Call:** 3rd & 4-8, 2-minute drill, Open field
- **Best Against:** Cover-1 (rub crossers), Cover-2 (hi-low corner/flat), Blitz (shallow hot)
- **QB Reads:** Z shallow first window → X mesh runner → Y corner (hi/low with RB)
- **Strengths:** Beats man coverage with picks, defined QB progression, horizontal stretch
- **Weaknesses:** Zone drops can clog mesh lanes, press coverage disrupts timing

---

## 📖 Roadmap

### Phase 1 (MVP) ✅
- ✅ Play input → SVG field render
- ✅ Export to PDF
- ✅ Basic route concepts (Mesh, Smash)
- ✅ Formation library

### Phase 2 (In Progress)
- 🟡 AI coaching analysis integration
- 🟡 Expanded route concepts (Stick, Flood, Verts, Levels)
- 🟡 More formations (I-Form, Pistol, Spread)
- 🟡 Defensive play diagrams
- 🟡 User accounts and play saving

### Phase 3
- 🔜 AI play generation from natural language
- 🔜 Video integration and play recognition
- 🔜 Team collaboration features
- 🔜 Mobile app

### Phase 4
- 🔜 Basketball plays and diagrams
- 🔜 Soccer formations and tactics
- 🔜 Hockey plays and strategies
- 🔜 Coach marketplace and job board

---

## 📘 Learning Football Language

CoachGrind also functions as a tutor:  
- Explains **terminology** (e.g., *"Spider 2 Y Banana"*)  
- Breaks down **protections, routes, blocking schemes**  
- Teaches the **language of playcalling**—bridging the gap for new coaches or players learning the system.

---

## 📊 Why Now?

- Hudl dominates film but lacks true **AI intelligence** and **interactive tutoring**.
- Coaches need modern, affordable tools that scale from **high school** → **college** → **pro**.
- AI has reached the point where play design, tutoring, and scouting can be automated at scale.

---

## 🛠️ Getting Started (Local Dev)

```bash
git clone https://github.com/mtfisher11/coach-grind.git
cd coach-grind
npm install
npm run dev
```

Then visit: [http://localhost:5173](http://localhost:5173)

---

## 🔮 Future Vision

CoachGrind isn't just a playbook tool—it's an ecosystem:

* **Training Platform**: Teach athletes the *why* behind plays, not just the routes.
* **Analytics Suite**: Break down opponent film with AI.
* **Coach Career Tools**: Tie into a job board + networking system.
* **Publishing Potential**: Books on football schemes, leadership lessons, and AI-enhanced playbooks.

---

## 🙌 Contribution

We're looking for:

* Coaches (to validate schemes)
* Developers (React, Supabase, FastAPI)
* AI engineers (LLM fine-tuning + video AI pipelines)

Pull requests welcome.

---

## 📜 License

MIT © 2025 CoachGrind