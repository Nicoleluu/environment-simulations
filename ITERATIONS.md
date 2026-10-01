# Neighborhood iteration record

## Iteration 1 — scene and local parcel rules

Commit `cae7068` built the initial example; `b7dd732` added GitHub Pages deployment. The version remains on `main`.

The first model stored resident counts directly on parcels, used a constant street-access flag, and supported homes, parks, move-in/out, clearing, and Undo. It established a procedural neighborhood but did not model individual people or network consequences.

## Iteration 2 — relationships and propagated consequences

Branch: `codex/neighborhood-iteration-2`. This is the currently deployed iteration.

| Limitation in iteration 1 | Iteration 2 change | Observable evidence |
| --- | --- | --- |
| Residents were only counts | Identified resident entities reference building IDs | Relocate Riley 20 and observe the same R20 in the destination |
| Homes were only a parcel use | Separate buildings have identity, floors, and capacity | Add a floor; the building becomes taller and capacity changes from 4 to 8 |
| Street access was always true | An open-edge graph connects parcels to a gateway | Close a frontage; move-in and upgrade are blocked |
| Roads were decorative | All 40 links can be closed and reopened | Close both gateway links; all 16 parcels become disconnected |
| Parks had no effect | Nearest reachable park is calculated from graph paths | Remove parks or close streets; coverage and blue routes update |
| Rules were implicit | Guards, explanatory feedback, entity relationships, and rule descriptions | Attempt to clear an occupied house and read the rule violation |
| Edits disappeared on reload | Validated local storage, JSON export, journal, Undo and Redo | Reload after an edit; the model remains |

### Five-minute demonstration

1. Start with Reset → Restore example. Open Model & history to establish the assumptions and the entity relationships. The example has 10 homes, 22 residents, 3 parks, and 40 open links.
2. Select Parcel 10. Add a floor. Observe building B19 at two floors and capacity eight; the building in the scene grows taller.
3. Expand Residents & relationships. Riley 20 (R20) initially lives in P10/B19. Choose P1 and Relocate. P10 empties, P1 gains a resident, population remains 22, and R20 retains the same name and ID. The change log records the relationship update.
4. Select P1 and use Clear parcel → Clear this parcel. The occupied-home rule blocks it and population stays unchanged.
5. Close P1's frontage. Move in and Add floor become unavailable; the inspector states why. Switch to Street connectivity to show the coral parcel and barrier. Undo restores access; Redo closes it again.
6. In Model & history, close links `H:-12:-16` and `V:-16:-12`. These are the two gateway edges. All 16 parcels disconnect despite most local streets staying open. Reopen both to restore access.
7. Reset again. Clear parks on P3 and P8, leaving P9. Switch to Park access and select P16. Its nearest park is now farther away; its served status changes. Add a park to vacant P12 and see the route and coverage improve.
8. Reload to show persistence. Open Model & history and Download model JSON to inspect the entity arrays and reference IDs.

### Validation

Nine automated model tests pass. Browser checks cover road closure, upgrade limits, resident relocation, persistence across reload, whole-network disconnection, Undo/Redo, reset, and analytical layer selection. Desktop and narrow layouts were inspected. Deployment is checked against the pushed branch commit and the public page's iteration-two content.

### Remaining limits and iteration 3

The professor's source semantic specification is still needed before claiming assignment compliance. No third iteration has been implemented. The next iteration should reconcile this explicit model with that specification, then focus on the most meaningful missing relationship or rule. Possible extensions include households, zoning, budgets, or a time-based simulation, but none are asserted as course requirements.

The current model uses schematic graph distance, a fixed map, a single gateway, and one building type. Residents do not physically move along paths. The browser is the persistence boundary; export has no corresponding import yet.
