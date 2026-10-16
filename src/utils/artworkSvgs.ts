/**
 * Dedicated visual SVGs matching the 5 candidate drawings of Nossa Senhora de Nazaré
 * uploaded by the user. Used as immediate, beautiful crisp visual representations
 * until the participant/organizer binds their local JPEG files.
 */

export const DRAWING_FALLBACKS: Record<string, string> = {
  // Desenho 1: 01.jpeg - Nossa Senhora com Menino Jesus adormecido, manto azul bordado a ouro, Basílica de Nazaré e barco no rio
  'desenho-1': `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
  <defs>
    <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="40%" stop-color="#fed7aa"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>
    <linearGradient id="mantleBlue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="goldCrown" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>

  <!-- Background Sky & River -->
  <rect width="600" height="800" fill="url(#skyGrad1)"/>
  
  <!-- River & Boat -->
  <path d="M 0,560 Q 300,530 600,560 L 600,800 L 0,800 Z" fill="#93c5fd" opacity="0.85"/>
  <path d="M 0,600 Q 300,580 600,600" stroke="#60a5fa" stroke-width="3" fill="none"/>
  
  <!-- Basilica in Background -->
  <g transform="translate(420, 380)" opacity="0.9">
    <path d="M 20,120 L 20,40 L 35,0 L 50,40 L 50,120 Z" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
    <path d="M 90,120 L 90,40 L 105,0 L 120,40 L 120,120 Z" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
    <rect x="45" y="60" width="50" height="60" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
    <!-- Crosses on towers -->
    <path d="M 35,-15 L 35,0 M 27,-7 L 43,-7" stroke="#334155" stroke-width="2"/>
    <path d="M 105,-15 L 105,0 M 97,-7 L 113,-7" stroke="#334155" stroke-width="2"/>
  </g>

  <!-- Círio Fluvial Boat -->
  <g transform="translate(460, 610) scale(0.7)">
    <path d="M 10,25 Q 60,35 110,25 L 95,45 Q 60,52 25,45 Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
    <rect x="35" y="10" width="50" height="15" fill="#f8fafc" stroke="#334155"/>
    <line x1="60" y1="0" x2="60" y2="10" stroke="#334155" stroke-width="2"/>
    <polygon points="60,0 75,5 60,10" fill="#ef4444"/>
  </g>

  <!-- Nossa Senhora Profile & Sleeping Jesus -->
  <!-- Blue Mantle with Gold Embroidery -->
  <path d="M 40,800 C 40,400 120,240 240,220 C 350,220 380,360 460,800 Z" fill="url(#mantleBlue)" stroke="#1e293b" stroke-width="3"/>
  
  <!-- Gold floral arabesques on Mantle -->
  <path d="M 120,380 Q 140,320 200,340 Q 160,420 100,500" stroke="#facc15" stroke-width="4" fill="none"/>
  <path d="M 80,560 Q 160,500 140,640 Q 100,700 60,780" stroke="#facc15" stroke-width="4" fill="none"/>
  <circle cx="160" cy="350" r="10" fill="#fef08a" stroke="#ca8a04"/>
  <circle cx="120" cy="520" r="12" fill="#fef08a" stroke="#ca8a04"/>

  <!-- Face of Mary -->
  <path d="M 230,300 C 290,290 320,360 300,430 C 270,490 220,490 190,460 Z" fill="#fed7aa" stroke="#78350f" stroke-width="2"/>
  <!-- Serene eye closed in tender affection -->
  <path d="M 240,380 Q 260,395 280,385" stroke="#451a03" stroke-width="3" fill="none"/>
  <path d="M 235,365 Q 260,360 285,370" stroke="#78350f" stroke-width="2.5" fill="none"/>
  <!-- Lips tenderly touching Jesus -->
  <path d="M 235,445 Q 248,455 260,448" stroke="#be123c" stroke-width="3" fill="none"/>

  <!-- Sleeping Baby Jesus -->
  <circle cx="270" cy="510" r="60" fill="#fed7aa" stroke="#78350f" stroke-width="2"/>
  <!-- Curly hair -->
  <path d="M 250,450 Q 280,440 310,460 Q 330,490 320,530" stroke="#451a03" stroke-width="6" stroke-dasharray="6,4" fill="none"/>
  <!-- Sleeping baby eye & smile -->
  <path d="M 250,510 Q 265,520 280,512" stroke="#451a03" stroke-width="2.5" fill="none"/>
  <path d="M 260,535 Q 272,543 282,538" stroke="#be123c" stroke-width="2" fill="none"/>

  <!-- White Lilies at Bottom -->
  <g transform="translate(10, 680)">
    <path d="M 20,80 Q 60,30 80,80 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
    <path d="M 60,80 Q 90,20 120,80 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
    <circle cx="70" cy="65" r="5" fill="#facc15"/>
    <circle cx="100" cy="60" r="5" fill="#facc15"/>
  </g>

  <!-- Imperial Crown on Mary -->
  <g transform="translate(180, 50)">
    <path d="M 20,160 L 140,160 L 155,70 L 110,100 L 80,40 L 50,100 L 5,70 Z" fill="url(#goldCrown)" stroke="#78350f" stroke-width="3"/>
    <circle cx="80" cy="35" r="8" fill="#ef4444" stroke="#78350f"/>
    <circle cx="8" cy="65" r="6" fill="#3b82f6" stroke="#78350f"/>
    <circle cx="152" cy="65" r="6" fill="#10b981" stroke="#78350f"/>
  </g>
  
  <text x="300" y="770" font-family="sans-serif" font-weight="bold" font-size="20" text-anchor="middle" fill="#0f172a" opacity="0.85">DESENHO 01 • MÃE DA ESPERANÇA E CÍRIO</text>
</svg>
`)}`,

  // Desenho 2: 02.jpeg - Retrato de Nossa Senhora em moldura oval barroca clássica em grafite, por Layla
  'desenho-2': `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
  <rect width="600" height="800" fill="#f8fafc"/>
  
  <!-- Outer drawing paper texture effect -->
  <rect x="20" y="20" width="560" height="760" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" rx="16"/>

  <!-- Baroque Oval Frame in Graphite -->
  <ellipse cx="300" cy="400" rx="230" ry="320" fill="none" stroke="#334155" stroke-width="14"/>
  <ellipse cx="300" cy="400" rx="215" ry="305" fill="#ffffff" stroke="#64748b" stroke-width="4"/>
  
  <!-- Frame Floral Scrolls & Arabesques -->
  <path d="M 300,70 C 270,30 330,30 300,70" stroke="#1e293b" stroke-width="6" fill="none"/>
  <path d="M 250,90 Q 300,50 350,90" stroke="#334155" stroke-width="5" fill="none"/>
  <path d="M 300,710 Q 270,750 300,770 Q 330,750 300,710" stroke="#1e293b" stroke-width="6" fill="none"/>

  <!-- Halo of delicate rays & stars -->
  <ellipse cx="300" cy="310" rx="130" ry="130" fill="none" stroke="#94a3b8" stroke-dasharray="6,8" stroke-width="3"/>

  <!-- Shaded Veil & Face of Virgin Mary -->
  <path d="M 200,600 C 180,450 200,240 300,220 C 400,240 420,450 400,600 Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="3"/>
  <path d="M 230,340 C 230,280 370,280 370,340 C 370,440 330,490 300,500 C 270,490 230,440 230,340 Z" fill="#f8fafc" stroke="#334155" stroke-width="2"/>

  <!-- Classical Eyes & Peaceful Expression -->
  <path d="M 255,360 Q 275,350 290,362" stroke="#1e293b" stroke-width="3" fill="none"/>
  <circle cx="272" cy="365" r="5" fill="#1e293b"/>
  <path d="M 310,362 Q 325,350 345,360" stroke="#1e293b" stroke-width="3" fill="none"/>
  <circle cx="328" cy="365" r="5" fill="#1e293b"/>

  <!-- Nose & Lips -->
  <path d="M 300,365 L 297,410 L 306,415" stroke="#475569" stroke-width="2" fill="none"/>
  <path d="M 285,445 Q 300,452 315,445" stroke="#334155" stroke-width="3" fill="none"/>

  <!-- Hands in blessing with pendant -->
  <circle cx="300" cy="540" r="14" fill="#cbd5e1" stroke="#1e293b" stroke-width="2"/>
  <path d="M 300,520 L 300,560 M 285,535 L 315,535" stroke="#1e293b" stroke-width="2"/>

  <!-- Signature by Layla -->
  <text x="90" y="240" font-family="cursive, sans-serif" font-style="italic" font-size="28" fill="#475569">Layla</text>
  <text x="300" y="740" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle" fill="#334155">DESENHO 02 • CORAÇÃO IMACULADO EM MOLDURA</text>
</svg>
`)}`,

  // Desenho 3: 03.jpeg - Ilustração estilizada de Nossa Senhora e Menino Jesus com moldura barroca recortada
  'desenho-3': `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
  <defs>
    <linearGradient id="bgPastel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="50%" stop-color="#fbcfe8"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
    <linearGradient id="goldFrame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>

  <rect width="600" height="800" fill="url(#bgPastel)"/>
  
  <!-- Stylized clouds with blue & purple colored pencils -->
  <g opacity="0.6">
    <ellipse cx="140" cy="180" rx="60" ry="25" fill="#c084fc" stroke="#6366f1" stroke-width="2"/>
    <ellipse cx="460" cy="220" rx="70" ry="30" fill="#93c5fd" stroke="#3b82f6" stroke-width="2"/>
  </g>

  <!-- Big Baroque Golden Carved Border -->
  <rect x="25" y="25" width="550" height="750" fill="none" stroke="url(#goldFrame)" stroke-width="28" rx="20"/>
  <path d="M 25,25 Q 120,80 80,160 Q 40,240 25,320" stroke="#b45309" stroke-width="12" fill="none"/>
  <path d="M 575,25 Q 480,80 520,160 Q 560,240 575,320" stroke="#b45309" stroke-width="12" fill="none"/>

  <!-- Long curly brown hair & sweet expressive face -->
  <path d="M 170,260 C 130,420 180,600 240,650 C 340,650 450,560 410,260 Z" fill="#92400e" stroke="#451a03" stroke-width="3"/>
  <!-- Face -->
  <ellipse cx="290" cy="390" rx="95" ry="90" fill="#fef3c7" stroke="#92400e" stroke-width="2.5"/>
  <!-- Big Manga/Cartoon Eyes -->
  <ellipse cx="255" cy="380" rx="18" ry="22" fill="#451a03"/>
  <circle cx="260" cy="373" r="6" fill="#ffffff"/>
  <ellipse cx="325" cy="380" rx="18" ry="22" fill="#451a03"/>
  <circle cx="330" cy="373" r="6" fill="#ffffff"/>
  <!-- Sweet Smile -->
  <path d="M 280,435 Q 290,445 305,435" stroke="#b91c1c" stroke-width="3.5" fill="none"/>

  <!-- Smiling Baby Jesus with Blue Globe -->
  <circle cx="370" cy="510" r="45" fill="#fef3c7" stroke="#92400e" stroke-width="2"/>
  <path d="M 330,480 Q 370,460 410,485" stroke="#78350f" stroke-width="5" stroke-dasharray="5,3" fill="none"/>
  <!-- Baby eyes and smile -->
  <ellipse cx="355" cy="510" rx="8" ry="10" fill="#451a03"/>
  <circle cx="357" cy="507" r="2.5" fill="#ffffff"/>
  <ellipse cx="385" cy="510" rx="8" ry="10" fill="#451a03"/>
  <circle cx="387" cy="507" r="2.5" fill="#ffffff"/>
  <path d="M 363,535 Q 373,542 383,535" stroke="#b91c1c" stroke-width="2.5" fill="none"/>

  <!-- Blue Globe in Baby Jesus' hand -->
  <circle cx="340" cy="590" r="24" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
  <path d="M 320,590 Q 340,580 360,590" stroke="#facc15" stroke-width="3" fill="none"/>

  <!-- Pink & Gold Mantle -->
  <path d="M 180,560 Q 290,520 420,560 L 460,780 L 140,780 Z" fill="#f472b6" stroke="#db2777" stroke-width="3"/>

  <!-- Golden Crown on Head -->
  <polygon points="250,210 290,130 330,210 290,240" fill="url(#goldFrame)" stroke="#78350f" stroke-width="3"/>
  
  <text x="300" y="755" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle" fill="#78350f">DESENHO 03 • TERNURA DE MÃE & MOLDURA</text>
</svg>
`)}`,

  // Desenho 4: 04.jpeg - Nossa Senhora rezando com o terço, sol radiante e a Oração da Ave Maria escrita à mão
  'desenho-4': `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
  <rect width="600" height="800" fill="#ffffff"/>
  
  <!-- Radiant Sun at the Top -->
  <circle cx="380" cy="140" r="60" fill="none" stroke="#475569" stroke-width="3"/>
  <!-- Sunbeams -->
  <g stroke="#94a3b8" stroke-width="2">
    <line x1="380" y1="60" x2="380" y2="20"/>
    <line x1="380" y1="220" x2="380" y2="260"/>
    <line x1="300" y1="140" x2="260" y2="140"/>
    <line x1="460" y1="140" x2="500" y2="140"/>
    <line x1="320" y1="80" x2="290" y2="50"/>
    <line x1="440" y1="200" x2="470" y2="230"/>
    <line x1="320" y1="200" x2="290" y2="230"/>
    <line x1="440" y1="80" x2="470" y2="50"/>
  </g>
  <!-- Clouds in graphite -->
  <path d="M 460,90 Q 520,70 560,110 Q 580,150 520,160 Z" fill="none" stroke="#64748b" stroke-width="2.5"/>

  <!-- Handwritten Ave Maria Prayer on the left -->
  <g font-family="cursive, sans-serif" font-size="19" fill="#1e293b" letter-spacing="0.5">
    <text x="35" y="360">Ave Maria Cheia De</text>
    <text x="35" y="395">Graça o Senhor é</text>
    <text x="35" y="430">Convosco Bendita Sois</text>
    <text x="35" y="465">Vós Entre as Mulheres</text>
    <text x="35" y="500">Bendito é o Fruto Em</text>
    <text x="35" y="535">Vosso Ventre, Jesus!</text>
    <text x="35" y="575">Santa Maria Mãe</text>
    <text x="35" y="610">De Deus Rogai Por</text>
    <text x="35" y="645">Nós, os Pecadores</text>
    <text x="35" y="680">Agora e Na Hora</text>
    <text x="35" y="715">Da Nossa Morte</text>
    <text x="70" y="755" font-weight="bold" font-size="22">Amém!</text>
  </g>

  <!-- Virgin Mary Profile in Prayer (Right Side) -->
  <!-- Veil and Profile -->
  <path d="M 330,680 C 310,550 330,420 390,360 C 470,330 540,380 570,680 Z" fill="none" stroke="#1e293b" stroke-width="3"/>
  <path d="M 390,440 Q 430,430 440,480 Q 420,530 380,520" stroke="#334155" stroke-width="2" fill="none"/>
  
  <!-- Closed eye in prayer -->
  <path d="M 395,475 Q 410,485 425,477" stroke="#1e293b" stroke-width="2.5" fill="none"/>
  
  <!-- Praying Hands holding Rosary -->
  <path d="M 370,520 L 350,560 L 375,570 L 390,530 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Rosary beads and Crucifix -->
  <path d="M 350,530 Q 330,590 350,650" stroke="#475569" stroke-width="3" stroke-dasharray="2,5" fill="none"/>
  <!-- Crucifix -->
  <g transform="translate(340, 650)">
    <line x1="10" y1="0" x2="10" y2="40" stroke="#1e293b" stroke-width="4"/>
    <line x1="0" y1="12" x2="20" y2="12" stroke="#1e293b" stroke-width="4"/>
  </g>

  <text x="300" y="790" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle" fill="#475569">DESENHO 04 • ORAÇÃO DA AVE MARIA EM GRAFITE</text>
</svg>
`)}`,

  // Desenho 5: 05.jpeg - Manto triangular com rosas e espinhos, broche CÍRIO, assinado por Luan
  'desenho-5': `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
  <rect width="600" height="800" fill="#f8fafc"/>
  
  <!-- Triangular Bell-Shaped Mantle -->
  <!-- Outer Mantle in white/cream with rose patterns -->
  <path d="M 300,240 L 490,660 Q 300,720 110,660 Z" fill="#ffffff" stroke="#1e293b" stroke-width="3.5"/>
  <path d="M 300,240 L 290,500 L 110,660" stroke="#94a3b8" stroke-width="2" fill="none"/>
  <path d="M 300,240 L 310,500 L 490,660" stroke="#94a3b8" stroke-width="2" fill="none"/>

  <!-- Hexagonal Pedestal at bottom -->
  <polygon points="200,670 400,670 430,730 170,730" fill="#cbd5e1" stroke="#334155" stroke-width="3"/>

  <!-- Pink Roses on Mantle with green vines and thorns -->
  <g>
    <!-- Left Roses -->
    <circle cx="190" cy="510" r="22" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <circle cx="230" cy="610" r="24" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <circle cx="150" cy="580" r="18" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <circle cx="230" cy="450" r="20" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <!-- Right Roses -->
    <circle cx="390" cy="510" r="25" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <circle cx="435" cy="560" r="22" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <circle cx="370" cy="620" r="20" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <circle cx="420" cy="410" r="18" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
    <!-- Thorny Vines -->
    <path d="M 180,420 Q 140,550 200,630" stroke="#4ade80" stroke-width="3" fill="none"/>
    <path d="M 400,420 Q 450,550 380,630" stroke="#4ade80" stroke-width="3" fill="none"/>
  </g>

  <!-- Central CÍRIO Brooch Medallion -->
  <ellipse cx="300" cy="535" rx="25" ry="30" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2.5"/>
  <text x="300" y="542" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle" fill="#1e3a8a">CÍRIO</text>

  <!-- Inner Sacred Image of Mary & Jesus -->
  <path d="M 260,260 Q 300,240 340,260 L 330,480 L 270,480 Z" fill="#fed7aa" stroke="#78350f" stroke-width="2"/>
  <circle cx="300" cy="270" r="30" fill="#fed7aa" stroke="#78350f" stroke-width="2"/>
  <!-- Baby Jesus in arms -->
  <circle cx="330" cy="305" r="18" fill="#fed7aa" stroke="#78350f" stroke-width="1.5"/>

  <!-- Golden Crown of Mary -->
  <g transform="translate(260, 110)">
    <path d="M 10,75 Q 40,0 70,75 Z" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>
    <line x1="40" y1="0" x2="40" y2="75" stroke="#ca8a04" stroke-width="2"/>
  </g>
  <!-- Smaller Crown of Jesus -->
  <g transform="translate(325, 185) scale(0.6)">
    <path d="M 10,60 Q 30,0 50,60 Z" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
  </g>

  <!-- Artist Signature: Luan -->
  <text x="440" y="740" font-family="cursive, sans-serif" font-style="italic" font-weight="bold" font-size="28" fill="#1e293b">Luan</text>
  
  <text x="300" y="775" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle" fill="#334155">DESENHO 05 • MANTO DAS ROSAS (POR LUAN)</text>
</svg>
`)}`,
};
