# TI Studio · Design Prototypes

Alle UI-componenten voor de **TI Studio** app (`teamindeling.ckvoranjewit.app`).

## Structuur

```
ti-studio/
├── shared/                    # Gedeelde tokens + JS-modules
│   ├── tokens.css             # Alle design tokens — enkele bron
│   ├── icons.js               # Lucide SVG-paden + render helpers
│   └── staf-components.js     # Staf chip, rijke-rij, sectie als functies
├── shell/                     # App-schil: navigatie, homepage, personen
│   ├── ribbon.html
│   ├── homepage.html
│   └── personen.html
├── speler/                    # Speler-componenten
│   ├── compact-chip.html
│   ├── rijke-rij.html
│   ├── tabel-rij.html
│   ├── hover-kaart.html
│   ├── spelerpool-drawer.html
│   └── speler-dialog.html
├── staf/                      # Staf-componenten
│   ├── compact-chip.html
│   ├── rijke-rij.html
│   ├── tabel-rij.html
│   ├── hover-card.html
│   ├── staf-drawer.html
│   └── staf-dialog.html
├── team/                      # Team-componenten
│   ├── team-kaart.html
│   ├── staf-in-teamkaart.html
│   ├── team-drawer.html
│   ├── team-detail-drawer.html
│   └── team-dialog.html
├── index.html                 # Master catalogus
└── README.md                  # Dit bestand
```

## Principes

1. **Eén tokens.css** — alle design tokens in `shared/tokens.css`. Geen per-traject tokens.
2. **Shared JS-modules** — iconen en componenten als functies in `shared/`. Geen copy-paste SVGs.
3. **Eén component per HTML-file** — alle varianten/states in dat ene bestand.
4. **Import via relatief pad** — elk prototype: `<link rel="stylesheet" href="../shared/tokens.css">`.

## Staftypes

| Type | Lucide icoon | CSS kleur | Rolnamen |
|---|---|---|---|
| Technisch | `compass` | `--type-technisch` (oranje) | Hoofdtrainer, Trainer, Assistent-trainer, Coach |
| Medisch | `briefcase-medical` | `--type-medisch` (rood) | Verzorger, Fysiotherapeut |
| Ondersteunend | `shield` | `--type-ondersteunend` (blauw) | Leider, Teammanager, Grensrechter, Begeleider |
