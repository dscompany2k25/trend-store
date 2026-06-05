import gadgetsImg from "@/assets/blog/post-gadgets.jpg";
import belezaImg from "@/assets/blog/post-beleza.jpg";
import casaImg from "@/assets/blog/post-casa.jpg";
import modaImg from "@/assets/blog/post-moda.jpg";
import tendenciasImg from "@/assets/blog/post-tendencias.jpg";
import comprasImg from "@/assets/blog/post-compras.jpg";

export type BlogCategory =
  | "Tecnología"
  | "Belleza"
  | "Casa & Decoración"
  | "Moda"
  | "Tendencias"
  | "Compras Inteligentes";

export interface BlogSection {
  heading: string;
  paragraphs: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: string;
  authorRole: string;
  date: string;
  readingTime: string;
  image: string;
  imageAlt: string;
  tags: string[];
  intro: string;
  sections: BlogSection[];
  conclusion: string;
}

export const categories: { name: BlogCategory; description: string }[] = [
  { name: "Tecnología", description: "Gadgets, accesorios inteligentes y novedades digitales." },
  { name: "Belleza", description: "Rutinas, cuidado personal y bienestar del día a día." },
  { name: "Casa & Decoración", description: "Ideas para hacer el hogar más acogedor y funcional." },
  { name: "Moda", description: "Estilo, prendas versátiles y tendencias de temporada." },
  { name: "Tendencias", description: "Lo que está marcando el comercio social y la cultura online." },
  { name: "Compras Inteligentes", description: "Guías prácticas para comprar mejor y gastar menos." },
];

export const blogPosts: BlogPost[] = [
  {
    slug: "gadgets-esenciales-2026",
    title: "Gadgets esenciales para una rutina más ligera en 2026",
    excerpt:
      "Pequeños accesorios tecnológicos que ahorran tiempo, organizan el día y liberan la mente para lo que realmente importa.",
    category: "Tecnología",
    author: "Marta García",
    authorRole: "Editora de Lifestyle Digital",
    date: "2026-05-12",
    readingTime: "6 min de lectura",
    image: gadgetsImg,
    imageAlt: "Accesorios tecnológicos modernos sobre fondo rosa pastel",
    tags: ["gadgets", "productividad", "tecnología"],
    intro:
      "La tecnología dejó de ser un fin para convertirse en el telón de fondo. Los mejores gadgets de hoy son los que desaparecen en la rutina y te devuelven algo valioso: tiempo y enfoque.",
    sections: [
      {
        heading: "Sonido que acompaña el ritmo",
        paragraphs: [
          "Los auriculares inalámbricos dejaron de ser solo accesorios musicales. Sirven para reuniones rápidas, podcasts en el metro e incluso como pausa silenciosa del mundo. La diferencia hoy está en la comodidad prolongada y la calidad de la cancelación de ruido.",
          "Antes de elegir, vale la pena pensar en tres cosas: duración real de la batería, ajuste en la oreja y comportamiento en llamadas. Un buen modelo de gama media cumple mejor en el día a día que uno tope de gama incómodo.",
        ],
      },
      {
        heading: "El reloj como asistente discreto",
        paragraphs: [
          "Más que un sustituto del móvil, el smartwatch se ha convertido en una forma de filtrar qué merece atención. Notificaciones relevantes, recordatorios de hidratación y métricas de sueño ayudan a crear una rutina menos reactiva.",
          "El gran cambio reciente es la integración con aplicaciones de bienestar. En lugar de números fríos, recibimos pequeñas sugerencias diarias: cuándo parar, cuándo respirar, cuándo caminar cinco minutos más.",
        ],
      },
      {
        heading: "Iluminación que transforma el ambiente",
        paragraphs: [
          "Un ring light dejó de ser exclusivo de creadores de contenido. Hoy está en mesas de teletrabajo, sesiones de maquillaje e incluso en videollamadas familiares. La luz suave y uniforme transforma cómo nos vemos en pantalla.",
        ],
      },
    ],
    conclusion:
      "Los mejores gadgets de 2026 no son los más caros ni los más llamativos. Son los que se adaptan a la vida real: silenciosos, útiles y fáciles de olvidar, en el mejor sentido de la palabra.",
  },
  {
    slug: "skincare-minimalista",
    title: "Skincare minimalista: menos productos, más resultado",
    excerpt:
      "Una rutina de cuidado de la piel simple, accesible y basada en tres pasos esenciales que funcionan para casi todos los tipos de piel.",
    category: "Belleza",
    author: "Inés Carrillo",
    authorRole: "Especialista en Belleza Consciente",
    date: "2026-05-04",
    readingTime: "5 min de lectura",
    image: belezaImg,
    imageAlt: "Productos de skincare en envases pastel sobre superficie de mármol",
    tags: ["belleza", "skincare", "bienestar"],
    intro:
      "Hay una tendencia clara que gana fuerza: rutinas de skincare cada vez más cortas. En lugar de ocho frascos, tres bien elegidos. La piel lo agradece, y el bolsillo también.",
    sections: [
      {
        heading: "El paso más subestimado: limpiar bien",
        paragraphs: [
          "Una buena limpieza no es agresiva. Es suave, a temperatura ambiente y adaptada al tipo de piel. Geles para pieles mixtas, leches o bálsamos para pieles secas, y fórmulas con salicílico para pieles con tendencia acneica.",
          "El error más común es limpiar la piel a toda prisa. Masajear durante 30 a 60 segundos marca toda la diferencia en la sensación de piel descansada.",
        ],
      },
      {
        heading: "Hidratación real, no solo sensación",
        paragraphs: [
          "Hidratar no es solo sentir la piel suave al tacto. Es mantener la barrera cutánea sana. Ingredientes como el ácido hialurónico, la glicerina y las ceramidas siguen siendo los más buscados, y con razón.",
        ],
      },
      {
        heading: "Protección solar todos los días",
        paragraphs: [
          "El paso más descuidado y, al mismo tiempo, el más importante. Un protector solar diario, incluso en días nublados, es lo que separa las pieles bien cuidadas de las simplemente maquilladas.",
          "La buena noticia: las fórmulas actuales son ligeras, sin residuo blanco y se pueden usar bajo el maquillaje sin pesadez.",
        ],
      },
    ],
    conclusion:
      "El minimalismo en el cuidado de la piel no es hacer menos por pereza, es hacer lo esencial con consistencia. Y ahí es donde están los resultados visibles al cabo de unas semanas.",
  },
  {
    slug: "hogar-acogedor-pequenos-detalles",
    title: "Hogar acogedor: pequeños detalles que lo cambian todo",
    excerpt:
      "No hace falta obra ni gran inversión. Algunas elecciones sencillas bastan para transformar cualquier espacio en una zona de confort.",
    category: "Casa & Decoración",
    author: "Rita Méndez",
    authorRole: "Curadora de Interiores",
    date: "2026-04-22",
    readingTime: "7 min de lectura",
    image: casaImg,
    imageAlt: "Salón moderno con iluminación cálida y tonos neutros",
    tags: ["decoración", "hogar", "lifestyle"],
    intro:
      "El concepto danés de hygge se ha vuelto casi universal: crear momentos de confort en casa, incluso en los días más ajetreados. Y la verdad es que con poco se consigue mucho.",
    sections: [
      {
        heading: "Capas de luz",
        paragraphs: [
          "En lugar de una única bombilla en el techo, piensa en tres fuentes de luz por habitación: una general, una de lectura y una de ambiente. La diferencia al entrar en el salón es inmediata.",
          "Velas, lámparas de mesa y tiras LED cálidas (3000K) ayudan a crear profundidad. Por la noche, el hogar deja de parecer una oficina.",
        ],
      },
      {
        heading: "Texturas que invitan a quedarse",
        paragraphs: [
          "Mantas de punto, cojines de lino lavado, alfombras peludas: son pequeños toques que hacen el espacio más humano. El secreto está en mezclar materiales, no en combinarlos todos.",
        ],
      },
      {
        heading: "Plantas como elementos vivos",
        paragraphs: [
          "No hace falta un jardín. Una sola planta en una estantería ya cambia la energía del ambiente. Para quienes tienen poca paciencia, las suculentas y los pothos son casi indestructibles.",
        ],
      },
    ],
    conclusion:
      "Un hogar acogedor no se compra en una tienda, se construye con elecciones pequeñas y constantes. Empieza por una habitación. El resto llega con el tiempo.",
  },
  {
    slug: "armario-capsula-esenciales",
    title: "Armario cápsula: 10 prendas que combinan siempre",
    excerpt:
      "Cómo construir un guardarropa funcional, duradero y elegante a partir de prendas neutras que se reinventan según la ocasión.",
    category: "Moda",
    author: "Sofía Ribera",
    authorRole: "Estilista y Consultora de Imagen",
    date: "2026-04-10",
    readingTime: "6 min de lectura",
    image: modaImg,
    imageAlt: "Conjunto de accesorios de moda en tonos neutros y coral",
    tags: ["moda", "estilo", "armario-cápsula"],
    intro:
      "Vestirse bien no exige un armario lleno. Exige un armario pensado. El concepto de armario cápsula se basa en una idea simple: tener menos prendas, pero elegidas para combinarse entre sí.",
    sections: [
      {
        heading: "La base neutra",
        paragraphs: [
          "Empieza por las prendas que sirven de lienzo: una camisa blanca de buen corte, una camiseta negra de algodón grueso, unos vaqueros oscuros y unos pantalones de traje en tono arena.",
          "Estas cuatro prendas, por sí solas, ya generan decenas de combinaciones coherentes.",
        ],
      },
      {
        heading: "Las prendas de elevación",
        paragraphs: [
          "Una chaqueta estructurada, unas botas de cuero y un bolso atemporal. Son inversiones que valen cada euro porque transforman looks sencillos en conjuntos con presencia.",
        ],
      },
      {
        heading: "Los accesorios correctos",
        paragraphs: [
          "Pañuelos, gafas de sol y bisutería dorada son las herramientas que personalizan la base. Permiten reinventar el mismo conjunto varias veces a la semana sin parecer repetitivo.",
        ],
      },
    ],
    conclusion:
      "Un armario cápsula bien montado dura años, simplifica la mañana y reduce la fatiga de decisión. El estilo, al fin y al cabo, también es una forma de descansar la cabeza.",
  },
  {
    slug: "comercio-social-cambio-compras",
    title: "Cómo el comercio social cambió la forma en que compramos",
    excerpt:
      "Del vídeo corto a la compra en segundos: un análisis editorial sobre la fusión entre entretenimiento y consumo en la nueva economía digital.",
    category: "Tendencias",
    author: "Andrés López",
    authorRole: "Analista de Cultura Digital",
    date: "2026-03-28",
    readingTime: "8 min de lectura",
    image: tendenciasImg,
    imageAlt: "Joven usando smartphone en una cafetería mientras navega vídeos verticales",
    tags: ["e-commerce", "tendencias", "social"],
    intro:
      "El vídeo vertical no fue solo un formato más. Fue un cambio cultural. Hoy descubrimos productos mientras nos reímos, aprendemos y nos distraemos, y compramos sin salir de la aplicación.",
    sections: [
      {
        heading: "Del deseo a la compra en segundos",
        paragraphs: [
          "La distancia entre ver y comprar nunca fue tan corta. Antes, un anuncio llevaba a un sitio web, que llevaba a un carrito, que pedía registro. Hoy, tres toques bastan.",
          "Esto lo cambia todo: la forma en que las marcas comunican, el tipo de creadores que ganan espacio e incluso cómo percibimos precio y valor.",
        ],
      },
      {
        heading: "El contenido es confianza",
        paragraphs: [
          "Un vídeo honesto de alguien usando un producto vale más que diez páginas de descripción. El consumidor busca pruebas reales, contexto, demostración, no promesas vacías.",
          "Por eso pequeños creadores consiguen hoy generar tantas ventas como grandes campañas publicitarias tradicionales.",
        ],
      },
      {
        heading: "El regreso de la curaduría",
        paragraphs: [
          "Con tanta oferta, volvemos a necesitar quien elija por nosotros. Tiendas curadas, perfiles de recomendación y listas temáticas están sustituyendo el cansino acto de buscar entre miles de productos.",
        ],
      },
    ],
    conclusion:
      "El comercio social no es una moda pasajera. Es la nueva forma natural de descubrir productos. Quien comunica con autenticidad gana. Quien insiste en interrumpir, pierde.",
  },
  {
    slug: "comprar-mejor-gastar-menos",
    title: "Comprar mejor, gastar menos: guía práctica",
    excerpt:
      "Cinco principios sencillos para tomar decisiones de compra más conscientes, sin renunciar a lo que realmente te da alegría.",
    category: "Compras Inteligentes",
    author: "Pedro Almeida",
    authorRole: "Editor de Finanzas Personales",
    date: "2026-03-15",
    readingTime: "5 min de lectura",
    image: comprasImg,
    imageAlt: "Bolsas de compras en papel coral y bege con lazos de regalo",
    tags: ["finanzas", "consumo consciente", "guía"],
    intro:
      "Gastar menos no significa privación. Significa hacer elecciones que valen la pena. Estos cinco principios ayudan a mirar el carrito de compras con otros ojos.",
    sections: [
      {
        heading: "1. La regla de las 48 horas",
        paragraphs: [
          "Para cualquier compra por encima de un valor que consideres significativo, espera 48 horas antes de finalizar. Si pasado ese tiempo sigue teniendo sentido, adelante. En la mayoría de los casos, el impulso desaparece.",
        ],
      },
      {
        heading: "2. Coste por uso",
        paragraphs: [
          "No mires solo el precio. Divídelo por el número estimado de usos. Unas botas de 120 € usadas tres años cuestan menos al día que unas de 30 € que duran un invierno.",
        ],
      },
      {
        heading: "3. Cuidado con el falso descuento",
        paragraphs: [
          "Una promoción solo es buena si ya querías el producto antes. De lo contrario, solo estás pagando menos por algo que no necesitas, y eso sigue siendo un gasto.",
        ],
      },
      {
        heading: "4. Evalúa el posventa",
        paragraphs: [
          "Política de devoluciones, garantía y atención al cliente son parte del precio. Comprar en sitios serios ahorra dolores de cabeza y, en el fondo, dinero.",
        ],
      },
      {
        heading: "5. Compra menos, elige mejor",
        paragraphs: [
          "Es la frase más antigua del consumo consciente y sigue siendo la más verdadera. Un buen producto bien elegido vale por cinco compras impulsivas.",
        ],
      },
    ],
    conclusion:
      "Comprar bien es una forma de cuidarse: de tu tiempo, tu dinero y tu espacio. Y es una decisión que se entrena, compra a compra.",
  },
];

export const formatDateES = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

// Keep alias for backward compat with any remaining usage
export const formatDatePT = formatDateES;

export const getPostBySlug = (slug: string) => blogPosts.find((p) => p.slug === slug);

export const getRelatedPosts = (slug: string, limit = 3) =>
  blogPosts.filter((p) => p.slug !== slug).slice(0, limit);
