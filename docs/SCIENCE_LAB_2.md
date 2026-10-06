# Science Lab 2.0

Funzi's lab layer supports the full inquiry cycle: question → hypothesis → variables → method → repeated trials → measurement uncertainty → graph/model fit → interpretation → conclusion → reflection → portfolio evidence.

## Added architecture
- Virtual lab notebook and trial records
- Instrument resolution and bounded measurement model
- Mean, sample SD, standard error, percent error, uncertainty propagation and linear regression/residuals
- Unknown, fault-finding and discover-the-law challenge modes
- Practical assessment rubric
- Teacher-authored LabSpec model
- Collaboration roles and session state
- CSV/real-data ingestion
- SensorAdapter contract for future micro:bit/Arduino/IoT bridges
- Extensible catalog for physics, chemistry, biology, Earth science, astronomy, microscopy, engineering and computational science
- Portfolio evidence contract

AI may coach, select curriculum context, identify likely misconceptions and explain results. It must not manufacture deterministic measurements, accepted constants, solver outputs or assessment evidence.

## Next production gates
Sensor adapters require explicit device implementations and permission UX. 3D/AR assets require a separate renderer. Real collaborative sessions require server authorization and conflict-safe persistence. Teacher scoring must retain rubric provenance and moderation/audit records.
