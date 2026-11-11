import type { PlaceDetails } from "./types";

// Longer write-ups for the Sylhet, Khulna and Barishal division places.
// Each entry: [about, best time, getting there, good to know?]
export const SYLHET_KHULNA_BARISHAL_DETAILS: Record<string, Record<string, PlaceDetails>> = {
  // ---- Sylhet ----
  habiganj: {
    "Satchari National Park": [
      "Satchari means 'seven streams', after the sandy streams that cross this small evergreen forest. It is one of the best places in the country to see the hoolock gibbon, the only ape of South Asia, along with langurs and nearly 200 kinds of birds.\n\nThree marked trails take from half an hour to three hours. A Tripura village lies inside the park.",
      "November to March; early morning for wildlife.",
      "At Chunarughat, on the old Dhaka–Sylhet road about 130 km from Dhaka; 3.5 hours by car.",
      "Hire a trained local guide at the entrance. Wear long trousers; there are leeches in the rains.",
    ],
    "Rema-Kalenga Wildlife Sanctuary": [
      "Rema-Kalenga is a large, remote forest on the Tripura border and is much less visited than Satchari. It shelters capped langurs, slow lorises, hornbills and many other birds.\n\nThere are trails of one, two and three hours, and a watchtower with a view over the canopy.",
      "November to March.",
      "In Chunarughat upazila, about 1.5 hours beyond Satchari on rough roads; a 4x4 or CNG is best.",
      "Take a guide and carry water and food; there are no shops inside.",
    ],
    "Habiganj tea gardens": [
      "Habiganj has more than twenty tea estates, mostly around Chunarughat, Madhabpur and Bahubal. The low hills are covered in neat rows of tea under tall shade trees.\n\nMany estates lie right beside the highway, so you can stop and walk among the bushes and watch the leaf being picked.",
      "April to November, the picking season, when the gardens are greenest.",
      "Along the Dhaka–Sylhet highway around Madhabpur and Shayestaganj, 3 hours from Dhaka.",
      "The estates are private; ask at the gate before walking in.",
    ],
    "Bithangal Akhra": [
      "Bithangal Akhra is a Vaishnav monastery founded in the 16th century by the saint Ramakrishna Goswami. It stands on raised ground in the middle of the haor.\n\nIn the monsoon it looks like an island and is reached only by boat. The monastery has more than a hundred rooms for monks and a large old bed made of stone.",
      "July to October by boat across the haor.",
      "By boat from Baniachong or from Habiganj's Kalardoba ghat, about 2 hours.",
    ],
    Baniachong: [
      "Baniachong is often described as one of the largest villages in Asia, with well over a hundred neighbourhoods spread around ponds and old mosques. It was once the seat of a powerful local kingdom.\n\nYou can see the ruins of the royal house, the large Sagar Dighi pond and the wetland forest at Lakshmi Baor nearby.",
      "November to February; the monsoon for haor views.",
      "About 20 km north of Habiganj town by CNG or bus.",
    ],
  },
  moulvibazar: {
    "Sreemangal tea gardens": [
      "Sreemangal is surrounded by dozens of tea estates rolling over low hills. Women pick two leaves and a bud by hand and carry the leaf in baskets on their backs.\n\nYou can walk or cycle the estate roads, visit a tea-tasting room and stay in a bungalow or eco-resort among the gardens.",
      "April to November for picking; November to February for cool weather.",
      "About 4 hours from Dhaka by road, or 4 to 5 hours by train to Sreemangal station.",
      "Ask before entering an estate and before photographing the workers.",
    ],
    "Lawachara National Park": [
      "Lawachara is a tropical forest with tall trees, a railway line running through it and one of the country's last groups of hoolock gibbons. You often hear their calls in the morning.\n\nTrails of half an hour, one hour and three hours start at the gate. Khasi families inside the park grow betel leaf on the trees.",
      "November to March; early morning.",
      "About 8 km from Sreemangal town on the Kamalganj road, by CNG.",
      "Hire an eco-guide at the gate. Do not feed the animals.",
    ],
    "Madhabkunda waterfall": [
      "At Madhabkunda the stream falls about 60 metres over a rock ledge into a pool. It is the best-known waterfall in Bangladesh and has an eco-park around it.\n\nThe walk from the gate passes a Khasi village and tea gardens. A smaller fall, Parikunda, is close by.",
      "June to October for the most water.",
      "In Barlekha upazila, about 70 km from Moulvibazar town; 2 hours by car.",
      "Swimming in the pool is not allowed; it is deep and people have drowned.",
    ],
    "Hum Hum waterfall": [
      "Hum Hum was little known until about 2010. It falls about 40 metres deep inside the Rajkandi reserve forest near the Indian border.\n\nThe trek takes two to three hours each way, over hills and along a stream bed, through bamboo and thick forest.",
      "June to October for water, though the trail is harder; winter is easier but the fall is thin.",
      "Start from Kolabon Para in Kamalganj, about an hour from Sreemangal by jeep.",
      "A local guide is essential. Wear trekking shoes and carry a stick; expect leeches in the rains.",
    ],
    "Baikka Beel": [
      "Baikka Beel is a protected part of Hail Haor where fishing is banned. Since it became a sanctuary, fish and birds have returned in great numbers.\n\nFrom the watchtower you can see purple swamphens, whistling ducks, herons and, in winter, many migratory ducks.",
      "November to February, at dawn or late afternoon.",
      "About 12 km from Sreemangal town by CNG; the last part is a dirt road.",
      "Bring binoculars.",
    ],
    "Hakaluki Haor": [
      "Hakaluki is made up of more than 230 connected beels spread across Moulvibazar and Sylhet. In the monsoon it becomes one vast lake; in winter it breaks into pools that attract tens of thousands of migratory ducks.\n\nBoats take you out among the swamp trees and fishing villages.",
      "November to February for birds; July to September for the full haor.",
      "Reach it from Kulaura or Juri in Moulvibazar, 1.5 hours from Sreemangal.",
    ],
    "Manipuri villages": [
      "The Manipuri people came from Manipur in India more than two centuries ago and settled around Kamalganj. They are known for their handloom weaving and their graceful classical dance.\n\nAt Adampur and Madhabpur you can see women weaving shawls, saris and bedcovers at home and buy from them directly. The Ras Leela festival is held each November.",
      "November for the Ras festival; any time for weaving.",
      "In Kamalganj upazila, about 40 minutes from Sreemangal by CNG.",
    ],
    "Bangladesh Tea Research Institute": [
      "The BTRI was set up in 1957 to develop better tea plants and methods. Its grounds have test gardens, a nursery, a tasting room and old British-era bungalows.\n\nIt is a good place to learn the difference between clone teas and how leaf becomes black tea.",
      "Any time; weekdays.",
      "About 2 km from Sreemangal town.",
      "You need permission at the gate to go inside.",
    ],
    "Nilkantha Tea Cabin": [
      "Romesh Ram Gour invented a tea with separate layers that do not mix, each a different colour and taste. He started with two layers and has reached seven and more.\n\nThe recipe is a family secret. A glass of seven-layer tea costs far more than ordinary tea, and almost every visitor to Sreemangal tries one.",
      "Any time of year.",
      "At Ramnagar Manipuri Para, about 4 km from Sreemangal town, with a second shop near the BDR camp.",
    ],
  },
  sunamganj: {
    "Tanguar Haor": [
      "Tanguar Haor is a wetland of about 100 square kilometres at the foot of the Meghalaya hills, and a Ramsar site of international importance. Some 140 kinds of fish and more than 200 kinds of birds are recorded here.\n\nMost people spend a night on a wooden houseboat, swimming, visiting the watchtower and the swamp forest, with the blue hills of India behind.",
      "July to September for full water and houseboats; December to February for migratory birds.",
      "Dhaka to Sunamganj by bus (6 to 7 hours), then by road to Tahirpur, where the boats leave.",
      "Book a registered boat with life jackets. Take your rubbish back with you.",
    ],
    "Niladri Lake": [
      "Niladri is a flooded limestone quarry at Tekerghat, officially named Shahid Siraj Lake. Its still blue water, with green mounds around and the Meghalaya hills behind, has earned it the nickname 'the Kashmir of Bangladesh'.\n\nIt is usually visited on the same boat trip as Tanguar Haor.",
      "July to February.",
      "At Tekerghat in Tahirpur, reached by houseboat across Tanguar Haor or by motorbike from Tahirpur.",
    ],
    "Barikka Tila": [
      "Barikka Tila is a low green hill on the border, above the Jadukata river. From the top you look down on the river's blue water and sand, and across to the mountains of Meghalaya.\n\nGaro and other families live on the hill.",
      "October to February.",
      "About 1.5 hours by motorbike from Sunamganj town or from Tahirpur, crossing the Jadukata by boat.",
    ],
    "Jadukata river": [
      "The Jadukata flows out of the Khasi Hills clear and blue over white sand. Hundreds of people work in it by hand, lifting sand, stone and coal from the riverbed into narrow boats.\n\nA small boat ride here, with the hills behind, is one of the prettiest in the country.",
      "October to March, when the water is clearest.",
      "At Laurergarh in Tahirpur upazila, about 1.5 hours from Sunamganj town by motorbike or CNG.",
    ],
    "Shimul garden": [
      "A local businessman planted about three thousand shimul trees in rows beside the Jadukata in the early 2000s. In spring every tree turns bright red with flowers, and the ground beneath is covered in fallen petals.\n\nWith the blue river and the hills behind, it draws photographers from all over the country.",
      "Early February to early March.",
      "At Manigaon in Tahirpur, near Barikka Tila.",
      "Outside the flowering weeks it is just a quiet garden of green trees.",
    ],
    "Hason Raja Museum": [
      "Hason Raja (1854–1922) was a zamindar who turned away from wealth and wrote hundreds of mystical folk songs still sung across Bengal. His family home in Sunamganj town is now a museum.\n\nIt shows his clothes, wooden sandals, swords, photographs and handwritten songs.",
      "Any time of year.",
      "At Tegharia in Sunamganj town, near the Surma river.",
    ],
  },
  sylhet: {
    Jaflong: [
      "Jaflong lies where the Piyain river leaves the Khasi Hills of Meghalaya. The river runs over rounded stones, and boats carry stone collectors and visitors back and forth.\n\nAcross the water you can see the hanging bridge at Dawki in India. Khasi villages with betel leaf gardens, and tea estates, are close by.",
      "June to October for full rivers and waterfalls; November to February for clear water.",
      "About 60 km from Sylhet city; 2 hours by car or bus.",
      "It is a border area: stay on the Bangladesh side of the markers.",
    ],
    "Ratargul swamp forest": [
      "Ratargul is a freshwater swamp forest on the Goain river. In the monsoon the water rises 20 to 30 feet and only the crowns of the koroch and hijol trees stand above it.\n\nYou glide through the trees in a small wooden boat rowed by a local boatman. A watchtower gives a view over the canopy.",
      "July to October, when the forest is flooded.",
      "About 26 km from Sylhet city; an hour by car to the ghat, then by boat.",
      "Wear a life jacket and keep quiet for the birds and monkeys. Snakes rest in the branches; do not touch the trees.",
    ],
    Bisnakandi: [
      "At Bisnakandi several streams come down from the Meghalaya hills and meet in a wide, stony riverbed. Layers of mountains rise behind, often with cloud on them.\n\nPeople come to sit in the cool, shallow water among the stones.",
      "June to October, when the water is high.",
      "About 2 hours by car from Sylhet city to Hadarpar ghat, then 30 minutes by boat.",
      "The current can be strong after rain in the hills. Stay within the border markers.",
    ],
    Lalakhal: [
      "Lalakhal is a stretch of the Shari river, which comes down from the Jaintia Hills. Minerals in the water give it a deep blue-green colour, especially in the dry season.\n\nA boat ride takes you past tea gardens and forested hills to the zero point at the border.",
      "November to March, when the colour is strongest.",
      "About 35 km from Sylhet city to Sarighat on the Jaflong road, then by boat for about an hour.",
    ],
    "Bholaganj Sada Pathor": [
      "Sada Pathor means 'white stone'. Where the Dholai river comes out of the hills at Bholaganj, the bed is covered in pale stones under clear, cold water.\n\nThe old ropeway that once carried stone for the railway still stands nearby.",
      "June to October for the most water; clear all winter.",
      "About 35 km north of Sylhet city on a good road to Bholaganj, then a short boat ride.",
    ],
    "Shah Jalal shrine": [
      "Hazrat Shah Jalal came to Sylhet in 1303 with 360 followers and is credited with bringing Islam to the region. His tomb on a low hill is the most visited shrine in Bangladesh.\n\nThe complex has a mosque, a pond of large catfish that pilgrims feed, and flocks of pigeons said to descend from those the saint was given.",
      "Any time; busiest on Thursdays and during the annual urs.",
      "In the centre of Sylhet city at Dargah Gate.",
      "Dress modestly and remove shoes. Women pray in a separate area and cannot go up to the tomb itself.",
    ],
    "Shah Paran shrine": [
      "Shah Paran was the nephew and follower of Shah Jalal. His tomb stands on a small hill at Khadim Nagar, reached by a wide flight of steps, under an old tree.\n\nMany pilgrims visit both shrines on the same day.",
      "Any time of year.",
      "About 8 km east of Sylhet city on the Jaflong road.",
      "Dress modestly and remove shoes.",
    ],
    "Malnicherra tea estate": [
      "Malnicherra was established in 1854 and is regarded as the oldest commercial tea garden in the subcontinent. It covers low hills right on the edge of Sylhet city.\n\nYou can walk the estate paths among the tea bushes and shade trees, with a guide from the gate.",
      "April to November for picking; pleasant all year.",
      "Beside the airport road, about 15 minutes from the city centre.",
      "The estate is private; pay the small entry fee at the gate.",
    ],
    "Keane Bridge and Ali Amjad's Clock": [
      "The iron Keane Bridge was built over the Surma in 1936 and is the gateway to the city from the railway station. At its north end stands a clock tower built in 1874 by a local zamindar and named for his son, Ali Amjad.\n\nThe riverbank beside them is a favourite evening walk.",
      "Evenings, any time of year.",
      "At the south edge of the city centre, by rickshaw.",
    ],
    "Panshi Restaurant": [
      "Panshi in Zindabazar is where Sylhet goes to eat. Dozens of bhortas (mashes), fish curries, beef with shatkora, duck and vegetables are laid out, and you order as many small dishes as you like with rice.\n\nIt is always busy, quick and inexpensive.",
      "Any time; expect a wait at lunch and dinner.",
      "At Jallarpar Road, Zindabazar, in the city centre.",
    ],
    "Shatkora beef": [
      "Shatkora is a thick-skinned wild citrus that grows in the Sylhet region. Pieces of its rind are cooked with beef, giving the curry a sharp, fragrant, slightly bitter taste found nowhere else.\n\nTry it at any Sylheti restaurant, and look for shatkora pickle to take home.",
      "Any time of year.",
      "Local restaurants in Zindabazar, Sylhet city.",
    ],
  },

  // ---- Khulna ----
  bagerhat: {
    "Sixty Dome Mosque": [
      "The Shat Gombuj Mosque was built in the mid-15th century by Khan Jahan Ali, the saint-general who founded the city of Khalifatabad. Despite its name it has 77 small domes, resting on sixty stone pillars.\n\nIt is the largest mosque left from the Sultanate period and the centre of a UNESCO World Heritage Site. A museum stands at the entrance.",
      "November to February.",
      "About 5 km west of Bagerhat town; 1 hour from Khulna and 4 hours from Dhaka by road.",
      "A working mosque: dress modestly and stay out during prayers. There is a higher ticket price for foreign visitors.",
    ],
    "Khan Jahan Ali shrine": [
      "Khan Jahan Ali died in 1459 and is buried in a single-domed tomb beside a large pond, the Thakur Dighi. Pilgrims come all year, and in great numbers at the full moon of the month of Chaitra.\n\nThe pond is famous for its mugger crocodiles, which people feed as an offering.",
      "November to February.",
      "About 3 km from the Sixty Dome Mosque, by rickshaw or auto.",
      "Dress modestly. Keep a safe distance from the crocodiles.",
    ],
    "Mosque City ruins": [
      "Khan Jahan's city once had hundreds of mosques, ponds, roads and bridges. Several small mosques survive among the villages and palm trees: the Nine Dome Mosque by the shrine pond, the Singair Mosque, the Bibi Begni Mosque and the Chunakhola Mosque.\n\nA rickshaw tour of them takes two or three hours.",
      "November to February.",
      "All lie within a few kilometres of the Sixty Dome Mosque.",
    ],
    Karamjal: [
      "Karamjal is the nearest part of the Sundarbans to Mongla port. A raised wooden walkway leads through the mangroves to a watchtower.\n\nThere is a breeding centre for saltwater crocodiles and spotted deer, and monkeys are everywhere. It suits a day visit when you have no time for a longer forest trip.",
      "November to February.",
      "About 45 minutes by boat from Mongla; Mongla is an hour from Bagerhat or Khulna.",
      "There is an entry fee, higher for foreign visitors.",
    ],
    "Bagerhat prawns": [
      "The south-west is called the land of 'white gold' for its prawn farms. Bagerhat's golda, the giant freshwater prawn, is exported around the world.\n\nLocally it is cooked as chingri malaikari, in coconut milk with mild spices, or fried whole with the head.",
      "Any time of year.",
      "Restaurants in Bagerhat town and near the mosque.",
    ],
  },
  chuadanga: {
    "Darshana Carew & Co": [
      "Carew & Company was founded at Darshana in 1938 and is the largest sugar mill complex in the country. It also runs the only licensed distillery in Bangladesh.\n\nDarshana is a railway border town, and the mill's old brick buildings and sugarcane fields surround it.",
      "November to March, the cane-crushing season.",
      "At Darshana, about 20 km from Chuadanga town; trains from Dhaka stop here.",
      "The factory itself is not open to the public without permission.",
    ],
    "Mathabhanga river": [
      "The Mathabhanga branches from the Padma and runs through Chuadanga's flat farmland. Its banks have bamboo groves, brick kilns and small ferry crossings.\n\nIt is a pleasant place for a walk in the cool season.",
      "November to February.",
      "The river passes beside Chuadanga town.",
    ],
  },
  jashore: {
    "Godkhali flower fields": [
      "Around Godkhali and Panisara, thousands of farmers grow roses, marigolds, tuberoses, gladioli and gerberas. The fields supply most of the country's cut flowers.\n\nBefore sunrise, farmers bring bundles of flowers by bicycle and van to the roadside wholesale market.",
      "December to February; busiest before 21 February and Pohela Falgun.",
      "At Jhikargacha, about 18 km west of Jashore town on the Benapole road.",
      "The market is over by about 8 am.",
    ],
    Sagardari: [
      "Michael Madhusudan Dutt (1824–1873) wrote the epic 'Meghnad Badh Kabya' and brought the sonnet to Bengali. He was born into a zamindar family at Sagardari on the Kopotakkho river.\n\nThe family house is a museum, and a week-long fair, Madhu Mela, is held around his birthday.",
      "November to February; Madhu Mela is in late January.",
      "In Keshabpur upazila, about 45 km south of Jashore town.",
      "Closed on Sundays, and on Monday mornings.",
    ],
    Benapole: [
      "Benapole, opposite Petrapole in India, handles most of the land trade between the two countries. Long lines of trucks wait on both sides.\n\nA flag-lowering ceremony is held at the gate in the afternoon. Most visitors come here only to cross to or from Kolkata.",
      "Any time of year.",
      "About 40 km west of Jashore town; buses and a train run from Dhaka.",
      "You need a valid Indian visa to cross.",
    ],
    "Jashore date molasses": [
      "Jashore has more date palms than any other district, and people say 'Jashorer josh, khejurer rosh': the pride of Jashore is date juice. Fresh sap is drunk cold at dawn and boiled into liquid nolen gur and solid patali.\n\nKhajura and Chowgacha are the best-known villages for it.",
      "December to February.",
      "Morning markets in Jashore town, Khajura and Chowgacha.",
      "Drink raw date sap only if it has been boiled or collected with a protective net, because of the risk of Nipah virus.",
    ],
  },
  jhenaidah: {
    Barobazar: [
      "Barobazar is believed to be the site of a medieval city called Shahr Muhammadabad. Since the 1990s, digging has uncovered more than a dozen mosques from the 15th and 16th centuries, hidden under mounds.\n\nThe Gorar Mosque, Galakata Mosque and Jor Bangla Mosque are the best restored, each beside its own pond.",
      "November to February.",
      "At Kaliganj, about 16 km south of Jhenaidah town on the Jashore road.",
    ],
    "Naldanga temples": [
      "The rajas of Naldanga built a group of temples here from the 17th century on. The Siddheshwari Kali temple is the most important, and several others have been restored.\n\nThe palace itself has gone, but the temples stand among trees by the Begabati river.",
      "November to February.",
      "In Kaliganj upazila, about 20 km from Jhenaidah town.",
    ],
    "Shailkupa Shahi Mosque": [
      "The Shailkupa Shahi Mosque dates from the Sultanate period, probably the early 16th century. It has six domes and thick brick walls with corner towers.\n\nIt is one of the oldest mosques in this part of the country and still in use.",
      "November to February.",
      "In Shailkupa town, about 25 km north-east of Jhenaidah.",
      "Dress modestly and avoid prayer times.",
    ],
  },
  khulna: {
    Sundarbans: [
      "The Sundarbans is the largest mangrove forest on earth, a UNESCO World Heritage Site spread across the delta. It is home to the Bengal tiger, spotted deer, crocodiles, river dolphins and hundreds of kinds of birds.\n\nYou live on a boat for two to four days and travel the rivers and creeks, with stops at Kotka, Kochikhali and Hiron Point for forest walks and a beach on the Bay of Bengal.",
      "November to February.",
      "Boats leave from Khulna or Mongla. Khulna is 4 to 5 hours from Dhaka by road, or a short flight to Jashore and 1.5 hours by road.",
      "You can only enter with a licensed operator, a forest permit and an armed forest guard. Seeing a tiger is rare; go for the forest itself.",
    ],
    "Rupsha river": [
      "The Rupsha runs along the east side of Khulna city and continues south towards the Sundarbans. The Khan Jahan Ali Bridge crosses it just outside town.\n\nThe ghats are busy with ferries and cargo boats, and the riverbank is where the city walks in the evening.",
      "November to March.",
      "The Rupsha ghat is 10 minutes from the centre of Khulna by rickshaw.",
    ],
    Dakkhindihi: [
      "Rabindranath Tagore's wife, Mrinalini Devi, came from the village of Dakkhindihi, and his mother's family was from here as well. The two-storey family house is kept as the Rabindra Complex.\n\nIt has a small museum, and fairs are held on Tagore's birth and death anniversaries.",
      "November to February; 25 Boishakh (early May) for the birthday fair.",
      "In Phultala upazila, about 20 km north of Khulna city.",
    ],
    "Chui jhal curry": [
      "Chui jhal is a climbing plant of the pepper family. Pieces of its stem and root are cooked with meat, giving a slow, warm heat and a special smell.\n\nKhulna, Bagerhat and Satkhira are known for mutton and beef with chui jhal, cooked with whole garlic bulbs. Chuknagar, west of the city, is famous for it.",
      "Any time of year.",
      "Restaurants in Khulna city and at Chuknagar bazar on the Satkhira road.",
    ],
  },
  kushtia: {
    "Lalon Shah shrine": [
      "Fakir Lalon Shah (died 1890) was a mystic who rejected caste and religious division and taught through songs. He is the central figure of the Baul tradition, which UNESCO lists as intangible heritage.\n\nHis white tomb at Cheuria is surrounded by followers, and Bauls sing here most evenings. Two big festivals a year fill the grounds with singers.",
      "The festivals in mid-October (his death anniversary) and at Dol Purnima in March; any evening otherwise.",
      "At Cheuria, about 2 km from Kushtia town centre, by rickshaw.",
    ],
    "Shilaidaha Kuthibari": [
      "Rabindranath Tagore managed his family's estates from this house near the Padma between 1891 and 1901. He wrote many of the poems of 'Sonar Tori' and 'Chitra' here and began translating 'Gitanjali'.\n\nThe three-storey house in its garden is a museum, with his furniture, boat, palanquin and photographs.",
      "November to February.",
      "About 15 km north-east of Kushtia town, across the Gorai river.",
      "Closed on Sundays, and on Monday mornings.",
    ],
    "Mir Mosharraf Hossain's home": [
      "Mir Mosharraf Hossain (1847–1911) wrote 'Bishad Sindhu', the famous prose epic about the tragedy of Karbala. He was born at Lahinipara.\n\nA memorial complex with a library and small museum stands on the site of his home.",
      "November to February.",
      "At Lahinipara in Kumarkhali upazila, about 10 km from Kushtia town.",
    ],
    "Gorai river": [
      "The Gorai is the main branch of the Ganges system flowing into south-west Bangladesh. At Kushtia it is wide, with sandbanks in winter.\n\nTagore knew this river well from his boat. The bank near the town and the bridge is a popular evening spot.",
      "November to February.",
      "On the edge of Kushtia town.",
    ],
    "Kushtia tilkhaja": [
      "Tilkhaja is a brittle, flaky sweet made by pulling hot sugar syrup until it is full of air and coating it with sesame seeds. Kushtia has made it for over a century.\n\nHawkers sell it on trains and at bus stands all over the country, always calling out 'Kushtiar tilkhaja'.",
      "Any time of year.",
      "Sweet shops and the tilkhaja workshops at Milpara in Kushtia town.",
    ],
  },
  magura: {
    "Raja Sitaram Roy's palace": [
      "Sitaram Roy was a local ruler who built an independent kingdom here around 1700 and defied the Mughal governor until he was defeated. His story became a famous novel by Bankim Chandra.\n\nAt Mohammadpur you can see the remains of his fort, palace gate, treasury and several temples and ponds.",
      "November to February.",
      "In Mohammadpur upazila, about 25 km from Magura town.",
    ],
    "Madhumati river": [
      "The Madhumati forms the eastern edge of Magura district. It is broad and gentle, with fishing boats, bathing ghats and mustard fields along its banks in winter.\n\nThe bridge at Mohammadpur gives a good view.",
      "November to February.",
      "At Mohammadpur, close to Sitaram Roy's palace.",
    ],
  },
  meherpur: {
    "Mujibnagar Memorial": [
      "On 17 April 1971, in a mango grove at Baidyanathtala, the first government of Bangladesh took its oath. The place was renamed Mujibnagar.\n\nThe memorial has 23 rising concrete walls for the 23 years of struggle. Nearby, a large outdoor map and sculptures show the events of the war by sector.",
      "November to February; 17 April for the anniversary.",
      "About 18 km from Meherpur town; Meherpur is 7 hours from Dhaka by road.",
    ],
    "Amjhupi Neelkuthi": [
      "British planters forced farmers in this region to grow indigo in the 19th century, and their factories were called neelkuthi. The one at Amjhupi, on the Kazla river, later became a zamindar's office.\n\nThe long, low building with its garden and river view is one of the best kept indigo houses in the country.",
      "November to February.",
      "About 7 km from Meherpur town.",
    ],
  },
  narail: {
    "S.M. Sultan's home and gallery": [
      "Sheikh Mohammed Sultan (1923–1994) painted farmers as powerful, muscular figures, celebrating the strength of rural Bengal. After years abroad he returned to live simply in Narail.\n\nThe complex beside the Chitra river has his house, his tomb, a gallery of his paintings and the large boat he built to take children out to draw.",
      "November to February; the Sultan Mela is in January.",
      "At Machimdia, on the edge of Narail town.",
    ],
    "Chitra river": [
      "The Chitra flows right through Narail town and gave its name to a well-known film, 'Chitra Nodir Pare'. It is narrow, green and slow, with old ghats and trees leaning over the water.\n\nA boat ride from the town ghat is the best way to see it.",
      "November to February.",
      "Boats can be hired at the ghats in Narail town.",
    ],
    "Narail boat races": [
      "Nouka baich, the racing of long, narrow boats with dozens of paddlers, is an old monsoon sport of Bengal. Narail's race on the Chitra, held around S.M. Sultan's birthday, is one of the biggest.\n\nThe banks fill with spectators, and the crews sing as they paddle.",
      "Around August to October; dates change each year.",
      "On the Chitra in Narail town.",
      "Ask locally for the date before you travel.",
    ],
  },
  satkhira: {
    "Sundarbans from Burigoalini": [
      "From Satkhira you can reach the Sundarbans by road, which is not possible anywhere else. At Munshiganj and Burigoalini in Shyamnagar, the forest is just across the river.\n\nDay boats go to the Kalagachia eco-tourism centre and longer trips to Dobeki and Mandarbaria.",
      "November to February.",
      "About 70 km south of Satkhira town to Munshiganj; Satkhira is 6 to 7 hours from Dhaka by road.",
      "A forest permit and guard are needed, arranged at the Burigoalini forest office.",
    ],
    "Mandarbaria beach": [
      "Mandarbaria is a long, empty beach where the Sundarbans meets the Bay of Bengal. The forest stands right behind the sand, and deer and tiger tracks are often seen.\n\nVery few people come, because it takes several hours by boat through the forest.",
      "November to February.",
      "By boat from Burigoalini or Nildumur, about 5 to 6 hours each way.",
      "Only with a licensed operator, permit and forest guard. There is nowhere to stay; you sleep on the boat.",
    ],
    "Satkhira sandesh": [
      "Satkhira's sandesh is made from fresh chhana cooked gently with sugar, or in winter with nolen gur from date palms. It is soft, grainy and not too sweet.\n\nThe district is also known for its milk, mangoes and kul (jujube).",
      "Any time; December to February for the date molasses kind.",
      "Sweet shops in Satkhira town.",
    ],
  },

  // ---- Barishal ----
  barguna: {
    "Sonakata beach": [
      "Sonakata lies in Taltali upazila, where a strip of quiet beach meets planted mangrove forest. It has an eco-park with wooden walkways and a small deer and crocodile centre.\n\nYou can see both sunrise and sunset from here, without the crowds of Kuakata.",
      "November to February.",
      "About 2 hours from Barguna town via Taltali, partly by boat.",
    ],
    "Tengragiri forest": [
      "Tengragiri, also called Fatrar Bon, is a coastal mangrove forest and wildlife sanctuary. It is sometimes called the second Sundarbans, with keora and gewa trees, wild boar, monkeys and many birds.\n\nIt lies just across the water from Kuakata.",
      "November to February.",
      "Reached from Taltali in Barguna, or by boat from Kuakata.",
    ],
  },
  barishal: {
    "Guthia Mosque": [
      "The Baitul Aman Mosque at Guthia was finished in 2006, paid for by a local businessman. It has a 193-foot minaret, several domes, fountains, flower gardens and a large pond.\n\nAt night the whole complex is lit, and people come from across the south to see it.",
      "Evenings, from November to March.",
      "At Guthia in Wazirpur upazila, about 20 km north of Barishal city on the Banaripara road.",
      "Dress modestly. Visitors are kept out of the prayer hall at prayer times.",
    ],
    "Durga Sagar": [
      "Durga Sagar was dug in 1780 by a local raja and named after his mother, Rani Durgavati. It is the largest pond in southern Bangladesh, with a wooded island in the middle.\n\nIn winter it fills with migratory ducks. A walking path and old trees surround the water.",
      "November to February.",
      "At Madhabpasha, about 12 km from Barishal city.",
    ],
    "Oxford Mission Church": [
      "The Epiphany Church was built in 1903 by the Oxford Mission. Its tall red-brick walls and rows of arches look more like a Greek temple than a village church, and it stood through great cyclones.\n\nThe compound has ponds, old trees and schools, and is very peaceful.",
      "Any time of year.",
      "At Bogra Road in the centre of Barishal city.",
      "Ask at the gate for permission to enter.",
    ],
    "Lakutia Zamindar Bari": [
      "The Roy family of Lakutia built this estate around 1700. The two-storey house, with its temples and ponds, was known for the family's support of culture and education.\n\nIt is now a ruin among fields and trees, good for photographs.",
      "November to February.",
      "About 8 km north of Barishal city.",
      "The building is not safe to climb.",
    ],
    "Bibir Pukur": [
      "Bibir Pukur is a square pond dug in 1908 for the town's drinking water, on the wish of a woman called Jinnat Bibi. It sits at the main crossroads of Barishal.\n\nLit fountains and benches make it the town's evening meeting place.",
      "Evenings, any time of year.",
      "In the centre of Barishal city, on Sadar Road.",
    ],
    "Overnight launch from Dhaka": [
      "The big three- and four-deck launches leave Sadarghat in Dhaka around 8 or 9 pm and reach Barishal before dawn. You can take a private cabin or sit on deck.\n\nYou travel down the Buriganga, Meghna and Kirtankhola with the lights of other boats around you. It is one of the classic journeys of Bangladesh.",
      "October to March, when the rivers are calm.",
      "Launches leave daily from Sadarghat terminal in Old Dhaka.",
      "Book a cabin a day or two ahead, earlier before Eid. Avoid stormy weather in April and May.",
    ],
  },
  bhola: {
    "Char Kukri Mukri": [
      "Char Kukri Mukri is a wildlife sanctuary on an island at the mouth of the Meghna. Planted mangrove forest covers much of it, with spotted deer, monkeys, otters and wild buffalo.\n\nNarrow creeks wind through the trees, and there is a sandy beach facing the sea. In winter thousands of migratory birds arrive.",
      "November to February.",
      "From Bhola town to Char Fasson (2.5 hours), then on to Kachchhapia ghat and a boat of about an hour.",
      "Places to stay are few; book the forest rest house or a homestay ahead.",
    ],
    "Monpura island": [
      "Monpura sits where the Meghna meets the sea. It is known for herds of deer in its mangrove plantations, buffalo yogurt, and the long landing station where you watch sunrise and sunset.\n\nA hit film of 2009, 'Monpura', made the name famous.",
      "November to February.",
      "By launch from Dhaka's Sadarghat (the Hatiya service stops here), or by sea-truck from Tajumuddin in Bhola.",
    ],
    "Meghna river": [
      "Bhola is the largest island in Bangladesh, with the Meghna on one side and the Tetulia on the other. The Meghna here is several kilometres wide, with strong currents.\n\nThe launch and ferry crossings give you a sense of the size of the river. The ghats at Ilisha are the main ilish landing points.",
      "November to March.",
      "By overnight launch from Dhaka to Bhola, or by ferry from Lakshmipur or Barishal.",
    ],
    "Bhola buffalo doi": [
      "Thousands of buffalo graze on the chars around Bhola. Their rich milk is set raw, without boiling, in clay pots to make a thick, slightly sour yogurt.\n\nIt is eaten with flattened rice, puffed rice and molasses, and is part of every wedding feast on the island.",
      "Any time of year.",
      "Sweet shops and the doi market in Bhola town and Char Fasson.",
    ],
  },
  jhalokati: {
    "Bhimruli floating market": [
      "Bhimruli is where three canals meet in the middle of the largest guava-growing area in the country. In season, hundreds of small boats loaded with green guavas gather here to sell to traders.\n\nThe farmers pole their boats along narrow canals from their orchards. It is one of the most colourful markets in Bangladesh.",
      "Mid-July to early September, in the morning.",
      "About 15 km from Jhalokati town; go by boat from Jhalokati or from Swarupkathi.",
      "Take a boat with a roof; it rains often in guava season.",
    ],
    "Backwater canals": [
      "A web of canals links the orchards and villages of Jhalokati, Pirojpur and Barishal. Guava, hog plum and coconut trees hang over the water, and every house has its own little boat.\n\nA half-day boat trip through them is calm and green in every season.",
      "July to September for the guava harvest; pleasant all year.",
      "Hire a boat at Jhalokati town or at Kirtipasha.",
    ],
  },
  patuakhali: {
    "Kuakata beach": [
      "Kuakata is called Sagar Kanya, the Daughter of the Sea. Its 18 km beach faces south, so you can see the sun rise from the sea in the east and set into it in the west.\n\nThe beach is wide and gently sloping. Motorbikes take visitors along the sand to the crab island, the mangrove edge and the fishing villages.",
      "November to February.",
      "About 6 to 7 hours from Dhaka by road over the Padma Bridge, or by overnight launch to Patuakhali and 2 hours by road.",
    ],
    Gangamati: [
      "Gangamati is where the beach meets a patch of mangrove forest, about 10 km east of Kuakata town. A small tidal channel cuts across the sand.\n\nPeople ride out before dawn to watch the sun come up over the sea and the trees. Red crabs cover the sand at low tide.",
      "November to February, at sunrise.",
      "By motorbike or van along the beach from Kuakata, about 30 minutes.",
    ],
    "Fatrar Char": [
      "Fatrar Char is a mangrove forest across the mouth of the Andharmanik river from Kuakata. Wooden walkways lead in among keora and gewa trees.\n\nYou may see monkeys, wild boar and many birds. Tourist boats leave the beach every morning.",
      "November to February.",
      "About an hour by tourist boat from Kuakata beach.",
    ],
    "Misripara Buddhist temple": [
      "The Rakhine village of Misripara has a temple with a seated Buddha more than 30 feet high, said to be among the largest in the country. The Rakhine came here from Arakan over two centuries ago.\n\nA market beside the temple sells their handwoven cloth.",
      "November to February.",
      "About 8 km from Kuakata by motorbike or van.",
      "Remove shoes and dress modestly.",
    ],
    "Rakhine villages": [
      "The Rakhine were the first settlers of Kuakata; the town's name comes from the well ('kua') they dug for fresh water. Their wooden houses stand on stilts, and the women weave on back-strap and frame looms.\n\nIn Kuakata town you can see the old well and the Sima Buddhist temple beside it, and shop at the Rakhine market.",
      "November to February.",
      "Keranipara is a short walk from Kuakata beach.",
    ],
    "Kuakata fish fry market": [
      "Each evening a row of stalls near the beach displays tuna, rupchanda, koral, prawns, crab and squid. You choose, they marinate it in spices and fry or barbecue it while you wait.\n\nThe nearby dried-fish village is also worth a look, if you can stand the smell.",
      "November to February.",
      "Beside the main beach point in Kuakata.",
      "Agree the price before cooking.",
    ],
  },
  pirojpur: {
    "Atghar-Kuriana floating market": [
      "At Atghar and Kuriana, on the Sandhya river system, farmers sell from boats all year: guavas and hog plums in the rains, vegetables, rice seedlings and even boats themselves. Kuriana is the centre of the guava trade.\n\nIt is a short boat ride from Bhimruli, so most people visit both.",
      "July to September for guavas; the boat market at Atghar is busiest in the monsoon.",
      "In Nesarabad (Swarupkathi) upazila, about 1.5 hours from Barishal by road.",
    ],
    "Swarupkathi guava gardens": [
      "Guava has been grown around Swarupkathi for about two hundred years. The orchards are planted on raised beds with ditches between, so farmers harvest and travel by boat.\n\nYou can float through the gardens and pick and eat guavas straight from the tree for a small fee.",
      "Mid-July to early September.",
      "Hire a boat at Swarupkathi or Kuriana.",
    ],
  },
};
