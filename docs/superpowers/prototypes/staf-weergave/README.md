# TI Studio · Staf-weergave prototypes

Alle staf-componenten voor TI Studio.

## Componenten

| Bestand | Component | Context |
|---|---|---|
| `compact-chip.html` | Compact-chip | Teamkaart, werkbord inline |
| `rijke-rij.html` | Rijke-rij | Drawer detail, kader-overzicht |
| `tabel-rij.html` | Tabel-rij | /personen/staf pagina |
| `hover-historie.html` | Hover-historie | Popover bij hover: huidige koppelingen + seizoenshistorie |
| `staf-drawer.html` | Staf-drawer | Werkbord zijpaneel |
| `index.html` | Catalogus | Overzicht van alle prototypes |

## Design principes

- **Uniforme staf-kaart**: foto + naam + memo — geen teams, geen actief-badge
- **Rol als los koppelelement**: icoon rechts (compact) of swatch met icoon (rijk)
- **Voorgedefinieerde rollen** met vaste iconen: Hoofdcoach, Coach, Trainer, Assistent, Begeleider, Leider, Verzorger
- **Default + quick-edit**: bij koppeling wordt laatste bekende rol automatisch ingevuld
- Staf-accent: oranje (#ff8c00)
- Oranje border-left als herkenning
- Ronde avatars (vs vierkant voor spelers)
- Memo via standaard OW `memo-attention` component
- Hover-historie toont huidige koppelingen boven seizoenshistorie
