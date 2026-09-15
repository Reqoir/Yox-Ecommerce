import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

interface ProductSeed {
  name: string;
  slug: string;
  categorySlug: 'pants' | 'accessories';
  subCategorySlug?: string;
  subCategoryName?: string;
  brandName?: string;
  brandSlug?: string;
  shortDescription: string;
  description: string;
  fit?: string;
  tag?: 'NEW' | 'BESTSELLER' | 'SALE' | 'POPULAR';
  isFeatured?: boolean;
  colors: {
    color: string;
    price: number;
    comparePrice?: number;
    images: string[];
    sizes: string[];
  }[];
}

const productsToSeed: ProductSeed[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 16 PANTS PRODUCTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Relaxed Fit Linen-Blend Trousers',
    slug: 'relaxed-fit-linen-blend-trousers',
    categorySlug: 'pants',
    subCategorySlug: 'tailored',
    subCategoryName: 'Tailored Trousers',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Airy linen-blend trousers featuring an elasticated drawstring waistband and easy straight legs.',
    description: 'An essential for warm weather and smart-casual styling. Crafted from a premium European linen and organic cotton blend, these trousers offer superior breathability with a fluid drape. Complete with slash side pockets and welt rear pockets.',
    fit: 'Relaxed Fit',
    tag: 'NEW',
    isFeatured: true,
    colors: [
      {
        color: 'Beige',
        price: 2499,
        comparePrice: 2999,
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      },
      {
        color: 'Black',
        price: 2499,
        comparePrice: 2999,
        images: [
          'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Slim Fit Stretch Cotton Chinos',
    slug: 'slim-fit-stretch-cotton-chinos',
    categorySlug: 'pants',
    subCategorySlug: 'chinos',
    subCategoryName: 'Chinos',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Tailored slim-fit chinos woven with flexible elastane for day-long ease and sharp structure.',
    description: 'The definitive daily pant. Enzyme washed for exceptional softness from first wear, with a mid-rise waist, clean flat front, zip fly, and buttoned back pockets. Pairs effortlessly with crisp oxfords or relaxed tees.',
    fit: 'Slim Fit',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Khaki',
        price: 1999,
        comparePrice: 2499,
        images: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['28', '30', '32', '34', '36']
      },
      {
        color: 'Navy Blue',
        price: 1999,
        comparePrice: 2499,
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Tactical Multi-Pocket Cargo Pants',
    slug: 'tactical-multi-pocket-cargo-pants',
    categorySlug: 'pants',
    subCategorySlug: 'cargo',
    subCategoryName: 'Cargo Pants',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Rugged ripstop cotton cargo trousers outfitted with functional bellows pockets and reinforced knees.',
    description: 'Constructed from durable 100% cotton ripstop fabric designed to withstand heavy wear. Features articulated knee construction for unimpeded movement, adjustable drawcord cuffs, and secure flap cargo compartments.',
    fit: 'Regular Fit',
    tag: 'POPULAR',
    isFeatured: false,
    colors: [
      {
        color: 'Olive Green',
        price: 2799,
        comparePrice: 3299,
        images: [
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      },
      {
        color: 'Black',
        price: 2799,
        comparePrice: 3299,
        images: [
          'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Straight Leg Selvedge Denim Jeans',
    slug: 'straight-leg-selvedge-denim-jeans',
    categorySlug: 'pants',
    subCategorySlug: 'jeans',
    subCategoryName: 'Jeans & Denim',
    brandName: "Levi's",
    brandSlug: 'levis',
    shortDescription: 'Authentic 13.5oz shuttle-loom selvedge denim cut in a timeless straight-leg profile.',
    description: 'Woven on vintage shuttle looms from American upland cotton. Features custom copper rivets, button-fly closure, red selvedge ID stitch on the outseams, and a genuine leather rear patch.',
    fit: 'Regular Fit',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Indigo Blue',
        price: 3499,
        comparePrice: 4299,
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36', '38']
      }
    ]
  },
  {
    name: 'Double-Pleated Wide Leg Trousers',
    slug: 'double-pleated-wide-leg-trousers',
    categorySlug: 'pants',
    subCategorySlug: 'tailored',
    subCategoryName: 'Tailored Trousers',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Sophisticated draped trousers with deep front double pleats and an elegant wide silhouette.',
    description: 'A modern sartorial showstopper. Cut with a high-rise waist and generous volume through the thigh that cascades gracefully over footwear. Made with lightweight tropical wool blend for year-round wear.',
    fit: 'Loose Fit',
    tag: 'NEW',
    isFeatured: true,
    colors: [
      {
        color: 'Charcoal Grey',
        price: 3199,
        comparePrice: 3899,
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      },
      {
        color: 'Off-White',
        price: 3199,
        comparePrice: 3899,
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34']
      }
    ]
  },
  {
    name: 'Vintage Wash Slim Tapered Jeans',
    slug: 'vintage-wash-slim-tapered-jeans',
    categorySlug: 'pants',
    subCategorySlug: 'jeans',
    subCategoryName: 'Jeans & Denim',
    brandName: "Levi's",
    brandSlug: 'levis',
    shortDescription: 'Medium-indigo washed denim with subtle artisanal whiskering and a neat tapered leg opening.',
    description: 'Engineered for the optimal balance of form and ease with 1% elastane flex. Sits comfortably below the natural waist with a streamlined taper from knee to ankle.',
    fit: 'Slim Fit',
    tag: 'POPULAR',
    isFeatured: false,
    colors: [
      {
        color: 'Medium Wash Blue',
        price: 2699,
        comparePrice: 3199,
        images: [
          'https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['28', '30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Wide Wale Corduroy Trousers',
    slug: 'wide-wale-corduroy-trousers',
    categorySlug: 'pants',
    subCategorySlug: 'tailored',
    subCategoryName: 'Tailored Trousers',
    brandName: 'Uniqlo',
    brandSlug: 'uniqlo',
    shortDescription: 'Tactile 8-wale cotton corduroy pants finished in rich earthy tones with a relaxed leg.',
    description: 'Chunky corduroy offering warmth, velvety texture, and heritage style. Designed with a clean waistband, belt loops, and roomy pockets.',
    fit: 'Relaxed Fit',
    tag: 'NEW',
    isFeatured: false,
    colors: [
      {
        color: 'Tobacco Brown',
        price: 2899,
        comparePrice: 3499,
        images: [
          'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Heavyweight Fleece Utility Joggers',
    slug: 'heavyweight-fleece-utility-joggers',
    categorySlug: 'pants',
    subCategorySlug: 'cargo',
    subCategoryName: 'Cargo Pants',
    brandName: 'Uniqlo',
    brandSlug: 'uniqlo',
    shortDescription: '450 GSM diagonal-weave French terry sweatpants with utility zips and thick ribbed ankles.',
    description: 'The pinnacle of loungewear and urban styling. Custom milled from organic combed cotton with deep zippered hip pockets, back patch pocket, and chunky woven drawcords.',
    fit: 'Regular Fit',
    tag: 'SALE',
    isFeatured: false,
    colors: [
      {
        color: 'Heather Grey',
        price: 1899,
        comparePrice: 2499,
        images: [
          'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        color: 'Washed Black',
        price: 1899,
        comparePrice: 2499,
        images: [
          'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL']
      }
    ]
  },
  {
    name: 'Workwear Heavy Canvas Carpenter Pants',
    slug: 'workwear-heavy-canvas-carpenter-pants',
    categorySlug: 'pants',
    subCategorySlug: 'cargo',
    subCategoryName: 'Cargo Pants',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Tough cotton duck canvas pants with utility tool pockets, hammer loop, and triple-needle seams.',
    description: 'Built for longevity. High-density 12oz duck canvas with bar-tack reinforcement at key stress points, brass zipper, and relaxed straight leg cut.',
    fit: 'Relaxed Fit',
    tag: 'POPULAR',
    isFeatured: true,
    colors: [
      {
        color: 'Caramel Tan',
        price: 2999,
        comparePrice: 3599,
        images: [
          'https://images.unsplash.com/photo-1560243563-062bfc001d68?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Cropped Ankle-Length Chinos',
    slug: 'cropped-ankle-length-chinos',
    categorySlug: 'pants',
    subCategorySlug: 'chinos',
    subCategoryName: 'Chinos',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Modern cropped trousers hitting right at the ankle, ideal for showcasing loafers or sneakers.',
    description: 'Clean minimalist silhouette featuring a tapered leg, internal coin pocket, and garment-dyed finish for rich dimension and soft hand-feel.',
    fit: 'Slim Fit',
    tag: 'NEW',
    isFeatured: false,
    colors: [
      {
        color: 'Sage Green',
        price: 2199,
        comparePrice: 2699,
        images: [
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Smart Italian Wool-Blend Dress Slacks',
    slug: 'smart-italian-wool-blend-dress-slacks',
    categorySlug: 'pants',
    subCategorySlug: 'tailored',
    subCategoryName: 'Tailored Trousers',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Pressed crease tailored trousers with curtain waistband lining and hidden hook closure.',
    description: 'Crafted with fine wool blended with stretch fibers for crease resistance and enduring elegance throughout demanding workdays or evening occasions.',
    fit: 'Tailored Fit',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Midnight Navy',
        price: 3699,
        comparePrice: 4499,
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36', '38']
      }
    ]
  },
  {
    name: 'Black Jet Washed Skinny Jeans',
    slug: 'black-jet-washed-skinny-jeans',
    categorySlug: 'pants',
    subCategorySlug: 'jeans',
    subCategoryName: 'Jeans & Denim',
    brandName: "Levi's",
    brandSlug: 'levis',
    shortDescription: 'Deep sulfur-dyed black denim that retains its rich darkness wash after wash.',
    description: 'High-stretch recovery denim that holds its shape throughout the day. Finished with matte black hardware and tonal stitching.',
    fit: 'Slim Fit',
    tag: 'POPULAR',
    isFeatured: false,
    colors: [
      {
        color: 'Jet Black',
        price: 2599,
        comparePrice: 3099,
        images: [
          'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['28', '30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Textured Seersucker Summer Trousers',
    slug: 'textured-seersucker-summer-trousers',
    categorySlug: 'pants',
    subCategorySlug: 'tailored',
    subCategoryName: 'Tailored Trousers',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Puckered cotton seersucker trousers that hold fabric away from skin for optimal cooling.',
    description: 'Featherlight summer tailoring featuring an internal drawstring, zip fly, and relaxed taper. Keeps you impeccably styled and cool under humid conditions.',
    fit: 'Regular Fit',
    tag: 'NEW',
    isFeatured: false,
    colors: [
      {
        color: 'Sky Blue / White Striped',
        price: 2399,
        comparePrice: 2899,
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Technical 4-Way Stretch Commuter Pants',
    slug: 'technical-4-way-stretch-commuter-pants',
    categorySlug: 'pants',
    subCategorySlug: 'chinos',
    subCategoryName: 'Chinos',
    brandName: 'Uniqlo',
    brandSlug: 'uniqlo',
    shortDescription: 'DWR water-resistant technical trousers engineered with ergonomic gusset and zip security pocket.',
    description: 'Performance-driven menswear designed for active commuters. Quick-drying, stain-repellent, and offers 360-degree stretch for bike rides or airport travel.',
    fit: 'Slim Fit',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Charcoal',
        price: 3299,
        comparePrice: 3999,
        images: [
          'https://images.unsplash.com/photo-1604176354204-9268737828e4?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Raw Indigo Rigid Denim Jeans',
    slug: 'raw-indigo-rigid-denim-jeans',
    categorySlug: 'pants',
    subCategorySlug: 'jeans',
    subCategoryName: 'Jeans & Denim',
    brandName: "Levi's",
    brandSlug: 'levis',
    shortDescription: 'Unwashed raw denim engineered to fade and mold uniquely to the owner over years of wear.',
    description: 'Pure 14oz unwashed right-hand twill denim. Rigid initially, breaking in to yield personalized honeycomb and whiskering wear patterns.',
    fit: 'Regular Fit',
    tag: 'NEW',
    isFeatured: false,
    colors: [
      {
        color: 'Deep Raw Indigo',
        price: 3799,
        comparePrice: 4599,
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['30', '32', '34', '36']
      }
    ]
  },
  {
    name: 'Elasticated Drawstring Easy Chinos',
    slug: 'elasticated-drawstring-easy-chinos',
    categorySlug: 'pants',
    subCategorySlug: 'chinos',
    subCategoryName: 'Chinos',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Clean chino finish on the exterior with the effortless comfort of an elasticated waistband.',
    description: 'The ultimate hybrid pant. Premium washed cotton twill with hidden interior drawstrings so you can wear them with or without a belt for casual days.',
    fit: 'Relaxed Fit',
    tag: 'SALE',
    isFeatured: false,
    colors: [
      {
        color: 'Desert Sand',
        price: 1799,
        comparePrice: 2299,
        images: [
          'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['S', 'M', 'L', 'XL']
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 14 ACCESSORIES PRODUCTS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'Full-Grain Italian Leather Belt',
    slug: 'full-grain-italian-leather-belt',
    categorySlug: 'accessories',
    subCategorySlug: 'belts',
    subCategoryName: 'Belts',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: '35mm handcrafted vegetable-tanned leather belt with solid brushed brass pin buckle.',
    description: 'Made from 100% full-grain Tuscan bridle leather that develops an enviable patina with age. Featuring bevelled hand-painted edges and single keeper loop.',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Cognac Brown',
        price: 1499,
        comparePrice: 1899,
        images: [
          'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['32', '34', '36', '38']
      },
      {
        color: 'Classic Black',
        price: 1499,
        comparePrice: 1899,
        images: [
          'https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['32', '34', '36', '38']
      }
    ]
  },
  {
    name: 'Polarized Acetate Square Sunglasses',
    slug: 'polarized-acetate-square-sunglasses',
    categorySlug: 'accessories',
    subCategorySlug: 'eyewear',
    subCategoryName: 'Eyewear',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Hand-polished cellulose acetate sunglasses with premium polarized anti-glare lenses.',
    description: 'Classic unisex square silhouette featuring 5-barrel German hinges, wire-core temples for custom fit, and 100% UV400 category 3 sun protection.',
    tag: 'NEW',
    isFeatured: true,
    colors: [
      {
        color: 'Havana Tortoise',
        price: 2499,
        comparePrice: 2999,
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      },
      {
        color: 'Gloss Black',
        price: 2499,
        comparePrice: 2999,
        images: [
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      }
    ]
  },
  {
    name: 'Minimalist RFID Bifold Leather Wallet',
    slug: 'minimalist-rfid-bifold-leather-wallet',
    categorySlug: 'accessories',
    subCategorySlug: 'wallets',
    subCategoryName: 'Wallets & Cardholders',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Slimline bifold wallet handcrafted with RFID shielding mesh and full currency divider.',
    description: 'Designed to eliminate pocket bulk. Features 8 precision-cut card slots, 2 receipt pockets, and a full-length billfold lined with water-resistant cotton twill.',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Chestnut Tan',
        price: 1299,
        comparePrice: 1699,
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      },
      {
        color: 'Obsidian Black',
        price: 1299,
        comparePrice: 1699,
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      }
    ]
  },
  {
    name: 'Minimalist Bauhaus Steel Mesh Watch',
    slug: 'minimalist-bauhaus-steel-mesh-watch',
    categorySlug: 'accessories',
    subCategorySlug: 'wallets',
    subCategoryName: 'Wallets & Cardholders',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Ultra-thin 7mm 316L stainless steel wristwatch with Japanese quartz movement and sapphire crystal.',
    description: 'Understated Scandinavian aesthetic. Features a clean dial with date window, 5 ATM water resistance, and an interchangeable Milanese mesh stainless steel strap.',
    tag: 'NEW',
    isFeatured: true,
    colors: [
      {
        color: 'Silver Mesh',
        price: 4999,
        comparePrice: 5999,
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['40mm']
      },
      {
        color: 'All Black',
        price: 4999,
        comparePrice: 5999,
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['40mm']
      }
    ]
  },
  {
    name: 'Waxed Canvas 45L Weekend Duffel Bag',
    slug: 'waxed-canvas-45l-weekend-duffel-bag',
    categorySlug: 'accessories',
    subCategorySlug: 'bags',
    subCategoryName: 'Bags',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Heavy-duty 18oz water-repellent waxed canvas travel bag with rich saddle leather trims.',
    description: 'The ultimate getaway companion. Cabin-approved dimensions with reinforced leather base studs, two-way YKK brass zipper, padded detachable shoulder strap, and internal shoe compartment.',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Olive Khaki',
        price: 4499,
        comparePrice: 5499,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['45 Litres']
      }
    ]
  },
  {
    name: 'Ribbed Cashmere-Merino Beanie',
    slug: 'ribbed-cashmere-merino-beanie',
    categorySlug: 'accessories',
    subCategorySlug: 'belts',
    subCategoryName: 'Belts',
    brandName: 'Uniqlo',
    brandSlug: 'uniqlo',
    shortDescription: 'Luxuriously warm beanie knit from Mongolian cashmere and extrafine Australian merino wool.',
    description: 'Chunky 7-gauge fisherman rib knit with an adjustable foldover cuff. Non-scratchy, naturally temperature-regulating, and exceptionally cozy.',
    tag: 'NEW',
    isFeatured: false,
    colors: [
      {
        color: 'Oatmeal Heather',
        price: 1399,
        comparePrice: 1799,
        images: [
          'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['One Size']
      },
      {
        color: 'Charcoal',
        price: 1399,
        comparePrice: 1799,
        images: [
          'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['One Size']
      }
    ]
  },
  {
    name: 'Brushed Titanium Minimalist Open Cuff',
    slug: 'brushed-titanium-minimalist-open-cuff',
    categorySlug: 'accessories',
    subCategorySlug: 'wallets',
    subCategoryName: 'Wallets & Cardholders',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Solid marine-grade stainless steel bracelet featuring an understated matte satin finish.',
    description: 'Precision machined with rounded comfortable edges and subtle laser-etched interior branding. Hypoallergenic, tarnish-proof, and gently adjustable to fit any wrist.',
    tag: 'POPULAR',
    isFeatured: false,
    colors: [
      {
        color: 'Silver Matte',
        price: 1599,
        comparePrice: 1999,
        images: [
          'https://images.unsplash.com/photo-1611591475847-a84126d4ca9d?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['M', 'L']
      }
    ]
  },
  {
    name: 'Saffiano Leather Slim Cardholder',
    slug: 'saffiano-leather-slim-cardholder',
    categorySlug: 'accessories',
    subCategorySlug: 'wallets',
    subCategoryName: 'Wallets & Cardholders',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Scratch-resistant cross-hatch leather card case with 6 exterior card slots and central sleeve.',
    description: 'Designed for the modern cashless lifestyle. Fits seamlessly into front shirt or trouser pockets without creating any unsightly silhouette lines.',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Emerald Green',
        price: 899,
        comparePrice: 1199,
        images: [
          'https://images.unsplash.com/photo-1606503829068-196e838ff40c?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      },
      {
        color: 'Black Saffiano',
        price: 899,
        comparePrice: 1199,
        images: [
          'https://images.unsplash.com/photo-1606503829068-196e838ff40c?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      }
    ]
  },
  {
    name: 'Washed Twill Low-Profile Baseball Cap',
    slug: 'washed-twill-low-profile-baseball-cap',
    categorySlug: 'accessories',
    subCategorySlug: 'belts',
    subCategoryName: 'Belts',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: 'Unstructured 6-panel dad hat constructed from enzyme-softened 100% organic cotton twill.',
    description: 'Features a curved visor, embroidered eyelets for air circulation, and an adjustable self-fabric strap with an antique brass closure buckle.',
    tag: 'POPULAR',
    isFeatured: false,
    colors: [
      {
        color: 'Faded Black',
        price: 799,
        comparePrice: 999,
        images: [
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Adjustable']
      },
      {
        color: 'Warm Beige',
        price: 799,
        comparePrice: 999,
        images: [
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Adjustable']
      }
    ]
  },
  {
    name: 'Pure Merino Wool Herringbone Scarf',
    slug: 'pure-merino-wool-herringbone-scarf',
    categorySlug: 'accessories',
    subCategorySlug: 'belts',
    subCategoryName: 'Belts',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Generously sized winter scarf woven in Scotland with subtle two-tone herringbone pattern.',
    description: 'Ultra-soft hand feel without any prickle. Measures 180cm x 35cm with hand-twisted fringed ends. Provides exceptional warmth without excess bulk.',
    tag: 'NEW',
    isFeatured: false,
    colors: [
      {
        color: 'Slate Grey Herringbone',
        price: 1999,
        comparePrice: 2499,
        images: [
          'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['180x35 cm']
      }
    ]
  },
  {
    name: 'Double-Wrap Braided Leather Bracelet',
    slug: 'double-wrap-braided-leather-bracelet',
    categorySlug: 'accessories',
    subCategorySlug: 'wallets',
    subCategoryName: 'Wallets & Cardholders',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Genuine calfskin braided leather cord with brushed magnetic stainless steel locking clasp.',
    description: 'Rugged yet refined wristwear. Water-resistant treated leather designed to fit snugly and layer seamlessly next to metal or leather-strap watches.',
    tag: 'SALE',
    isFeatured: false,
    colors: [
      {
        color: 'Dark Brown',
        price: 1199,
        comparePrice: 1599,
        images: [
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['19cm', '21cm']
      }
    ]
  },
  {
    name: 'Full-Grain Leather Crossbody Messenger Bag',
    slug: 'full-grain-leather-crossbody-messenger-bag',
    categorySlug: 'accessories',
    subCategorySlug: 'bags',
    subCategoryName: 'Bags',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Compact daily messenger bag crafted from pull-up oiled leather with padded tablet sleeve.',
    description: 'Features a magnetic storm flap, zipped rear security pocket for passports and phones, and a comfortable cotton webbing shoulder strap.',
    tag: 'BESTSELLER',
    isFeatured: true,
    colors: [
      {
        color: 'Distressed Brown',
        price: 3799,
        comparePrice: 4599,
        images: [
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['Standard']
      }
    ]
  },
  {
    name: 'Hand-Finished Silk Knit Square Necktie',
    slug: 'hand-finished-silk-knit-square-necktie',
    categorySlug: 'accessories',
    subCategorySlug: 'belts',
    subCategoryName: 'Belts',
    brandName: 'H&M',
    brandSlug: 'h&m',
    shortDescription: '6cm modern textured necktie knit from 100% mulberry silk with clean straight hem.',
    description: 'Brings relaxed textural panache to tailoring. Knitted in Como, Italy, with flexible recovery and a rich cri de la soie crunch.',
    tag: 'POPULAR',
    isFeatured: false,
    colors: [
      {
        color: 'Midnight Blue',
        price: 1699,
        comparePrice: 2199,
        images: [
          'https://images.unsplash.com/photo-1589756823695-278bc923f962?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['6cm Wide']
      },
      {
        color: 'Burgundy Wine',
        price: 1699,
        comparePrice: 2199,
        images: [
          'https://images.unsplash.com/photo-1589756823695-278bc923f962?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['6cm Wide']
      }
    ]
  },
  {
    name: 'Classic Teardrop Aviator Sunglasses',
    slug: 'classic-teardrop-aviator-sunglasses',
    categorySlug: 'accessories',
    subCategorySlug: 'eyewear',
    subCategoryName: 'Eyewear',
    brandName: 'Zara',
    brandSlug: 'zara',
    shortDescription: 'Iconic military pilot sunglasses with slender gold-tone metal frames and crystal G-15 lenses.',
    description: 'Timeless style meeting optical perfection. Equipped with soft silicone nose pads, sweat bar top bridge, and 100% UV protection against harmful glare.',
    tag: 'NEW',
    isFeatured: true,
    colors: [
      {
        color: 'Gold / Green G-15',
        price: 2699,
        comparePrice: 3299,
        images: [
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1000&auto=format&fit=crop'
        ],
        sizes: ['58mm Standard']
      }
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB');

  const categoriesCol = mongoose.connection.db.collection('categories');
  const brandsCol = mongoose.connection.db.collection('brands');
  const productsCol = mongoose.connection.db.collection('products');
  const variantsCol = mongoose.connection.db.collection('product_variants');

  // Fetch parent categories
  const pantsCategory = await categoriesCol.findOne({ slug: 'pants' });
  const accessoriesCategory = await categoriesCol.findOne({ slug: 'accessories' });

  if (!pantsCategory || !accessoriesCategory) {
    throw new Error('Pants or Accessories parent category not found in DB!');
  }

  const pantsId = String(pantsCategory._id);
  const accessoriesId = String(accessoriesCategory._id);

  // Ensure subcategories exist
  const subCategoriesToEnsure = [
    { name: 'Chinos', slug: 'chinos', parentCategoryId: pantsId },
    { name: 'Cargo Pants', slug: 'cargo', parentCategoryId: pantsId },
    { name: 'Jeans & Denim', slug: 'jeans', parentCategoryId: pantsId },
    { name: 'Tailored Trousers', slug: 'tailored', parentCategoryId: pantsId },
    { name: 'Belts', slug: 'belts', parentCategoryId: accessoriesId },
    { name: 'Wallets & Cardholders', slug: 'wallets', parentCategoryId: accessoriesId },
    { name: 'Eyewear', slug: 'eyewear', parentCategoryId: accessoriesId },
    { name: 'Bags', slug: 'bags', parentCategoryId: accessoriesId },
  ];

  const subCatMap = new Map<string, string>();
  for (const sc of subCategoriesToEnsure) {
    let existing = await categoriesCol.findOne({ slug: sc.slug });
    if (!existing) {
      const inserted = await categoriesCol.insertOne({
        name: sc.name,
        slug: sc.slug,
        parentCategoryId: sc.parentCategoryId,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      subCatMap.set(sc.slug, String(inserted.insertedId));
      console.log(`Created subcategory: ${sc.name}`);
    } else {
      subCatMap.set(sc.slug, String(existing._id));
    }
  }

  // Ensure brands exist
  const brandsToEnsure = [
    { name: 'H&M', slug: 'h&m' },
    { name: 'Zara', slug: 'zara' },
    { name: "Levi's", slug: 'levis' },
    { name: 'Uniqlo', slug: 'uniqlo' },
  ];

  const brandMap = new Map<string, string>();
  for (const b of brandsToEnsure) {
    let existing = await brandsCol.findOne({ slug: b.slug });
    if (!existing) {
      const inserted = await brandsCol.insertOne({
        name: b.name,
        slug: b.slug,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      brandMap.set(b.slug, String(inserted.insertedId));
      console.log(`Created brand: ${b.name}`);
    } else {
      brandMap.set(b.slug, String(existing._id));
    }
  }

  console.log(`Seeding ${productsToSeed.length} products...`);
  let createdCount = 0;
  let variantCount = 0;

  for (const p of productsToSeed) {
    // Check if product already exists by slug
    const existing = await productsCol.findOne({ slug: p.slug });
    if (existing) {
      console.log(`Product "${p.name}" already exists. Skipping.`);
      continue;
    }

    const catId = p.categorySlug === 'pants' ? pantsId : accessoriesId;
    const subCatId = p.subCategorySlug ? subCatMap.get(p.subCategorySlug) || null : null;
    const brandId = p.brandSlug ? brandMap.get(p.brandSlug) || null : null;
    const primaryImg = p.colors[0]?.images[0] || '/images/product-1.jpeg';

    const productId = new mongoose.Types.ObjectId();
    const newProduct = {
      _id: productId,
      name: p.name,
      slug: p.slug,
      categoryId: catId,
      subCategoryId: subCatId,
      brandId: brandId,
      shortDescription: p.shortDescription,
      description: p.description,
      thumbnail: primaryImg,
      fit: p.fit || null,
      tag: p.tag || 'NEW',
      isFeatured: p.isFeatured ?? false,
      isActive: true,
      seoTitle: p.name,
      seoDescription: p.shortDescription,
      salesCount: Math.floor(Math.random() * 80) + 10,
      averageRating: parseFloat((4.3 + Math.random() * 0.6).toFixed(1)),
      reviewCount: Math.floor(Math.random() * 30) + 4,
      createdBy: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };

    await productsCol.insertOne(newProduct);
    createdCount++;

    // Generate variants for each color and size
    let isDefault = true;
    for (const c of p.colors) {
      for (const sz of c.sizes) {
        const skuNumber = Math.floor(1000 + Math.random() * 9000);
        const colorClean = c.color.split('/')[0].trim().toUpperCase().slice(0, 3);
        const sku = `YOX-${p.slug.toUpperCase().slice(0, 4)}-${colorClean}-${sz}-${skuNumber}`;

        const variantDoc = {
          _id: new mongoose.Types.ObjectId(),
          productId: String(productId),
          sku,
          title: `${p.name} - ${c.color} - ${sz}`,
          color: c.color,
          price: c.price,
          comparePrice: c.comparePrice || Math.round(c.price * 1.2),
          costPrice: Math.round(c.price * 0.6),
          stock: Math.floor(Math.random() * 35) + 10,
          lowStockThreshold: 5,
          weight: p.categorySlug === 'pants' ? 450 : 250,
          barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
          images: c.images,
          isDefault,
          isActive: true,
          size: sz,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0,
        };

        await variantsCol.insertOne(variantDoc);
        variantCount++;
        isDefault = false;
      }
    }
  }

  console.log(`\nSuccessfully created ${createdCount} products and ${variantCount} product variants in database!`);
  const finalCount = await productsCol.countDocuments();
  console.log(`Total products in database now: ${finalCount}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
