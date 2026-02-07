# Brand Guidelines — Autoscuola ABA

## Colori

### Colori Primari
- **Rosso ABA:** `#D32F2F`
  - Uso: Logo, elementi di accento, call-to-action, anno selezionato nella navbar
  - Variante scura: `#B71C1C` (hover, stati attivi)

### Colori Secondari
- **Grigio scuro:** `#2D2D2D`
  - Uso: Testo titoli, header, elementi di contrasto

### Colori Background
- **Background chiaro:** `#FFF8E1` (giallo post-it pallido)
  - Uso: Background generale della pagina

- **Background post-it:** `#FFEB3B` (giallo post-it classico)
  - Uso: Card principali dei video

- **Background post-it hover:** `#FDD835`
  - Uso: Stato hover dei post-it

### Varianti Post-it (per evitare monotonia)
Assegna deterministicamente una di queste tonalità ad ogni post-it in base al mese o all'indice:
- `#FFEB3B` — Giallo classico
- `#FFF176` — Giallo chiaro
- `#FFE082` — Giallo ambra
- `#FFECB3` — Giallo crema
- `#FFF9C4` — Giallo limone pallido

### Colori Testo
- **Testo primario:** `#212121`
  - Uso: Titoli, testo principale

- **Testo secondario:** `#757575`
  - Uso: Sottotitoli, metadati, durata video

## Font

### Titoli
- **Font Family:** `'Poppins', sans-serif`
- **Weights:**
  - 600 (Semi-Bold) — Titoli sezioni
  - 700 (Bold) — Header principale
- **Uso:** Header, titoli sezioni anno/mese, navbar
- **Import:** `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap');`

### Corpo
- **Font Family:** `'Inter', sans-serif`
- **Weights:**
  - 400 (Regular) — Testo normale
  - 500 (Medium) — Testo enfatizzato, pulsanti
- **Uso:** Testo body, card, descrizioni
- **Import:** `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap');`

## Stile Visivo

### Principi Generali
- **Minimalista:** Interfaccia pulita senza elementi superflui
- **Accessibile:** Contrasto sufficiente, focus visibili, nomi descrittivi
- **Caldo:** Palette basata su giallo e rosso per un'atmosfera accogliente

### Stile Post-it

Ogni card video deve sembrare un **post-it realistico** appeso a una bacheca.

#### Caratteristiche Post-it:
1. **Background:** Uno dei 5 gialli (assegnato deterministicamente, non random)
2. **Dimensioni:**
   - Desktop: ~220×260px
   - Tablet: ~200×240px
   - Mobile: Adattivo (min 160px larghezza)
3. **Bordi:** `border-radius: 2px` (leggero, non troppo arrotondato)
4. **Ombra realistica:**
   ```css
   box-shadow: 2px 2px 6px rgba(0,0,0,0.1),
               4px 4px 12px rgba(0,0,0,0.05);
   ```
5. **Rotazione casuale leggera:**
   - Range: -3° a +3°
   - Calcolata deterministicamente dall'ID video (hash % 7 - 3)
   - CSS: `transform: rotate(Xdeg);`
6. **Effetto angolino piegato** (opzionale ma carino):
   ```css
   .post-it::after {
     content: '';
     position: absolute;
     top: 0;
     right: 0;
     border-width: 0 16px 16px 0;
     border-style: solid;
     border-color: #FDD835 #fff;
   }
   ```

#### Stati Post-it:
- **Default:** Rotazione leggera, ombra sottile
- **Hover:**
  - Rotazione → 0° (si raddrizza)
  - Ombra più pronunciata: `box-shadow: 4px 4px 12px rgba(0,0,0,0.15)`
  - Scale: `transform: scale(1.03) rotate(0deg);`
  - Background: passa al giallo hover `#FDD835`
  - Transizione: `transition: all 0.2s ease-in-out;`
  - Cursore: `cursor: pointer;`
- **Focus (tastiera):**
  - Outline rosso ABA: `outline: 2px solid #D32F2F;`
  - Offset: `outline-offset: 2px;`

### Layout Grid

#### Desktop (>1024px)
- **Colonne:** 5
- **Gap:** 24px
- **Container:** max-width 1400px, centrato

#### Tablet (768px - 1024px)
- **Colonne:** 3
- **Gap:** 20px

#### Mobile (<768px)
- **Colonne:** 2
- **Gap:** 16px
- **Padding laterale:** 16px

### Contenuto Post-it

Dall'alto in basso:
1. **Thumbnail YouTube**
   - Aspect ratio: 16:9
   - Border radius: 2px (top only)
   - Lazy loading: `loading="lazy"`
   - Alt text: titolo video
2. **Titolo lezione**
   - Font: Inter 500
   - Size: 14px (mobile), 15px (desktop)
   - Line height: 1.4
   - Max righe: 2
   - Overflow: `text-overflow: ellipsis;`
   - Color: `#212121`
3. **Durata** (in basso)
   - Font: Inter 400
   - Size: 12px
   - Color: `#757575`
   - Icona orologio + durata formattata (es. "1h 23m")
   - Layout: flex, allineato a sinistra

### Header e Navigation

#### Header Principale
- Background: bianco `#FFFFFF`
- Border-bottom: 1px solid `#E0E0E0`
- Padding: 16px 24px
- Layout: flex, logo a sinistra + titolo centro/destra

#### Logo ABA
- Altezza: 50px (desktop), 40px (mobile)
- Se non disponibile, usa testo "AUTOSCUOLA ABA" in Poppins 700, rosso ABA

#### Year Navigation Bar
- Background: bianco `#FFFFFF`
- Sticky: `position: sticky; top: 0; z-index: 10;`
- Border-bottom: 2px solid `#E0E0E0`
- Tabs: inline-flex, gap 8px
- Tab button:
  - Padding: 12px 20px
  - Font: Poppins 600, 14px
  - Color default: `#757575`
  - Color attivo: `#D32F2F`
  - Border-bottom attivo: 3px solid `#D32F2F`
  - Hover: background `#F5F5F5`

### Sezioni Anno/Mese

#### Divisore Anno
- Font: Poppins 700, 32px (desktop), 24px (mobile)
- Color: `#2D2D2D`
- Margin-top: 48px
- Margin-bottom: 24px
- Border-top: 3px solid `#D32F2F`
- Padding-top: 16px

#### Header Mese
- Font: Poppins 600, 20px (desktop), 18px (mobile)
- Color: `#212121`
- Margin-bottom: 16px
- Layout: Nome mese + conteggio
  - Es: "Dicembre 2024 (18 lezioni)"
  - Conteggio in parentesi color `#757575`

### Barra Statistiche

Mostra sotto la navbar anni, sopra il contenuto:
- Background: `#FFF8E1`
- Padding: 16px 24px
- Layout: flex, 3 stat blocks
- Ogni stat:
  - Icona (emoji o SVG) + testo
  - Font: Inter 500, 14px
  - Color: `#212121`
  - Separatore: `|` in `#757575`

### Elementi UI Aggiuntivi

#### Scroll-to-top Button
- Posizione: fixed, bottom-right (24px dal bordo)
- Shape: cerchio 48×48px
- Background: `#D32F2F`
- Icon: freccia bianca verso l'alto
- Ombra: `box-shadow: 0 4px 12px rgba(0,0,0,0.15);`
- Hover: background `#B71C1C`, scale 1.1
- Visibile solo dopo scroll >500px

#### Search Field (se implementato)
- Border: 1px solid `#E0E0E0`
- Border-radius: 24px (pill shape)
- Padding: 10px 20px
- Font: Inter 400, 14px
- Focus: border `#D32F2F`, outline none
- Icona search a sinistra (lente)

#### Loading Skeleton
- Background: `#F5F5F5`
- Animazione: pulse/shimmer
- Shape: uguale ai post-it (220×260px)

### Footer

- Background: `#2D2D2D`
- Color: `#FFFFFF`
- Padding: 24px
- Text-align: center
- Font: Inter 400, 13px
- Link: color `#FFEB3B` (giallo post-it per contrasto)
- Link hover: underline

## Accessibilità

- **Contrasto minimo:** WCAG AA (4.5:1 per testo normale, 3:1 per testo grande)
- **Focus visibili:** Outline rosso ABA 2px su tutti gli elementi interattivi
- **Alt text:** Tutte le immagini hanno alt text descrittivo
- **Navigazione tastiera:** Tutti i post-it sono navigabili con Tab
- **Touch target:** Minimo 44×44px su mobile (i post-it sono abbastanza grandi)
- **Nomi mesi:** Sempre in italiano (Gennaio, Febbraio, ecc.)

## Animazioni

- **Durata standard:** 0.2s
- **Easing:** ease-in-out
- **Hover effects:** solo transform e box-shadow (performanti)
- **Evita:** animazioni su properties pesanti (width, height, left, top)
- **Smooth scroll:** `scroll-behavior: smooth;` per navigazione anni

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) { ... }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }

/* Large Desktop */
@media (min-width: 1440px) { ... }
```

## Assets

### Logo ABA
- Formato: SVG (preferito) o PNG con sfondo trasparente
- Percorso: `frontend/public/logo-aba.svg`
- Fallback: Testo "AUTOSCUOLA ABA" stilizzato

### Favicon
- Formato: ICO + PNG (32×32, 192×192)
- Percorso: `frontend/public/favicon.ico`
- Colore principale: Rosso ABA #D32F2F

### Icone
- Usa emoji dove possibile (🎓, 📺, 📅, ⏱️, 🕐)
- Oppure Heroicons (React) o Lucide Icons (minimaliste)
- Style: outline, non filled
- Color: eredita dal testo

## Note Implementazione

### Tailwind CSS Config
Aggiungi questi colori custom in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'aba-red': '#D32F2F',
        'aba-red-dark': '#B71C1C',
        'postit': '#FFEB3B',
        'postit-hover': '#FDD835',
        'postit-light': '#FFF8E1',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
}
```

### CSS Variables Alternative
```css
:root {
  --color-aba-red: #D32F2F;
  --color-aba-red-dark: #B71C1C;
  --color-postit: #FFEB3B;
  --color-postit-hover: #FDD835;
  --color-postit-light: #FFF8E1;
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

## Esempi Visuali

### Post-it Example
```
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ <- Thumbnail 16:9
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                      │
│ Lezione live —       │ <- Titolo (max 2 righe)
│ Segnaletica stradale │
│                      │
│ 🕐 1h 23m            │ <- Durata
└──────────────────────┘
  ↖ Leggera rotazione
  ↖ Ombra realistica
```

### Color Palette Visual
```
Rosso ABA:     ████ #D32F2F
Rosso scuro:   ████ #B71C1C
Post-it:       ████ #FFEB3B
Post-it hover: ████ #FDD835
Post-it light: ████ #FFF8E1
Grigio scuro:  ████ #2D2D2D
Testo primario:████ #212121
Testo second.: ████ #757575
```
