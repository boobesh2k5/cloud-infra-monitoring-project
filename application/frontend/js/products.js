// =========================================================
// NOVA LUXE Product Catalog & INR Currency Engine
// Supports 24 Curated Products + Backend REST API Sync
// =========================================================

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Formats a number to Indian Rupee (INR) currency representation
 * e.g., 149999 -> ₹1,49,999
 */
function formatINR(amount) {
  if (isNaN(amount) || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// 24 Curated High-Grade Products Catalog (INR ₹)
let products = [
  {
    id: 'prod-01',
    name: 'Aura Pro Active Noise Cancelling Headphones',
    brand: 'AuraSound',
    category: 'audio',
    price: 12999,
    originalPrice: 19999,
    rating: 4.9,
    reviewsCount: 1840,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    description: 'Immersive sound with studio-grade spatial audio, hybrid active noise cancellation, and ultra-plush memory foam cushions for 40 hours of playtime.',
    features: [
      'Hybrid 4-Mic Active Noise Cancellation',
      '40-Hour Battery Life with Fast Charge (10m = 5h)',
      'Custom 40mm Titanium Dynamic Drivers',
      'Bluetooth 5.3 with Multipoint Pairing'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-02',
    name: 'NeoTitanium Ultra Smartwatch Gen 4',
    brand: 'Chronos',
    category: 'electronics',
    price: 8499,
    originalPrice: 14999,
    rating: 4.8,
    reviewsCount: 950,
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    description: 'Aerospace-grade titanium frame with always-on AMOLED sapphire display, ECG tracking, Bluetooth calling, and 12-day battery life.',
    features: [
      '1.43" Vivid AMOLED with 1000 nits brightness',
      'Continuous SpO2, Heart Rate & Stress Monitor',
      'IP68 Waterproof & 5ATM Swim Resistance',
      '100+ Sports Modes & GPS Multi-satellite'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-03',
    name: 'NovaPulse Mechanical Gaming Keyboard',
    brand: 'NovaTech',
    category: 'electronics',
    price: 4999,
    originalPrice: 7999,
    rating: 4.7,
    reviewsCount: 620,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    description: 'Compact 75% hot-swappable mechanical keyboard with lubricated linear switches, per-key RGB lighting, and gasket-mounted dampening sound.',
    features: [
      'Gasket Mount with 5-Layer Acoustic Foam',
      'Hot-Swappable 5-Pin Switch Sockets',
      'Tri-Mode Wireless (2.4G/BT 5.0/Type-C)',
      'Double-shot PBT Keycaps with shine-through'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-04',
    name: 'UrbanStride Minimalist Street Sneakers',
    brand: 'Veloce',
    category: 'fashion',
    price: 3499,
    originalPrice: 5999,
    rating: 4.6,
    reviewsCount: 840,
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-lightweight ergonomic sneakers crafted with breathable knit mesh, cloud-foam shock-absorbing sole, and modern streetwear aesthetic.',
    features: [
      'SuperCloud Responsive Cushioning Sole',
      'Breathable Eco-Recycled Knit Fabric',
      'Anti-Odor Memory Foam Insole',
      'Slip-Resistant Textured Rubber Outsole'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-05',
    name: 'ZenAmbient Smart Hydroponic Herb Garden',
    brand: 'ZenHome',
    category: 'lifestyle',
    price: 6299,
    originalPrice: 8999,
    rating: 4.8,
    reviewsCount: 310,
    badge: 'Eco Pick',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    description: 'Indoor smart garden with automated LED grow lighting, whisper-quiet self-watering circulation, and nutrient alarm. Fresh greens all year.',
    features: [
      'Full-Spectrum Automated 24W Grow Light',
      'Smart Water Level & Nutrient Reminders',
      'Grows 6 Plants Simultaneously 5x Faster',
      'BPA-Free, Clean & Zero-Soil Hydroponics'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-06',
    name: 'SonicBlast Portable Rugged Speaker',
    brand: 'BoomCore',
    category: 'audio',
    price: 2999,
    originalPrice: 4999,
    rating: 4.7,
    reviewsCount: 1120,
    badge: 'Best Value',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80',
    description: 'Punchy 360-degree bass with IP67 dust and waterproof armor, 24-hour battery reserve, and dynamic party RGB illumination rings.',
    features: [
      '30W Deep Bass Output with Dual Passive Radiators',
      'IP67 Dustproof, Sandproof & Float in Water',
      'PartySync Link: Pair up to 100+ Speakers',
      'Built-in Power Bank to charge your mobile'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-07',
    name: 'SpectraCraft Ergonomic Task Chair',
    brand: 'ErgoMaster',
    category: 'lifestyle',
    price: 11499,
    originalPrice: 16999,
    rating: 4.9,
    reviewsCount: 480,
    badge: 'Top Rated',
    image: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80',
    description: 'Engineered for all-day focus. High-density Korean mesh backrest, adaptive lumbar support, 3D armrests, and 135-degree recline lock.',
    features: [
      'Dynamic Self-Adjusting Lumbar Cradle',
      'CoolWeave Breathable German Mesh Fabric',
      'Class 4 Heavy Duty Heavy-Load Gas Lift',
      'Silent Polyurethane Rollerblade Casters'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-08',
    name: 'LuxeVoyage Water-Resistant Tech Backpack',
    brand: 'NomadGear',
    category: 'fashion',
    price: 2799,
    originalPrice: 4499,
    rating: 4.7,
    reviewsCount: 780,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    description: 'Sleek 28L anti-theft commuter backpack with TSA-approved 16" padded laptop vault, USB charging passthrough, and waterproof ballistic nylon.',
    features: [
      'Water-Repellent 900D Oxford Ballistic Shell',
      'Dedicated Shockproof 16" Laptop Compartment',
      'Hidden Anti-Theft RFID Shielded Pocket',
      'Luggage Trolley Strap & External USB Port'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-09',
    name: 'ClarityLens 4K Studio Streaming Webcam',
    brand: 'VisionPro',
    category: 'electronics',
    price: 5999,
    originalPrice: 8999,
    rating: 4.6,
    reviewsCount: 430,
    badge: 'Creator Pick',
    image: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra HD 4K 60FPS video sensor with AI autofocus, dual noise-cancelling microphones, and magnetic privacy shutter.',
    features: [
      'Sony STARVIS CMOS Sensor with HDR',
      'Intelligent Face-Tracking & Dual Stereo Mic',
      'Adjustable Field of View (65°, 78°, 90°)',
      'Plug and Play with USB-C 3.1 Interface'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-10',
    name: 'AromaZen Ultrasonic Essential Oil Diffuser',
    brand: 'ZenHome',
    category: 'lifestyle',
    price: 1899,
    originalPrice: 2999,
    rating: 4.8,
    reviewsCount: 610,
    badge: 'Relaxation',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
    description: 'Handcrafted ceramic ultrasonic diffuser with ambient candlelight glow, 500ml reservoir, and whisper-quiet operation.',
    features: [
      '500ml Capacity: 16 Hours Continuous Mist',
      'Waterless Auto Shut-Off Safety Feature',
      '7 Calming Ambient LED Color Cycles',
      'Ultra-Fine 2.4MHz Cool Mist Technology'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-11',
    name: 'ApexPro Magnetic Wireless PowerBank 10000mAh',
    brand: 'VoltGrid',
    category: 'electronics',
    price: 2499,
    originalPrice: 3999,
    rating: 4.7,
    reviewsCount: 920,
    badge: 'Essential',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
    description: 'Snap-and-charge magnetic wireless power bank with 22.5W Power Delivery fast charging, foldable kickstand, and digital battery LED indicator.',
    features: [
      'Strong 12N Snap-to-Charge Magnetic Alignment',
      '22.5W Fast Charging via USB-C PD',
      'Foldable Zinc Alloy Kickstand for Video Viewing',
      'Multi-protection Safety Shield Against Overheating'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-12',
    name: 'Solaris Polarized Aviator Sunglasses',
    brand: 'SolLux',
    category: 'fashion',
    price: 1999,
    originalPrice: 3499,
    rating: 4.5,
    reviewsCount: 540,
    badge: 'Summer Drop',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
    description: 'Ultra-lightweight stainless steel frame with UV400 multi-layer polarized TAC lenses to eliminate glare and enhance true colors.',
    features: [
      '100% UV400 Anti-Glare Polarized Lenses',
      'Corrosion-Resistant Surgical Steel Frame',
      'Soft Silicone Nose Pads with Zero Pinching',
      'Includes Leather Hard Case & Microfiber Cloth'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-13',
    name: 'PulseFlow True Wireless Earbuds with ANC',
    brand: 'AuraSound',
    category: 'audio',
    price: 3999,
    originalPrice: 6999,
    rating: 4.8,
    reviewsCount: 1450,
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    description: 'Zero-latency gaming mode, 32dB active noise cancellation, IPX5 sweat resistance, and 36-hour total battery case.',
    features: [
      '32dB Hybrid Active Noise Cancellation',
      'Super Low Latency 40ms Gaming Mode',
      'Wireless Qi Fast Charging Case',
      'Quad-Mic Environmental Noise Cancellation for Calls'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-14',
    name: 'NeoGlow Ambient Smart Desk Light Bar',
    brand: 'NovaTech',
    category: 'lifestyle',
    price: 2699,
    originalPrice: 4299,
    rating: 4.7,
    reviewsCount: 390,
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    description: 'Screen-mounted anti-glare light bar with wireless desktop dial, auto-dimming brightness sensor, and dual-tone RGB backlighting.',
    features: [
      'Zero Screen Reflection Asymmetrical Optical Design',
      'Wireless 2.4GHz Rotary Controller Dial',
      'Step-less Color Temperature Adjustment (2700K - 6500K)',
      'Ambient RGB Backlight for Gaming Immersion'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-15',
    name: 'AeroGlide Wireless Ergonomic Vertical Mouse',
    brand: 'ErgoMaster',
    category: 'electronics',
    price: 2199,
    originalPrice: 3499,
    rating: 4.6,
    reviewsCount: 520,
    badge: 'Ergo Pick',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
    description: '57-degree vertical handshake angle eliminates wrist strain. 4000 DPI silent optical tracking, thumb rest, and rechargeable battery.',
    features: [
      'Scientific 57° Natural Handshake Posture',
      'Whisper-Quiet Click Mechanism (90% Noise Reduction)',
      'Tri-Device Connectivity (Bluetooth + 2.4G)',
      'USB-C Rechargeable with 4-Month Battery Life'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-16',
    name: 'HyperBreeze Portable Turbo Desk Fan',
    brand: 'ZenHome',
    category: 'lifestyle',
    price: 1499,
    originalPrice: 2499,
    rating: 4.6,
    reviewsCount: 380,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=800&auto=format&fit=crop&q=80',
    description: 'Brushless turbo aerodynamics with whisper-quiet airflow, oscillating head, 4000mAh lithium battery for 12 hours cordless operation.',
    features: [
      'Jet-Engine Inspired Aerodynamic Blades',
      'Ultra Quiet 20dB Brushless Motor',
      '120° Automatic Wide-Angle Oscillation',
      'Type-C Fast Charging 4000mAh Battery'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-17',
    name: 'TitanShield Rugged Military Smartwatch',
    brand: 'Chronos',
    category: 'electronics',
    price: 5999,
    originalPrice: 9999,
    rating: 4.8,
    reviewsCount: 410,
    badge: 'Heavy Duty',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
    description: 'Military-grade MIL-STD-810H shockproof watch with built-in dual-beam flashlight, compass, altimeter, and 20-day battery.',
    features: [
      'Certified MIL-STD-810H Shock & Impact Proof',
      'Built-in Ultra Bright Dual LED Flashlight',
      'Compass, Altimeter & Barometer Sensors',
      'Corning Gorilla Glass Anti-Scratch Lens'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-18',
    name: 'StudioMaster Reference Wireless Headphones',
    brand: 'AuraSound',
    category: 'audio',
    price: 16999,
    originalPrice: 24999,
    rating: 4.9,
    reviewsCount: 670,
    badge: 'Audiophile',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    description: 'Audiophile-grade planar magnetic open-back headphones engineered for lossless high-resolution monitoring with balanced audio.',
    features: [
      'Planar Magnetic Transducers for Pure Clarity',
      'Real Walnut Wood Earcups & Lambskin Pads',
      'Hi-Res Audio Certified with LDAC & aptX HD',
      'Detachable Braided Silver-Plated OFC Cable'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-19',
    name: 'Zenith Carbon Fiber Minimalist Cardholder Wallet',
    brand: 'NomadGear',
    category: 'fashion',
    price: 1499,
    originalPrice: 2499,
    rating: 4.7,
    reviewsCount: 890,
    badge: 'EDC Pick',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
    description: 'Aerospace 3K matte carbon fiber with RFID blocking shield, integrated elastic cash strap, and quick-flick card access mechanism.',
    features: [
      'Full RFID/NFC Skimming Protection',
      'Holds up to 12 Cards plus Folded Cash',
      'Aircraft-Grade Aluminum Inner Chamber',
      'Ultra-Slim 6mm Profile for Front Pocket'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-20',
    name: 'PureAura Smart HEPA Air Purifier Pro',
    brand: 'ZenHome',
    category: 'lifestyle',
    price: 7999,
    originalPrice: 11999,
    rating: 4.8,
    reviewsCount: 520,
    badge: 'Health',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    description: 'True H13 HEPA filtration removes 99.97% of smoke, dust, and PM2.5 pollutants. Smart laser air quality sensor with real-time numeric display.',
    features: [
      'Medical-Grade True H13 HEPA Filter',
      'Real-Time Laser PM2.5 Air Quality Index Display',
      'Whisper-Quiet 24dB Sleep Mode',
      'Covers up to 500 Sq. Ft. Room in 15 Mins'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-21',
    name: 'RetroGlow RGB Nixie Tube Desk Clock',
    brand: 'NovaTech',
    category: 'lifestyle',
    price: 3499,
    originalPrice: 5499,
    rating: 4.9,
    reviewsCount: 230,
    badge: 'Limited Drop',
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&auto=format&fit=crop&q=80',
    description: 'Modern simulation of vintage Soviet nixie tubes with 16-million customizable IPS RGB glow displays and magnetic dust cover.',
    features: [
      '6x Full Color Customizable IPS Glow Displays',
      'Wi-Fi NTP Clock Sync for Atomic Precision',
      'Solid Anodized Aluminum Alloy Base',
      'Over 20 Dynamic Animation & Audio Visualizer Modes'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-22',
    name: 'Phantom Glide Wireless Charging Gaming Mousepad',
    brand: 'NovaTech',
    category: 'electronics',
    price: 1999,
    originalPrice: 3299,
    rating: 4.6,
    reviewsCount: 740,
    badge: 'Gaming',
    image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=800&auto=format&fit=crop&q=80',
    description: 'Extra-large micro-textured control surface with built-in 15W fast wireless charging zone for your phone or wireless mouse.',
    features: [
      'Integrated 15W Qi Fast Wireless Charging Coil',
      'Micro-Woven Low-Friction Speed Surface',
      '360° Edge-Lit Custom RGB Spectrum Lighting',
      'Non-Slip Textured Natural Rubber Base'
    ],
    inStock: true,
    isTrending: false
  },
  {
    id: 'prod-23',
    name: 'CloudShift Premium Oversized Street Hoodie',
    brand: 'Veloce',
    category: 'fashion',
    price: 2499,
    originalPrice: 3999,
    rating: 4.7,
    reviewsCount: 630,
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    description: '450 GSM French terry heavyweight cotton with double-layered hood, dropped shoulders, and embroidered minimalist typography.',
    features: [
      'Heavyweight 450 GSM 100% Combed Cotton',
      'Pre-Shrunk Fade-Resistant Reactive Dye',
      'Deep Hidden Kangaroo Pocket with Zipper',
      'Ribbed Cuffs & Hem with Reinforced Stitching'
    ],
    inStock: true,
    isTrending: true
  },
  {
    id: 'prod-24',
    name: 'TerraGrip Insulated Stainless Steel Flask 1000ml',
    brand: 'NomadGear',
    category: 'lifestyle',
    price: 1299,
    originalPrice: 1999,
    rating: 4.8,
    reviewsCount: 1100,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    description: 'Double-wall vacuum insulation keeps liquids icy cold for 24 hours or piping hot for 12 hours. Powder-coated 18/8 food-grade steel.',
    features: [
      '24-Hour Cold & 12-Hour Hot Vacuum Core',
      '100% Leak-Proof Magnetic Chug Lid',
      'Durable Textured Powder-Coat Finish',
      'BPA-Free, Zero Condensation & Zero Sweat'
    ],
    inStock: true,
    isTrending: false
  }
];

// Fallback image helper
function handleImageError(img) {
  img.onerror = null;
  img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
}

// Optional API fetch synchronization
async function syncProductsFromBackend() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s fast timeout
    const res = await fetch(`${API_BASE_URL}/products`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        products = data.products.map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]')
        }));
        if (typeof renderProducts === 'function') renderProducts();
        console.log('[API] Synced 24 products from Backend REST Server');
      }
    }
  } catch (err) {
    // Graceful offline fallback to memory products
    console.log('[API] Using local 24-product catalog (Backend offline or standalone)');
  }
}

// Trigger background sync on page load
syncProductsFromBackend();
