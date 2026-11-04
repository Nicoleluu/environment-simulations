# The Wandering Stair

Direction: an inhabitable magical academy, with the stair hall itself as the interface. This replaces the parcel diagram with original procedural three-dimensional architecture.

Palette: abyss #101c29, moonstone #637c8d, limestone #b6ad95, brass #d4b675, candle #ffb56b, spell #91e2d5.
Typography: Georgia for a literary title and destination names; Avenir Next for compact controls and explanations.
Layout: full-screen architectural scene; small title at upper left, quiet project links at upper right, a destination/stair control panel at lower left, live rule legend at right, and travel controls at the foot. On mobile, canvas precedes an inline control panel.

The initial concept was revised to avoid a generic dark dashboard: no repeated cards, charts, metrics or decorative gradients. The memorable element is a cutaway stair hall with distinct architectural levels, operable stairs, visible travelers, arched openings and lighting. Accents are attached to actual portals, paths and active rules.

Functional core: the directed stair graph changes when a flight rotates. Traveling is only allowed on aligned flights; flights cannot rotate while occupied. Three position conditions (adjacent by edge, above by elevation, between by route interior) and three movement conditions (toward target, ascending, past midpoint) are evaluated from state.
