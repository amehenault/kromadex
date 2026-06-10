/* ============================================================
   data.js — Toutes les données statiques de l'app
   ============================================================ */

const DLC_CONFIG = [
  { id: 'base',          name: 'Jeu de base',       locked: true  },
  { id: 'deluxe',        name: 'Deluxe Pack',        locked: false },
  { id: 'arctic',        name: 'Arctic Pack',         locked: false },
  { id: 'south_america', name: 'South America Pack',  locked: false },
  { id: 'australia',     name: 'Australia Pack',      locked: false },
  { id: 'aquatic',       name: 'Aquatic Pack',        locked: false },
  { id: 'sea',           name: 'SE Asia Pack',        locked: false },
  { id: 'africa',        name: 'Africa Pack',         locked: false },
  { id: 'north_america', name: 'North America Pack',  locked: false },
  { id: 'europe',        name: 'Europe Pack',         locked: false },
  { id: 'wetlands',      name: 'Wetlands Pack',       locked: false },
  { id: 'conservation',  name: 'Conservation Pack',   locked: false },
  { id: 'twilight',      name: 'Twilight Pack',       locked: false },
  { id: 'grasslands',    name: 'Grasslands Pack',     locked: false },
  { id: 'tropical',      name: 'Tropical Pack',       locked: false },
  { id: 'arid',          name: 'Arid Pack',           locked: false },
  { id: 'oceania',       name: 'Oceania Pack',        locked: false },
  { id: 'eurasia',       name: 'Eurasia Pack',        locked: false },
  { id: 'barnyard',      name: 'Barnyard Pack',       locked: false },
  { id: 'zookeepers',    name: 'Zookeepers Pack',     locked: false },
  { id: 'americas',      name: 'Americas Pack',       locked: false },
  { id: 'asia',          name: 'Asia Pack',           locked: false },
];

const ANIMALS_BY_DLC = {
  base: [
    'Aardvark','African Buffalo','African Elephant','African Wild Dog',
    'Aldabra Giant Tortoise','American Bison','Bactrian Camel',"Baird's Tapir",
    'Bengal Tiger','Black Wildebeest','Boa Constrictor','Bongo','Bonobo',
    'Bornean Orangutan','Cheetah','Chinese Pangolin','Common Ostrich','Common Warthog',
    'Formosan Black Bear','Galapagos Giant Tortoise','Gemsbok','Gharial','Giant Panda',
    'Gila Monster','Golden Poison Frog','Goliath Frog','Greater Flamingo','Green Iguana',
    'Grizzly Bear','Himalayan Brown Bear','Hippopotamus','Indian Elephant','Indian Peafowl',
    'Indian Rhinoceros','Japanese Macaque','Mandrill','Nile Monitor','Nyala','Okapi',
    'Plains Zebra','Pronghorn Antelope','Red Panda','Red Ruffed Lemur',
    'Reticulated Giraffe','Ring-Tailed Lemur','Sable Antelope','Saltwater Crocodile',
    'Siberian Tiger','Snow Leopard','Spotted Hyena','Springbok','Timber Wolf',
    'West African Lion','Western Chimpanzee','Western Lowland Gorilla','Yellow Anaconda',
    'Black and White Ruffed Lemur','Red Deer','Collared Peccary','African Leopard',
  ],
  deluxe:        ['Komodo Dragon','Pygmy Hippo',"Thomson's Gazelle"],
  arctic:        ['Arctic Wolf','Dall Sheep','Polar Bear','Reindeer'],
  south_america: ['Colombian White-Faced Capuchin','Giant Anteater','Jaguar','Llama','Red-Eyed Tree Frog'],
  australia:     ['Koala','Dingo','Red Kangaroo','Southern Cassowary','Eastern Blue-Tongued Lizard'],
  aquatic:       ['King Penguin','Giant Otter','Grey Seal','Dwarf Caiman','Diamondback Terrapin'],
  sea:           ['Sun Bear','Clouded Leopard','Proboscis Monkey','Malayan Tapir','North Sulawesi Babirusa','Binturong','Dhole','Giant Malaysian Leaf Insect'],
  africa:        ['Meerkat','Fennec Fox','African Penguin','Southern White Rhinoceros','Scarab Beetle'],
  north_america: ['Moose','Cougar','California Sea Lion','North American Beaver','American Alligator','Black-Tailed Prairie Dog','Arctic Fox','American Bullfrog'],
  europe:        ['Alpine Ibex','Eurasian Lynx','European Fallow Deer','European Badger','Fire Salamander'],
  wetlands:      ['Asian Small-Clawed Otter','Capybara','Nile Lechwe','Platypus','Red-Crowned Crane','Spectacled Caiman','Wild Water Buffalo','Danube Crested Newt'],
  conservation:  ['Amur Leopard',"Przewalski's Horse",'Scimitar-Horned Oryx','Siamang','Axolotl'],
  twilight:      ['Raccoon','Red Fox','Common Wombat','Striped Skunk','Egyptian Fruit Bat'],
  grasslands:    ['Maned Wolf','Emu','Caracal','Red-Necked Wallaby','Nine-Banded Armadillo','Striped Hyena','Blue Wildebeest'],
  tropical:      ['Lar Gibbon','Fossa','Asian Water Monitor','Red River Hog','Brown-Throated Sloth'],
  arid:          ['Dromedary Camel','Addax','Dama Gazelle','African Crested Porcupine','Sand Cat','Black Rhinoceros','Somali Wild Ass','Desert Horned Viper'],
  oceania:       ['North Island Brown Kiwi','Tasmanian Devil','Little Penguin','Quokka','Spectacled Flying Fox'],
  eurasia:       ['Wisent','Wild Boar','Wolverine','Takin','Saiga','Sloth Bear','Mute Swan',"Hermann's Tortoise"],
  barnyard:      ['Highland Cattle','Sussex Chicken','Alpine Goat','Alpaca','American Standard Donkey','Hill Radnor Sheep','Tamworth Pig'],
  zookeepers:    ['Pallas Cat','Hamadryas Baboon','Markhor','Spectacled Bear','African Spurred Tortoise',"Kirk's Dik-Dik","Coquerel's Sifaka"],
  americas:      ['Greater Rhea','American Flamingo','Bush Dog','Ocelot','Coyote','White-Faced Saki','Bighorn Sheep'],
  asia:          ['Honey Badger','Japanese Raccoon Dog','Blackbuck','Nilgai','Lion-Tailed Macaque',"Père David's Deer",'Bornean Pygmy Elephant'],
};

/* ---- Titres créatifs pour les défis ---- */
const CHALLENGE_TITLES = [
  'L\'Appel de la Savane','Le Dernier Refuge','Royaume Sauvage','Les Gardiens de la Forêt',
  'Opération Conservation','L\'Éveil des Prédateurs','La Grande Migration','Sanctuaire Arctique',
  'Cœur de Jungle','Les Seigneurs de la Prairie','L\'Empire des Grands Fauves','Genèse Sauvage',
  'La Promesse du Zookeeper','Héritage Naturel','L\'Alliance des Espèces','Chroniques Animales',
  'Le Projet Éden','Forteresse Naturelle','Les Géants Oubliés','Renaissance Sauvage',
  'L\'Odyssée Animale','Territoire Interdit','Le Grand Défi','Aux Sources du Vivant',
  'La Cité des Bêtes','Pacte avec la Nature','L\'Arche Moderne','Les Guerriers de l\'Éden',
  'Marche pour la Survie','La Reconquête Sauvage','Horizon Sauvage','Les Veilleurs de Nuit',
  'Instinct Primordial','Le Règne Vert','L\'Aventure sans Frontières','Pulse Sauvage',
  'Les Derniers Nomades','Lumière sur les Espèces','Retour à l\'État Sauvage','L\'Empreinte Verte',
];

/* ---- Thèmes et leurs descriptions ---- */
const CHALLENGE_THEMES = [
  { name: 'Conservation',     desc: 'Sauve les espèces menacées et relâche-les dans la nature.' },
  { name: 'Safari Africain',  desc: 'Construis le zoo africain ultime et fais vivre la savane à tes visiteurs.' },
  { name: 'Aventure Arctique',desc: 'Recréé les glaces du Grand Nord et prends soin de ses habitants.' },
  { name: 'Jungle Tropicale', desc: 'Immerge tes visiteurs dans une forêt dense peuplée de créatures exotiques.' },
  { name: 'Réserve Aquatique',desc: 'Bâtis un paradis pour les animaux aquatiques et semi-aquatiques.' },
  { name: 'Désert et Aride',  desc: 'Montre la vie extraordinaire qui prospère dans les terres arides.' },
  { name: 'Nuit Sauvage',     desc: 'Le zoo s\'anime à la tombée du jour avec ses créatures nocturnes.' },
  { name: 'Monde des Primates',desc: 'Consacre ton zoo aux grands singes et à leurs cousins.' },
  { name: 'Domaine des Fauves',desc: 'Les grands prédateurs règnent en maîtres dans ton zoo.' },
  { name: 'Ferme Naturelle',  desc: 'Crée un espace éducatif autour des animaux de ferme et d\'élevage.' },
  { name: 'Tour du Monde',    desc: 'Présente des animaux des cinq continents à tes visiteurs.' },
  { name: 'Forêt Tempérée',   desc: 'Recréé les forêts d\'Europe et d\'Asie dans ton zoo.' },
  { name: 'Faune Insulaire',  desc: 'Mets à l\'honneur les espèces uniques des grandes îles du monde.' },
  { name: 'Zoo Éducatif',     desc: 'L\'éducation et la sensibilisation sont au cœur de ta mission.' },
  { name: 'Géants du Règne Animal', desc: 'Héberge les plus grandes et impressionnantes espèces de la planète.' },
];

/* ---- Modèles d'objectifs (les {VALEURS} sont remplacées dynamiquement) ---- */
const OBJECTIVE_TEMPLATES = {

  welfare: [
    { label: 'Bien-être animal',     text: 'Atteins un taux de bien-être moyen de {VAL}% pour tous les animaux de ton zoo.' },
    { label: 'Bien-être animal',     text: 'Maintiens le bien-être de tes {ANIMAL} au-dessus de {VAL}%.' },
    { label: 'Bien-être animal',     text: 'Assure un bien-être supérieur à {VAL}% pour au moins {COUNT} espèces différentes.' },
    { label: 'Santé du troupeau',    text: 'Veille à ce qu\'aucun animal dans ton zoo n\'ait un bien-être inférieur à {VAL}%.' },
  ],

  education: [
    { label: 'Éducation',            text: 'Atteins un taux d\'éducation moyen de {VAL}% chez tes visiteurs.' },
    { label: 'Éducation',            text: 'Assure-toi que {VAL}% de tes visiteurs repartent avec des connaissances sur la faune sauvage.' },
    { label: 'Sensibilisation',      text: 'Informe {VAL}% de tes visiteurs grâce aux panneaux éducatifs et aux éducateurs.' },
    { label: 'Mission éducative',    text: 'Maintiens le score d\'éducation de ton zoo au-dessus de {VAL}% pendant 3 mois consécutifs.' },
  ],

  happiness: [
    { label: 'Bonheur des visiteurs',text: 'Atteins un score de bonheur moyen de {VAL}% chez tes visiteurs.' },
    { label: 'Satisfaction',         text: 'Maintiens la satisfaction de tes visiteurs au-dessus de {VAL}%.' },
    { label: 'Expérience visiteur',  text: 'Obtiens une note de bonheur visiteur de {VAL}% ou plus pendant 2 mois.' },
    { label: 'Fidélisation',         text: 'Garde un taux de satisfaction visiteur supérieur à {VAL}% pendant une saison entière.' },
  ],

  stars: [
    { label: 'Note du zoo',          text: 'Atteins une note globale de {VAL} étoiles pour ton zoo.' },
    { label: 'Réputation',           text: 'Obtiens et maintiens une réputation de {VAL} étoiles pour l\'ensemble du zoo.' },
    { label: 'Classement',           text: 'Hisse ton zoo au rang de {VAL} étoiles aux yeux de tes visiteurs.' },
  ],

  revenue: [
    { label: 'Revenus',              text: 'Génère des revenus totaux de {VAL} $.' },
    { label: 'Finances',             text: 'Atteins un revenu mensuel de {VAL} $.' },
    { label: 'Rentabilité',          text: 'Accumule {VAL} $ de bénéfices dans ton zoo.' },
    { label: 'Chiffre d\'affaires',  text: 'Dépasse les {VAL} $ de revenus générés par les entrées et les boutiques.' },
  ],

  releases: [
    { label: 'Animaux relâchés',     text: 'Relâche {COUNT} {ANIMAL} dans la nature.' },
    { label: 'Conservation active',  text: 'Contribue à la conservation en relâchant {COUNT} animaux de ton zoo.' },
    { label: 'Programme de relâche', text: 'Lance un programme de relâche et libère {COUNT} {ANIMAL} dans leur habitat naturel.' },
    { label: 'Retour à la nature',   text: 'Relâche au moins {COUNT} animaux de {COUNTSPECIES} espèces différentes.' },
  ],

  births: [
    { label: 'Naissances',           text: 'Célèbre la naissance de {COUNT} {ANIMAL} dans ton zoo.' },
    { label: 'Programme d\'élevage', text: 'Fais naître {COUNT} petits dans ton zoo grâce à un programme d\'élevage.' },
    { label: 'Reproduction',         text: 'Obtiens {COUNT} naissances au total dans ton zoo.' },
    { label: 'Nurserie',             text: 'Accueille {COUNT} nouveau-nés de {ANIMAL} dans la nurserie de ton zoo.' },
  ],

  species: [
    { label: 'Diversité',            text: 'Héberge au moins {COUNT} espèces différentes dans ton zoo.' },
    { label: 'Collection',           text: 'Agrandis ta collection à {COUNT} espèces uniques.' },
    { label: 'Biodiversité',         text: 'Présente {COUNT} espèces à tes visiteurs simultanément.' },
    { label: 'Catalogue vivant',     text: 'Enrichis ton zoo jusqu\'à atteindre {COUNT} espèces distinctes.' },
  ],

  specific_animal: [
    { label: 'Espèce vedette',       text: 'Accueille au moins {COUNT} {ANIMAL} dans ton zoo et assure leur bien-être.' },
    { label: 'Enclos spécial',       text: 'Construis un enclos pour {ANIMAL} et maintiens leur bonheur au-dessus de {VAL}%.' },
    { label: 'Ambassadeurs',         text: 'Fais de tes {ANIMAL} les ambassadeurs de ton zoo — atteins {COUNT} individus.' },
    { label: 'Espèce phare',         text: 'Tes {ANIMAL} sont la fierté du zoo : héberges-en {COUNT} avec un bien-être de {VAL}%.' },
  ],

  conservation_credits: [
    { label: 'Crédits conservation', text: 'Accumule {VAL} crédits de conservation pour ton zoo.' },
    { label: 'Points conservation',  text: 'Génère {VAL} crédits conservation grâce à tes programmes d\'élevage.' },
    { label: 'Fonds de conservation',text: 'Atteins {VAL} crédits conservation via les relâches et les naissances.' },
  ],

  staff: [
    { label: 'Personnel',            text: 'Emploie et forme au moins {COUNT} soigneurs spécialisés dans ton zoo.' },
    { label: 'Équipe vétérinaire',   text: 'Recrute {COUNT} vétérinaires et assure leur formation complète.' },
    { label: 'Équipe éducative',     text: 'Engage {COUNT} éducateurs pour animer les visites de ton zoo.' },
  ],

  enclosures: [
    { label: 'Enclos enrichis',      text: 'Construis {COUNT} enclos avec un score d\'enrichissement maximal.' },
    { label: 'Habitat naturel',      text: 'Crée {COUNT} habitats qui reproduisent fidèlement l\'environnement naturel des animaux.' },
    { label: 'Espaces optimisés',    text: 'Aménage {COUNT} enclos avec tous les enrichissements disponibles pour les espèces hébergées.' },
  ],
};
