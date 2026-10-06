# Deterministic science modules

Funzi separates pedagogy from numerical truth. AI/RAG can select a solver, explain assumptions and generate questions, but the solver computes results.

Implemented solver IDs: circuit (ideal DC series/parallel resistors), mechanics (constant acceleration), projectile, thin_lens, dilution, first_order_kinetics, punnett, logistic_population and radioactive_decay.

Each solver validates inputs and returns metrics plus optional plot-ready series or geometry. This enables repeatable experiments, assessment and comparison of predictions with calculated results.

These are educational models with explicit simplifying assumptions, not engineering/clinical laboratory tools. Future solvers should be deterministic and unit-tested before being exposed in the lab UI.
