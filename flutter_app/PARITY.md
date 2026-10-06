# React → Flutter parity

Flutter is a second full client for Funzi. Shared security, RAG, generation, trusted assessment, notebooks, challenges and collaboration remain in Firebase/Cloud Functions.

| React surface | Flutter |
|---|---|
| Authentication | Yes |
| Overview/mastery metrics | Yes |
| Tutor | Yes; native speech adapter added |
| Adaptive Experiences | Yes |
| Quiz / flashcards / quests | Yes |
| Generated Science Lab | Yes |
| Deterministic Science | Dart deterministic solver layer |
| Inquiry Lab / notebook | Yes |
| Visual Labs | Yes, draggable structured canvas |
| Mastery | Yes |
| Portfolio | Yes |
| Dynamic Plan | Yes |
| Leaderboard | Yes |
| Teacher summary | Yes, mirrors current React scope |
| Parent summary | Yes, mirrors current React scope |

## Platform-specific adapters

React browser speech maps to speech_to_text/flutter_tts. Web Serial maps to future platform USB/BLE adapters. WebGL maps to a native Flutter 3D renderer; the current Flutter science client retains deterministic model state without pretending WebGL code is portable.

## Parity rule

New learner-facing React functionality should add a Flutter implementation or an explicit platform-adapter issue in the same change. Server business logic must not be duplicated in either frontend.
