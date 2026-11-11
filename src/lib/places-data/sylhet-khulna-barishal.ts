import { p, type PlaceSeed } from "./types";

// Sylhet (4), Khulna (10) and Barishal (6) divisions
export const SYLHET_KHULNA_BARISHAL_PLACES: Record<string, PlaceSeed[]> = {
  // ---- Sylhet ----
  habiganj: [
    p("Satchari National Park", "NATURE", "A rainforest with hoolock gibbons, langurs and a Tripura village inside.", "Hire a local guide at the gate; go early for the gibbons.", "Satchari National Park"),
    p("Rema-Kalenga Wildlife Sanctuary", "NATURE", "One of the largest natural forests in the country, with birds and trekking trails.", undefined, "Rema-Kalenga"),
    p("Habiganj tea gardens", "NATURE", "Rolling tea estates along the Dhaka–Sylhet highway.", undefined, "Habiganj tea garden"),
    p("Bithangal Akhra", "RELIGIOUS", "A Vaishnav monastery on the haor at Baniachong, reached by boat in the monsoon.", undefined, "Bithangal"),
    p("Baniachong", "EXPERIENCE", "Often called one of the largest villages in Asia, with old houses and ponds.", undefined, "Baniachong"),
  ],
  moulvibazar: [
    p("Sreemangal tea gardens", "NATURE", "The tea capital of Bangladesh: walk through the estates and watch the pickers at work.", undefined, "Sreemangal tea garden"),
    p("Lawachara National Park", "NATURE", "A tropical rainforest with hoolock gibbons and Khasi villages.", "Take a guided trail; stay on the paths.", "Lawachara"),
    p("Madhabkunda waterfall", "NATURE", "One of the best-known waterfalls in the country, about 60 metres high.", undefined, "Madhabkunda"),
    p("Hum Hum waterfall", "NATURE", "A hidden waterfall deep in the Rajkandi forest, reached by a jungle trek.", "Go with a local guide; the trail is muddy in the rains.", "Hum Hum waterfall"),
    p("Baikka Beel", "NATURE", "A protected wetland with an observation tower, full of migratory birds in winter.", undefined, "Baikka Beel"),
    p("Hakaluki Haor", "NATURE", "Asia's largest haor-wetland complex, important for winter birds.", undefined, "Hakaluki Haor"),
    p("Manipuri villages", "MARKET", "Manipuri weavers in Kamalganj make colourful handloom shawls and saris.", undefined, "Manipuri weaving"),
    p("Bangladesh Tea Research Institute", "SIGHT", "Tea gardens and research grounds where you can learn how tea is grown.", undefined, "Bangladesh Tea Research Institute"),
    p("Nilkantha Tea Cabin", "FOOD", "Home of the famous seven-layer tea, each layer a different colour and taste.", undefined, "Seven layer tea"),
  ],
  sunamganj: [
    p("Tanguar Haor", "NATURE", "A vast wetland below the Meghalaya hills. Spend a night on a houseboat.", "Best in the monsoon for water, in winter for birds.", "Tanguar Haor"),
    p("Niladri Lake", "NATURE", "A blue-green lake in an old limestone quarry at Tekerghat.", undefined, "Niladri Lake"),
    p("Barikka Tila", "NATURE", "A hill with views over the Jadukata river and the Indian hills.", undefined, "Barikka Tila"),
    p("Jadukata river", "NATURE", "A clear river flowing out of the Meghalaya hills.", undefined, "Jadukata"),
    p("Shimul garden", "NATURE", "A huge garden of shimul (silk cotton) trees that turns red in February.", "Go in February for the flowers.", "Shimul garden Sunamganj"),
    p("Hason Raja Museum", "SIGHT", "The home and museum of the mystic poet Hason Raja.", undefined, "Hason Raja"),
  ],
  sylhet: [
    p("Jaflong", "NATURE", "Clear water and stone beds of the Piyain river below the Khasi Hills.", undefined, "Jaflong"),
    p("Ratargul swamp forest", "NATURE", "Bangladesh's only freshwater swamp forest, explored by small boat.", "Best from July to October, when the forest is flooded.", "Ratargul"),
    p("Bisnakandi", "NATURE", "A meeting of streams, stones and hills right at the border.", undefined, "Bisnakandi"),
    p("Lalakhal", "NATURE", "A river with striking blue-green water, lovely by boat.", undefined, "Lalakhal"),
    p("Bholaganj Sada Pathor", "NATURE", "White stones and clear water where the river leaves the hills.", undefined, "Bholaganj"),
    p("Shah Jalal shrine", "RELIGIOUS", "The shrine of Hazrat Shah Jalal, the most visited in the country.", "Dress modestly and remove shoes.", "Shah Jalal Dargah"),
    p("Shah Paran shrine", "RELIGIOUS", "The hilltop shrine of Shah Jalal's nephew, on the edge of the city.", undefined, "Shah Paran"),
    p("Malnicherra tea estate", "NATURE", "Said to be the first commercial tea garden in the subcontinent, from 1854.", undefined, "Malnicherra"),
    p("Keane Bridge and Ali Amjad's Clock", "SIGHT", "Sylhet's old iron bridge over the Surma and its riverside clock tower.", undefined, "Keane Bridge"),
    p("Panshi Restaurant", "FOOD", "A busy Zindabazar restaurant known for Bengali curries and bhorta at low prices.", undefined, "Bengali cuisine"),
    p("Shatkora beef", "FOOD", "Sylhet's signature curry, beef cooked with shatkora, a sour local citrus.", undefined, "Shatkora"),
  ],

  // ---- Khulna ----
  bagerhat: [
    p("Sixty Dome Mosque", "RELIGIOUS", "A huge 15th-century mosque, the centrepiece of the UNESCO-listed Mosque City of Bagerhat.", undefined, "Sixty Dome Mosque"),
    p("Khan Jahan Ali shrine", "RELIGIOUS", "The tomb of the city's founder, beside a pond with resident crocodiles.", undefined, "Khan Jahan Ali Mausoleum"),
    p("Mosque City ruins", "SIGHT", "Several smaller Sultanate mosques spread through the villages, such as the Nine Dome and Singair mosques.", undefined, "Nine Dome Mosque Bagerhat"),
    p("Karamjal", "NATURE", "A forest station in the Sundarbans near Mongla, with a boardwalk and deer and crocodile centre.", undefined, "Karamjal"),
    p("Bagerhat prawns", "FOOD", "The district is full of prawn farms; try golda chingri cooked in coconut milk.", undefined, "Chingri malai curry"),
  ],
  chuadanga: [
    p("Darshana Carew & Co", "SIGHT", "One of the oldest sugar mills and distilleries in the region, from the British era.", undefined, "Carew & Co"),
    p("Mathabhanga river", "NATURE", "A quiet river through farming villages.", undefined, "Mathabhanga"),
  ],
  jashore: [
    p("Godkhali flower fields", "NATURE", "Fields of marigolds, roses and gladioli; the country's flower capital.", "Visit early in the morning when the flower market is on.", "Godkhali"),
    p("Sagardari", "SIGHT", "Birthplace of poet Michael Madhusudan Dutt, on the Kopotakkho river.", undefined, "Sagardari"),
    p("Benapole", "EXPERIENCE", "The busiest land border with India.", undefined, "Benapole"),
    p("Jashore date molasses", "FOOD", "Jashore's khejur gur and patali gur are famous across the country in winter.", undefined, "Khejur gur"),
  ],
  jhenaidah: [
    p("Barobazar", "SIGHT", "An ancient city site at Kaliganj with many excavated Sultanate mosques.", undefined, "Barobazar"),
    p("Naldanga temples", "RELIGIOUS", "A group of old temples built by the Naldanga rajas.", undefined, "Naldanga"),
    p("Shailkupa Shahi Mosque", "RELIGIOUS", "A multi-domed mosque from the Sultanate period.", undefined, "Shailkupa"),
  ],
  khulna: [
    p("Sundarbans", "NATURE", "The world's largest mangrove forest and home of the Bengal tiger, explored on a boat trip.", "Book a licensed operator; trips include the permit and armed forest guard.", "Sundarbans Bangladesh"),
    p("Rupsha river", "NATURE", "Khulna's river, with a cable-stayed bridge and busy boatyards.", undefined, "Rupsha"),
    p("Dakkhindihi", "SIGHT", "The family home of Tagore's wife, Mrinalini Devi.", undefined, "Dakkhindihi"),
    p("Chui jhal curry", "FOOD", "Mutton or duck cooked with chui jhal, a spicy stem that gives Khulna's food its kick.", undefined, "Chuijhal"),
  ],
  kushtia: [
    p("Lalon Shah shrine", "RELIGIOUS", "The shrine of the mystic singer Lalon at Cheuria, where Bauls gather to sing.", "The big festivals are in October and March.", "Lalon Shah"),
    p("Shilaidaha Kuthibari", "SIGHT", "Tagore's riverside estate house, where he wrote much of his poetry.", undefined, "Shilaidaha Kuthibari"),
    p("Mir Mosharraf Hossain's home", "SIGHT", "Birthplace of the author of 'Bishad Sindhu', at Lahinipara.", undefined, "Mir Mosharraf Hossain"),
    p("Gorai river", "NATURE", "A gentle river near Shilaidaha, nice by country boat.", undefined, "Gorai river"),
    p("Kushtia tilkhaja", "FOOD", "A crunchy sesame sweet Kushtia is famous for.", undefined, "Tilkhaja"),
  ],
  magura: [
    p("Raja Sitaram Roy's palace", "SIGHT", "The ruins of an 18th-century rebel raja's capital at Mohammadpur.", undefined, "Sitaram Roy"),
    p("Madhumati river", "NATURE", "A wide, slow river along the district's edge.", undefined, "Madhumati river"),
  ],
  meherpur: [
    p("Mujibnagar Memorial", "SIGHT", "Where Bangladesh's government in exile took its oath in April 1971.", undefined, "Mujibnagar Memorial"),
    p("Amjhupi Neelkuthi", "SIGHT", "An old indigo planters' house from the British period.", undefined, "Amjhupi"),
  ],
  narail: [
    p("S.M. Sultan's home and gallery", "SIGHT", "The home of one of Bangladesh's greatest painters, on the Chitra river.", undefined, "S. M. Sultan"),
    p("Chitra river", "NATURE", "A beautiful river with quiet villages and fishing boats.", undefined, "Chitra river"),
    p("Narail boat races", "EXPERIENCE", "Traditional long-boat races held on the Chitra.", undefined, "Boat race Bangladesh"),
  ],
  satkhira: [
    p("Sundarbans from Burigoalini", "NATURE", "Enter the western Sundarbans from Shyamnagar, quieter than the Khulna side.", undefined, "Satkhira Sundarbans"),
    p("Mandarbaria beach", "NATURE", "A remote beach at the edge of the Sundarbans, reached only by boat.", undefined, "Mandarbaria"),
    p("Satkhira sandesh", "FOOD", "Satkhira is known for its sandesh, made with date molasses in winter.", undefined, "Sandesh"),
  ],

  // ---- Barishal ----
  barguna: [
    p("Sonakata beach", "NATURE", "A quiet beach with mangroves at Fatrar Char.", undefined, "Barguna"),
    p("Tengragiri forest", "NATURE", "A mangrove forest on the coast, part of a wildlife sanctuary.", undefined, "Tengragiri"),
  ],
  barishal: [
    p("Guthia Mosque", "RELIGIOUS", "A modern mosque complex with gardens and a pond, beautiful when lit at night.", undefined, "Guthia Mosque"),
    p("Durga Sagar", "NATURE", "A huge old reservoir with an island in the middle and migratory birds.", undefined, "Durga Sagar"),
    p("Oxford Mission Church", "RELIGIOUS", "A tall red-brick church from the early 1900s in a peaceful compound.", undefined, "Oxford Mission Church"),
    p("Lakutia Zamindar Bari", "SIGHT", "The ruins of a zamindar house just outside the city.", undefined, "Lakutia Zamindar Bari"),
    p("Bibir Pukur", "SIGHT", "The old pond at the heart of Barishal town.", undefined, "Bibir Pukur"),
    p("Overnight launch from Dhaka", "EXPERIENCE", "Take a cabin on one of the big river launches from Sadarghat and wake up in Barishal.", "Book a cabin in advance.", "Barisal launch"),
  ],
  bhola: [
    p("Char Kukri Mukri", "NATURE", "A wild island of mangroves, deer and birds in the Meghna estuary.", undefined, "Char Kukri Mukri"),
    p("Monpura island", "NATURE", "A green island known for its deer, dairy buffaloes and the film 'Monpura'.", undefined, "Monpura"),
    p("Meghna river", "NATURE", "Bhola sits in the mouth of the Meghna; the ferry crossing itself is part of the trip.", undefined, "Meghna river"),
    p("Bhola buffalo doi", "FOOD", "Thick yogurt made from buffalo milk, a speciality of Bhola's islands.", undefined, "Mishti doi"),
  ],
  jhalokati: [
    p("Bhimruli floating market", "MARKET", "Guava farmers sell from their boats on the canal; busiest in July and August.", "Go early in the morning in guava season.", "Bhimruli floating market"),
    p("Backwater canals", "EXPERIENCE", "Explore the narrow canals and orchards by small boat.", undefined, "Jhalokati canal"),
  ],
  patuakhali: [
    p("Kuakata beach", "NATURE", "One of the few beaches where you can watch both sunrise and sunset over the sea.", undefined, "Kuakata sea beach"),
    p("Gangamati", "NATURE", "The eastern end of Kuakata beach, the best spot for sunrise.", undefined, "Kuakata Gangamati"),
    p("Fatrar Char", "NATURE", "A mangrove forest across the water from Kuakata.", undefined, "Fatrar Char"),
    p("Misripara Buddhist temple", "RELIGIOUS", "A Rakhine temple with one of the largest Buddha statues in the region.", undefined, "Misripara"),
    p("Rakhine villages", "EXPERIENCE", "Visit the Rakhine community and their weaving around Kuakata.", undefined, "Rakhine Kuakata"),
    p("Kuakata fish fry market", "FOOD", "Pick fresh fish, crab or squid at the beach stalls and have it fried in front of you.", undefined, "Kuakata"),
  ],
  pirojpur: [
    p("Atghar-Kuriana floating market", "MARKET", "Boats piled with guava and vegetables on the canals near Swarupkathi.", "Season is July to September.", "Kuriana floating market"),
    p("Swarupkathi guava gardens", "NATURE", "Canals lined with guava orchards; take a boat through them.", undefined, "Swarupkathi"),
  ],
};
