// src/data/categories.js
// All 20 category images imported as ES modules from src/assets/
// crop: 'none' | 'sm' | 'md' | 'lg'
//   none → object-fit: contain (image has no baked-in text, show fully)
//   sm   → slight upscale to clip bottom label strip
//   md   → moderate upscale
//   lg   → aggressive upscale for thick label strips

import imgPaan       from '../assets/paan-corner.avif';
import imgDairy      from '../assets/Diary,Bread &Eggs.avif';
import imgFruits     from '../assets/Fruits & Vegetables.avif';
import imgColdDrinks from '../assets/Cold Drinks & Juices.avif';
import imgSnacks     from '../assets/Snacks & Munchies.avif';
import imgBreakfast  from '../assets/Breakfast & Instant Food.avif';
import imgSweet      from '../assets/Sweet Tooth.avif';
import imgBakery     from '../assets/Bakery & Biscuits.avif';
import imgTea        from '../assets/Tea, Coffee & Milk Drinks.avif';
import imgAtta       from '../assets/Atta, Rice & Dal.avif';
import imgMasala     from '../assets/Masala, Oil & More.avif';
import imgSauces     from '../assets/Sauces & Spreads.avif';
import imgChicken    from '../assets/Chicken, Meat & Fish.avif';
import imgOrganic    from '../assets/Organic & Healthy Living.avif';
import imgBaby       from '../assets/Baby Care.avif';
import imgPharma     from '../assets/Pharma & Wellness.avif';
import imgCleaning   from '../assets/Cleaning Essentials.avif';
import imgHome       from '../assets/Home & Office.avif';
import imgPersonal   from '../assets/Personal Care.avif';
import imgPet        from '../assets/Pet Care.avif';

export const categories = [
  // ROW 1
  { id: 1,  name: 'Paan Corner',              slug: 'paan-corner',        image: imgPaan,       crop: 'md'   },
  { id: 2,  name: 'Dairy, Bread & Eggs',      slug: 'dairy-bread-eggs',   image: imgDairy,      crop: 'md'   },
  { id: 3,  name: 'Fruits & Vegetables',      slug: 'fruits-vegetables',  image: imgFruits,     crop: 'sm'   },
  { id: 4,  name: 'Cold Drinks & Juices',     slug: 'cold-drinks-juices', image: imgColdDrinks, crop: 'md'   },
  { id: 5,  name: 'Snacks & Munchies',        slug: 'snacks-munchies',    image: imgSnacks,     crop: 'md'   },
  { id: 6,  name: 'Breakfast & Instant Food', slug: 'breakfast-instant',  image: imgBreakfast,  crop: 'md'   },
  { id: 7,  name: 'Sweet Tooth',              slug: 'sweet-tooth',        image: imgSweet,      crop: 'sm'   },
  { id: 8,  name: 'Bakery & Biscuits',        slug: 'bakery-biscuits',    image: imgBakery,     crop: 'md'   },
  { id: 9,  name: 'Tea, Coffee & Milk Drinks',slug: 'tea-coffee-milk',    image: imgTea,        crop: 'md'   },
  { id: 10, name: 'Atta, Rice & Dal',         slug: 'atta-rice-dal',      image: imgAtta,       crop: 'md'   },
  // ROW 2
  { id: 11, name: 'Masala, Oil & More',       slug: 'masala-oil',         image: imgMasala,     crop: 'md'   },
  { id: 12, name: 'Sauces & Spreads',         slug: 'sauces-spreads',     image: imgSauces,     crop: 'md'   },
  { id: 13, name: 'Chicken, Meat & Fish',     slug: 'chicken-meat-fish',  image: imgChicken,    crop: 'md'   },
  { id: 14, name: 'Organic & Healthy Living', slug: 'organic-healthy',    image: imgOrganic,    crop: 'sm'   },
  { id: 15, name: 'Baby Care',                slug: 'baby-care',          image: imgBaby,       crop: 'md'   },
  { id: 16, name: 'Pharma & Wellness',        slug: 'pharma-wellness',    image: imgPharma,     crop: 'md'   },
  { id: 17, name: 'Cleaning Essentials',      slug: 'cleaning-essentials',image: imgCleaning,   crop: 'md'   },
  { id: 18, name: 'Home & Office',            slug: 'home-office',        image: imgHome,       crop: 'sm'   },
  { id: 19, name: 'Personal Care',            slug: 'personal-care',      image: imgPersonal,   crop: 'md'   },
  { id: 20, name: 'Pet Care',                 slug: 'pet-care',           image: imgPet,        crop: 'sm'   },
];

export const CATEGORY_LIST = categories.map(c => c.name);
