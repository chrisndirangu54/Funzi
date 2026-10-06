# Science Experiment Simulation Engine

The simulation engine is a curriculum-grounded virtual lab, not a substitute for required supervised practical work.

## Model
Each simulation contains an objective, hypothesis prompt, apparatus, independent/control variables, measurable outputs, ordered procedure, safety/hazard notes, explanation and curriculum skill ID. Numeric outputs are computed locally from a deliberately restricted arithmetic formula language. AI generates the experiment specification; it does not execute arbitrary code.

## Learning loop
Predict → change one or more variables → run → record observations → compare runs → explain the pattern → submit mastery evidence. A teacher can use simulations before a physical practical, for revision, or where equipment is unavailable.

## Safety
Generated experiments are restricted to low-risk educational simulations. The generation prompt rejects instructions involving dangerous voltages, explosives, weapons, pathogens, toxic substances, uncontrolled combustion or other hazardous procedures. The UI labels the experience as a simulation and does not encourage unsupervised physical replication.

## Expansion
The same schema can drive graph plotting, circuit canvases, ray diagrams, mechanics scenes, ecology populations, genetics models, chemistry concentration/rate models and Earth-science processes. For richer physics, add a deterministic domain solver rather than asking an LLM to invent numerical results.
