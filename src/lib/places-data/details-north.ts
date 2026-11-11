import type { PlaceDetails } from "./types";

// Longer write-ups for the Rajshahi, Rangpur and Mymensingh division places.
// Each entry: [about, best time, getting there, good to know?]
const ARCH = "Closed on Sundays, and on Monday mornings.";

export const NORTH_DETAILS: Record<string, Record<string, PlaceDetails>> = {
  // ---- Rajshahi ----
  bogura: {
    Mahasthangarh: [
      "Mahasthangarh is the site of Pundranagar, capital of the ancient Pundra kingdom. A stone inscription found here dates the city to at least the 3rd century BC, and it was lived in for some 1,500 years.\n\nThe citadel is a huge rectangle of earth and brick walls beside the Karatoya river. You can walk the ramparts and see the gateways, a well and temple remains.",
      "November to February.",
      "About 13 km north of Bogura town on the Rangpur road. Bogura is 4 to 5 hours from Dhaka by road.",
      ARCH,
    ],
    "Mahasthan Museum": [
      "The site museum stands just outside the citadel walls. It shows objects from across two thousand years: terracotta plaques, stone sculptures of Buddhist and Hindu gods, coins, beads and pottery.\n\nThe gardens around it are well kept and a nice place to rest.",
      "November to February.",
      "Beside the north wall of Mahasthangarh.",
      ARCH,
    ],
    "Behular Bashor Ghar": [
      "This brick mound at Gokul, about 13 metres high, is made of 172 small blind cells filled with earth to support a shrine on top. It was built in the 6th or 7th century, probably as a Buddhist stupa.\n\nFolk tradition says it is the wedding chamber of Behula and Lakhindar, the lovers of the Manasa legend.",
      "November to February.",
      "At Gokul village, about 2 km south of Mahasthangarh.",
    ],
    "Vasu Vihara": [
      "Vasu Vihara, called Narapatir Dhap locally, has the remains of two monasteries and a shrine from around the 8th century. The Chinese pilgrim Xuanzang is thought to have visited it.\n\nHundreds of bronze images and terracotta plaques were found here.",
      "November to February.",
      "About 6 km north-west of Mahasthangarh, by auto.",
    ],
    "Kherua Mosque": [
      "The Kherua Mosque was built in 1582, just as the Mughals were replacing the old sultans, and it shows both styles. It has three domes, thick walls and corner towers.\n\nIt stands in a quiet garden of palm trees at Sherpur.",
      "November to February.",
      "In Sherpur upazila, about 20 km south of Bogura town.",
      "Dress modestly and avoid prayer times.",
    ],
    "Bogura doi": [
      "Bogura's doi is thick, lightly caramel-coloured and sweet, set in shallow clay bowls called shora. The craft began in Sherpur about two centuries ago and has a Geographical Indication mark.\n\nAkbaria and Asia Sweets in the town are among the best-known sellers. Shops pack the pots for travel.",
      "Any time of year.",
      "Sweet shops around Satmatha in Bogura town.",
    ],
  },
  joypurhat: {
    "Lakma Rajbari": [
      "The Lakma Rajbari at Panchbibi was built by a local zamindar family some two to three hundred years ago. Two crumbling buildings with arches and thick walls stand among fields, a short way from the Indian border.\n\nJoypurhat town is also the nearest base for Paharpur, half an hour away in Naogaon.",
      "November to February.",
      "In Panchbibi upazila, about 20 km north of Joypurhat town.",
      "The ruins are unstable; look from outside.",
    ],
  },
  naogaon: {
    "Somapura Mahavihara, Paharpur": [
      "King Dharmapala of the Pala dynasty built Somapura Mahavihara in the late 8th century. For four hundred years it was one of the great centres of Buddhist learning, visited by monks from Tibet, China and Burma.\n\nThe square monastery has 177 cells around a tall cross-shaped temple, whose base is lined with terracotta plaques of people, animals and gods. It is a UNESCO World Heritage Site.",
      "November to February.",
      "In Badalgachhi upazila, about 35 km from Naogaon town and 15 km from Joypurhat. From Dhaka, take a train or bus to Joypurhat (6 to 7 hours).",
      ARCH + " There is a higher ticket price for foreign visitors.",
    ],
    "Kusumba Mosque": [
      "The Kusumba Mosque was built in 1558–59 under the Afghan Sur rulers. Unlike most Bengal mosques its brick walls are faced with dark stone, carved with flowers and vines.\n\nIt stands beside a very large pond and was shown on the five-taka note.",
      "November to February.",
      "In Manda upazila, about 35 km from Naogaon town on the Rajshahi road.",
      "Dress modestly and avoid prayer times.",
    ],
    "Jagaddal Vihara": [
      "Jagaddal was founded in the late 11th century by King Ramapala, and was the last great Buddhist monastery built in Bengal. Scholars here translated many texts later carried to Tibet.\n\nThe excavated site shows the monastery's plan and carved stone pillars.",
      "November to February.",
      "In Dhamoirhat upazila, about 65 km from Naogaon town.",
    ],
    "Dibar Dighi": [
      "Dibar Dighi is a large reservoir with an eight-sided granite pillar rising about nine metres from the middle of the water. It is thought to be a victory pillar raised by the Kaivarta chief Divya in the 11th century.\n\nNobody is sure how the single block of stone was set in place.",
      "November to February.",
      "In Patnitala upazila, about 55 km from Naogaon town.",
    ],
    "Bhimer Panti": [
      "Bhimer Panti is a black stone pillar from the 9th or 10th century, set up by a minister of the Pala kings. A Sanskrit inscription on it praises his family and the god Vishnu; the top once carried a Garuda figure.\n\nLocals link it to Bhima, the strong man of the Mahabharata.",
      "November to February.",
      "At Mangalbari in Dhamoirhat upazila, near Jagaddal Vihara.",
    ],
    "Patisar Kachharibari": [
      "Patisar, on the Nagor river, was the Tagore family's own estate, and Rabindranath came here often by boat. He set up a farmers' bank here with his Nobel Prize money.\n\nThe estate office is a museum with his belongings, letters and photographs.",
      "November to February.",
      "In Atrai upazila, about 45 km south of Naogaon town.",
    ],
  },
  natore: {
    "Natore Rajbari": [
      "The Natore Raj was one of the largest estates in Bengal. In the 18th century it was ruled by Rani Bhabani, remembered for her charity and the many temples and ponds she built.\n\nThe palace grounds cover a wide area with two groups of buildings, the Boro Taraf and Chhoto Taraf, several temples and large moats.",
      "November to February.",
      "About 2 km north of Natore town centre, by rickshaw.",
    ],
    "Uttara Gonobhaban": [
      "The Dighapatia Raj palace was rebuilt after the 1897 earthquake, with a clock-tower gate, Italian marble statues and gardens of rare trees. Since 1972 it has been the official northern residence of the head of government.\n\nParts of the grounds and a small museum are open to visitors.",
      "November to February.",
      "About 3 km north of Natore town.",
      "Closed on some weekdays and when official guests are staying; check before you go.",
    ],
    "Chalan Beel": [
      "Chalan Beel is the largest beel in the country, spreading over parts of Natore, Sirajganj and Pabna. In the monsoon dozens of rivers pour into it and it becomes a single sheet of water.\n\nBoats take you to villages on raised mounds. In winter the land dries to rice and mustard fields, and the fish is dried in the sun.",
      "July to October for water; December to January for mustard fields.",
      "Go to Singra or Gurudaspur in Natore, about an hour from Natore town.",
    ],
    "Halti Beel": [
      "Halti Beel in Naldanga fills deep in the monsoon. A submersible road runs across it from Patul to Khajura; when the water rises over the road, people walk and ride along it with water on both sides.\n\nIt has been nicknamed 'mini Cox's Bazar', with boats and food stalls at Patul ghat.",
      "July to October.",
      "At Patul, about 10 km north of Natore town.",
    ],
    "Natore kacha golla": [
      "Despite the name, kacha golla is not a ball but a soft, crumbly sweet made of fresh chhana and sugar, cooked only lightly. The story goes that a sweet-maker invented it one day when his workers did not come.\n\nIt has a Geographical Indication mark. The old shops at Lalbazar are the place to buy it.",
      "Any time of year.",
      "Sweet shops at Lalbazar in Natore town.",
      "It keeps for only a day or two without a fridge.",
    ],
  },
  "chapai-nawabganj": {
    "Choto Sona Mosque": [
      "The 'Small Golden Mosque' was built between 1493 and 1519 in Gaur, the old capital of Bengal that now lies across the border. Its fifteen domes were once gilded, and its walls are faced with carved black stone.\n\nBeside it are the graves of Captain Mohiuddin Jahangir, a hero of the 1971 war, and other fighters.",
      "November to February; June for mango season.",
      "At Shibganj, about 35 km from Chapai Nawabganj town near the Sona Masjid land port.",
      "Dress modestly and avoid prayer times.",
    ],
    "Darasbari Mosque": [
      "Darasbari was built in 1479 with a madrasa beside it; the name means 'house of lessons'. The roof has fallen, leaving tall brick walls with rich terracotta.\n\nThe madrasa ruins across the pond show forty rooms around a courtyard.",
      "November to February.",
      "About 1 km from the Choto Sona Mosque, close to the border.",
    ],
    Tahkhana: [
      "Tahkhana means 'cool house'. Shah Shuja, the Mughal governor, built this three-storey palace in the 17th century for the saint Shah Niamatullah, with rooms opening onto a large pond to catch the breeze.\n\nA three-domed mosque and the saint's tomb stand beside it.",
      "November to February.",
      "About 500 metres from the Choto Sona Mosque.",
    ],
    "Shah Niamatullah's tomb": [
      "Shah Niamatullah Wali was a Sufi who came from Delhi in the 17th century and settled at Gaur. His square, single-domed tomb has twelve doors.\n\nAn urs is held here each year, and the shrine is always busy with visitors.",
      "November to February.",
      "Next to the Tahkhana palace.",
      "Dress modestly and remove shoes.",
    ],
    "Kansat mango market": [
      "Chapai Nawabganj is the mango capital of Bangladesh, and Kansat is its biggest market. In season, thousands of bicycles and vans arrive each morning carrying baskets of gopalbhog, khirsapat, langra and fazli.\n\nThe khirsapat mango of this district has a Geographical Indication mark.",
      "Late May to July.",
      "At Kansat in Shibganj upazila, about 25 km from Chapai Nawabganj town.",
    ],
    "Kalai ruti": [
      "Kalai ruti is a thick flatbread of mashkalai (black gram) and rice flour, shaped by hand and cooked on a clay pan. It is eaten hot with mashed eggplant, crushed chili and salt, or with beef or duck.\n\nIt began as farmers' food on the Padma chars and is now sold at roadside stalls across the district.",
      "November to February, when it is best hot.",
      "Roadside stalls in Chapai Nawabganj town.",
    ],
  },
  pabna: {
    "Hardinge Bridge": [
      "The Hardinge Bridge, opened in 1915, carries the railway across the Padma at Paksey on fifteen steel spans. It was damaged in the 1971 war and repaired.\n\nThe Lalon Shah road bridge runs beside it. The riverbank below is a popular picnic spot, with the two bridges together in view.",
      "November to February.",
      "At Paksey in Ishwardi upazila, about 30 km from Pabna town.",
    ],
    "Jor Bangla temple": [
      "This small 18th-century temple is built as two curved 'Bangla' hut roofs joined together, a style special to Bengal. Its front is covered in terracotta panels.\n\nIt stands in a quiet neighbourhood of Pabna town.",
      "November to February.",
      "At Kalachandpara in Pabna town, by rickshaw.",
    ],
    "Suchitra Sen's house": [
      "Suchitra Sen (1931–2014) was the greatest star of Bengali cinema's golden age. She grew up in this house in Pabna before moving to Kolkata.\n\nThe house has been restored as a memorial with photographs of her life and films.",
      "Any time of year.",
      "At Gopalpur in Pabna town.",
    ],
    "Chatmohar Shahi Mosque": [
      "The Chatmohar Shahi Mosque was built in 1581 by Masum Khan Kabuli, an Afghan chief who held this area against the Mughals. It has three domes and unusually thick brick walls.\n\nA Persian inscription from the mosque is kept in the Varendra Museum.",
      "November to February.",
      "In Chatmohar town, about 30 km north-east of Pabna.",
      "Dress modestly and avoid prayer times.",
    ],
    "Satsang Ashram": [
      "Sri Sri Thakur Anukul Chandra (1888–1969) was born at Hemayetpur and founded the Satsang movement here. The ashram has temples, his birthplace and a memorial hall.\n\nLarge gatherings of followers from Bangladesh and India are held on his birthday.",
      "Any time; the birthday festival is in September.",
      "At Hemayetpur, about 5 km from Pabna town, beside the mental hospital.",
    ],
    "Pabna ghee": [
      "The Pabna and Sirajganj area is the dairy heartland of Bangladesh, with cattle grazing on the river grasslands. Pabna's ghee, slowly cooked from butter, is known for its grainy texture and nutty smell.\n\nSweet shops in town also sell good doi and pera.",
      "Any time of year.",
      "Dairy and sweet shops in Pabna town.",
    ],
  },
  rajshahi: {
    "Puthia temple complex": [
      "The Puthia Raj family built a remarkable group of temples around their palace and ponds between the 16th and 19th centuries. The tall white Shiva temple, the five-spired Govinda temple and the small Jagannath and Anhik temples are covered in terracotta.\n\nThe palace itself, from 1895, faces a large open field.",
      "November to February.",
      "At Puthia, about 30 km east of Rajshahi city on the Natore road.",
    ],
    "Varendra Research Museum": [
      "Founded in 1910, the Varendra Research Museum is the oldest museum in Bangladesh, now run by Rajshahi University. Its building is in a Hindu-Buddhist revival style.\n\nThe collection of black stone sculptures of Hindu and Buddhist gods from the Pala and Sena periods is the finest in the country.",
      "Any time of year.",
      "In the centre of Rajshahi city, near Hetem Khan.",
      "Closed one or two days a week; check the opening days before you go.",
    ],
    "Padma riverbank": [
      "Rajshahi stretches along the north bank of the Padma. An embankment walk runs for kilometres, with the T-bandh and Lalon Shah park the favourite spots.\n\nIn winter the river shrinks and a wide sand char appears; boats take you across to walk on it at sunset.",
      "November to February, at sunset.",
      "A few minutes from the city centre by rickshaw.",
    ],
    "Bagha Mosque": [
      "The Bagha Mosque was built in 1523 by Sultan Nusrat Shah beside a large pond. It has ten domes and walls rich with terracotta flowers, vines and mango motifs.\n\nIt appears on the fifty-taka note. A big fair is held here at Eid.",
      "November to February.",
      "At Bagha, about 40 km south-east of Rajshahi city.",
      "Dress modestly and avoid prayer times.",
    ],
    "Shah Makhdum shrine": [
      "Shah Makhdum Ruposh came to Rajshahi in the 13th century and is honoured as the saint who brought Islam to the area. Legend says he crossed the Padma on the back of a crocodile.\n\nHis shrine stands at Dargahpara near the river, and the city's airport and many institutions carry his name.",
      "Any time of year.",
      "At Dargahpara, close to the Padma riverbank in the city.",
      "Dress modestly and remove shoes.",
    ],
    "Rajshahi silk": [
      "Rajshahi is called the Silk City. Mulberry trees are grown in the region, and the cocoons are reeled and woven in factories at the BSCIC estate in Sapura.\n\nShowrooms there let you see the looms and buy saris, panjabis, scarves and cloth by the yard.",
      "Any time of year.",
      "At Sapura, about 3 km from the city centre.",
    ],
    "Rajshahi mangoes": [
      "Mango orchards cover the countryside of Rajshahi. Each variety comes in its own weeks: gopalbhog first, then himsagar (khirsapat), langra, amrapali and finally fazli.\n\nBaneshwar, east of the city, is the biggest mango market in the district.",
      "Late May to July.",
      "Markets in the city, and at Baneshwar on the Natore road.",
    ],
    "Kalai ruti": [
      "In Rajshahi, kalai ruti stalls open at dusk. Women pat the black gram dough into thick rounds by hand and bake them on clay pans over wood fires.\n\nEach comes with eggplant bhorta, chili paste and salt; many places add beef bhuna or duck.",
      "November to February evenings.",
      "Stalls around Upashahar and the Court area in Rajshahi city.",
    ],
  },
  sirajganj: {
    "Jamuna Bridge": [
      "The Jamuna Bridge opened in 1998 and is 4.8 km long. It carries road, rail, power and gas across one of the widest and most restless rivers in the world, joining the north-west to Dhaka.\n\nA separate railway bridge has since been built beside it. The riverbank parks at the west end give good views.",
      "November to February.",
      "About 20 km from Sirajganj town; about 3 hours from Dhaka by road.",
      "You cannot stop on the bridge.",
    ],
    "Rabindra Kachharibari, Shahzadpur": [
      "The Tagore family bought the Shahzadpur estate in 1840, and Rabindranath stayed here many times in the 1890s. He wrote parts of 'Sonar Tori', 'Chitra' and several short stories in this house.\n\nThe yellow two-storey building is a museum with his furniture, piano, palanquin and paintings.",
      "November to February; 25 Boishakh (early May) for the birthday festival.",
      "In Shahzadpur town, about 45 km south of Sirajganj town.",
      ARCH,
    ],
    "Navaratna temple, Hatikumrul": [
      "Navaratna means 'nine jewels', for the nine spires this three-storey temple once had. It was built in the early 18th century and was covered in terracotta.\n\nThree smaller temples stand around it in a quiet village.",
      "November to February.",
      "At Hatikumrul in Ullapara upazila, close to the Hatikumrul highway junction.",
    ],
    "Hard Point riverfront": [
      "Hard Point is a long protective embankment built to save Sirajganj town from the Jamuna's erosion. Its top is a wide promenade.\n\nIn the evening the whole town seems to be here, eating fuchka and watching the sun set over a river so wide you cannot see the other bank.",
      "November to February, at sunset.",
      "On the east edge of Sirajganj town, by rickshaw.",
    ],
    "Sirajganj handloom": [
      "Sirajganj has more handlooms than any other district. In Belkuchi, Enayetpur and Shahzadpur, the clack of looms comes from almost every house.\n\nThey weave cotton saris, lungis and gamchha, sold at huge weekly cloth markets in Shahzadpur and Enayetpur.",
      "Any time of year.",
      "Belkuchi is about 20 km south of Sirajganj town.",
    ],
  },

  // ---- Rangpur ----
  dinajpur: {
    "Kantajew Temple": [
      "Maharaja Pran Nath began the Kantajew Temple in 1704 and his son finished it in 1752. Every inch of its three storeys is covered in terracotta panels, about 15,000 of them.\n\nThey tell the Ramayana and Mahabharata and show hunting, boats, soldiers and daily life of the time. It is the finest terracotta temple in Bangladesh.",
      "November to February; the Rash Mela fair is in November.",
      "About 20 km north of Dinajpur town, beside the Dhepa river.",
    ],
    Ramsagar: [
      "Ramsagar was dug in the 1750s by Raja Ram Nath to bring water to his people after a drought. It is counted as the largest man-made pond in the country, over a kilometre long.\n\nIt is now a small national park, with deer, picnic spots and old trees around the water.",
      "November to February.",
      "About 8 km south of Dinajpur town.",
    ],
    "Dinajpur Rajbari": [
      "The Dinajpur Raj was among the richest estates in north Bengal. The palace compound had three main blocks, the Aina Mahal, Rani Mahal and Thakurbari Mahal, with temples and ponds.\n\nMuch of it is ruined, but the Krishna temple and the gateways still show its former scale.",
      "November to February.",
      "On the north-east edge of Dinajpur town, by rickshaw.",
    ],
    "Nayabad Mosque": [
      "The Nayabad Mosque was built in 1793. Tradition says it was made by the Muslim craftsmen who came from the west to build the Kantajew Temple and settled here.\n\nIt has three domes and terracotta decoration, and stands beside the Dhepa river.",
      "November to February.",
      "About 1.5 km from the Kantajew Temple.",
      "Dress modestly and avoid prayer times.",
    ],
    "Singra forest": [
      "Singra National Park is a sal forest in Birganj. The Norto river runs along it, and it is home to birds, jackals and other small wildlife.\n\nIt is a pleasant place for a quiet walk.",
      "November to February.",
      "In Birganj upazila, about 40 km north of Dinajpur town.",
    ],
    "Dinajpur litchis": [
      "Dinajpur grows the best litchis in Bangladesh. The Bedana variety, with a tiny seed and thick sweet flesh, is the most prized, followed by China-3 and Bombai.\n\nThe season is short. The Kalitola market in town turns red with fruit, sold by the hundred.",
      "Mid-May to mid-June.",
      "Kalitola market in Dinajpur town, and orchards at Masimpur.",
    ],
  },
  gaibandha: {
    "Balashi ghat": [
      "Balashi ghat sits on the Brahmaputra-Jamuna in Fulchhari. Railway ferries once carried trains across the river from here to Bahadurabad.\n\nNow it is a boat ghat and a favourite outing, with a sandy shore, food stalls and engine boats to the chars.",
      "November to February.",
      "About 8 km east of Gaibandha town.",
    ],
    "Brahmaputra chars": [
      "A large part of Gaibandha's people live on chars in the Brahmaputra and Teesta. They grow maize, chili and pumpkins in the sand and move house when the river eats the land.\n\nBoat schools, floating clinics and horse carts are part of daily life here.",
      "November to February.",
      "By engine boat from Balashi ghat or Fulchhari ghat.",
      "Go with someone local; chars have no hotels or shops for visitors.",
    ],
    Bardhankuthi: [
      "Bardhankuthi was the seat of an old line of local rajas, later zamindars, going back several centuries. The remains of the palace stand in the grounds of a college.\n\nIt is the main historic site of Gobindaganj.",
      "November to February.",
      "In Gobindaganj town, about 35 km south of Gaibandha.",
    ],
    Roshmanjuri: [
      "Roshmanjuri is made of tiny balls of chhana, about the size of marbles, simmered in thick, reduced milk. It was first made in Gaibandha in the 1940s and has become the district's signature.\n\nIt is served cold in small bowls.",
      "Any time of year.",
      "Sweet shops in Gaibandha town, around Circular Road.",
    ],
  },
  kurigram: {
    "Chilmari river port": [
      "Chilmari was a major river port in British times, on the route between Assam and Kolkata. Abbasuddin's bhawaiya song 'Oki garial bhai... Chilmarir bondore' made its name known to every Bengali.\n\nBoats still leave here for Roumari and the chars across the huge river.",
      "November to February.",
      "About 35 km south of Kurigram town.",
    ],
    "Brahmaputra chars": [
      "Sixteen rivers run through Kurigram, and it has more than four hundred chars. Life here follows the floods: houses are built to be taken apart and moved.\n\nA day on a char shows farming on sand, cattle herding and the music of bhawaiya, the folk song of the north.",
      "November to February.",
      "By boat from Chilmari or from the Jatrapur ghat near Kurigram town.",
      "Go with a local guide and return before dark.",
    ],
    "Dharla river": [
      "The Dharla enters Bangladesh from India and joins the Brahmaputra near Kurigram. A long bridge crosses it just outside the town.\n\nThe sandy banks by the bridge are the town's evening walk, with boats for hire.",
      "November to February.",
      "About 3 km from Kurigram town.",
    ],
  },
  lalmonirhat: {
    "Teesta Barrage": [
      "The Teesta Barrage at Dalia-Doani has 44 gates and feeds the largest irrigation project in the country. The Teesta spreads wide behind it.\n\nGardens and rest houses surround it, and in winter the pools attract migratory birds.",
      "November to February.",
      "At Doani in Hatibandha upazila, about 60 km from Lalmonirhat town.",
    ],
    "Tin Bigha corridor": [
      "Dahagram-Angarpota is a piece of Bangladesh surrounded by India. The Tin Bigha corridor is the narrow strip of Indian land, leased to Bangladesh, that connects it to the mainland.\n\nIt is open around the clock since 2011, and you cross a few metres of India guarded by both countries' border forces.",
      "November to February.",
      "In Patgram upazila, about 90 km from Lalmonirhat town.",
      "Carry your passport; guards may ask for ID. Photography at the gates is restricted.",
    ],
    "Burimari land port": [
      "Burimari faces Changrabandha in India. It is the main overland route from Bangladesh to Siliguri, Darjeeling, Sikkim and on to Bhutan and Nepal.\n\nThe town is mostly truck yards and money changers.",
      "Any time of year.",
      "In Patgram upazila, about 100 km from Lalmonirhat town; direct buses run from Dhaka overnight.",
      "You need a valid Indian visa that lists this port.",
    ],
    "Kakina Zamindar Bari": [
      "The Kakina zamindars were known as patrons of literature and learning in north Bengal in the 19th century. Little of the palace remains beyond some walls, ponds and temples.\n\nThe estate lies beside the Teesta.",
      "November to February.",
      "At Kakina in Kaliganj upazila, about 25 km from Lalmonirhat town.",
    ],
  },
  nilphamari: {
    Nilsagar: [
      "Nilsagar is a large old reservoir linked in legend to King Birat of the Mahabharata; it was once called Birat Dighi. Trees line its banks, with a temple on one side and a shrine on the other.\n\nIn winter it is a resting place for migratory ducks.",
      "November to February.",
      "About 14 km south-west of Nilphamari town.",
    ],
    "Saidpur railway town": [
      "The Assam Bengal Railway built its main workshop at Saidpur in 1870, and it is still the largest railway workshop in Bangladesh. The town has red-brick colonial quarters, an old church and a mixed Bengali and Urdu-speaking community.\n\nIt is also the airport town for the whole north.",
      "November to February.",
      "About 20 km south of Nilphamari town; an hour's flight from Dhaka.",
      "The workshop needs permission to enter.",
    ],
    "Chini Mosque, Saidpur": [
      "The Chini Mosque was begun in 1863 and later covered in pieces of coloured china and glass, set into patterns of flowers, vases and stars. It has dozens of small minarets.\n\nIt is the best-known building in Saidpur.",
      "November to February.",
      "At Islambagh in Saidpur town.",
      "Dress modestly and avoid prayer times.",
    ],
  },
  panchagarh: {
    "Kanchenjunga view, Tetulia": [
      "Tetulia is the northernmost town of Bangladesh. On clear mornings in late autumn, the snow peaks of Kanchenjunga (8,586 m), about 150 km away, appear above the horizon, turning from orange to white as the sun rises.\n\nThe best spots are the Dak Bungalow lawn and the banks of the Mahananda.",
      "Late October to mid-December, at sunrise.",
      "About 40 km north of Panchagarh town; Panchagarh is 9 to 10 hours from Dhaka by bus or train.",
      "The view depends on the weather; plan two or three mornings to be safe.",
    ],
    "Tetulia Dak Bungalow": [
      "The Tetulia Dak Bungalow was built in the British period on a high bank above the Mahananda. Across the river are the tea gardens and villages of India.\n\nThe lawn beside it is the classic place to sit at sunset or to wait for Kanchenjunga at dawn.",
      "October to February.",
      "In Tetulia town.",
    ],
    "Panchagarh tea gardens": [
      "Tea came to Panchagarh only in 2000, on flat land, unlike the hill gardens of Sylhet. Many small farmers now grow it alongside large organic estates like Kazi & Kazi.\n\nThe neat green fields against the far mountains make a striking sight.",
      "April to November for picking.",
      "Around Tetulia and along the road from Panchagarh town.",
      "Ask before entering an estate.",
    ],
    "Mahananda river stone collectors": [
      "The Mahananda marks the border at Tetulia. Its water is shallow and clear, and men and women wade in with nets and tubes to gather stones washed down from the Himalaya.\n\nThe stones are sorted on the bank and sold for construction.",
      "November to March.",
      "On the riverbank below the Tetulia Dak Bungalow.",
      "The middle of the river is the border; do not cross.",
    ],
    "Banglabandha zero point": [
      "Banglabandha is the northern tip of Bangladesh and its only land port with links to India, Nepal and Bhutan; Nepal is under 60 km away and Bhutan about 70 km.\n\nA zero-point marker stands at the gate, and a flag ceremony is held with the Indian side.",
      "October to February.",
      "About 17 km north of Tetulia.",
    ],
    Bhitargarh: [
      "Bhitargarh is one of the largest ancient fort cities in South Asia, dating from around the 6th century. Four rings of earth and brick walls enclose about 25 square kilometres.\n\nInside is the huge Maharaja Dighi pond. Excavation is still uncovering temples and gateways.",
      "November to February.",
      "About 16 km north-east of Panchagarh town.",
    ],
  },
  rangpur: {
    "Tajhat Palace": [
      "Maharaja Gopal Lal Roy, a jeweller turned zamindar, built Tajhat Palace in the early 20th century. A broad marble staircase rises to the first floor under a ribbed dome.\n\nIt served for a time as a High Court bench and is now the Rangpur Museum, with terracotta, manuscripts and stone sculptures.",
      "November to February.",
      "About 3 km south-east of Rangpur city centre.",
      ARCH,
    ],
    "Begum Rokeya's home": [
      "Begum Rokeya Sakhawat Hossain (1880–1932) was a writer and the pioneer of education for Muslim women in Bengal. Her story 'Sultana's Dream' imagined a world run by women.\n\nThe ruins of her family home at Pairaband stand beside a memorial centre and library. Rokeya Day is marked here on 9 December.",
      "November to February; 9 December for Rokeya Day.",
      "At Pairaband in Mithapukur upazila, about 15 km south of Rangpur city.",
    ],
    "Carmichael College": [
      "Carmichael College was founded in 1916 and named after the Governor of Bengal. Its long main building, with domes and arches in the Indo-Saracenic style, stands in a campus of some 300 acres.\n\nIt is one of the oldest colleges in the north.",
      "November to February.",
      "At Lalbagh, about 3 km south of Rangpur city centre.",
    ],
    "Vinnya Jagat": [
      "Vinnya Jagat ('a different world') is a private theme park spread over about 100 acres. It has lakes, gardens, rides, a planetarium and replicas of famous buildings.\n\nFamilies from across the north come for a day out.",
      "November to February.",
      "At Gangachara, about 12 km from Rangpur city.",
      "There is an entry ticket; rides cost extra.",
    ],
    "Nisbetganj shatranji weavers": [
      "Shatranji is a flat-woven cotton rug made without any machine: the weaver passes coloured threads through by hand on a simple frame. The craft goes back to Mughal times and has a Geographical Indication mark.\n\nNisbetganj, named after a British collector who promoted it, is still its centre.",
      "Any time of year.",
      "At Nisbetganj, about 4 km west of Rangpur city.",
    ],
    "Haribhanga mango": [
      "Haribhanga is a round, fibreless and very sweet mango that began from a single tree in Mithapukur. It has spread through Rangpur and carries a Geographical Indication mark.\n\nIt ripens later than the Rajshahi mangoes. The big market is at Padaganj.",
      "Mid-June to July.",
      "Padaganj market in Mithapukur upazila, south of Rangpur city.",
    ],
  },
  thakurgaon: {
    "Baliadangi giant mango tree": [
      "This Surjapuri mango tree at Harinmari is thought to be about two hundred years old. Its thick branches droop to the ground and rise again, so that one tree covers roughly two bighas of land.\n\nIt still bears a large crop of fruit each summer.",
      "November to February; June for fruit.",
      "At Harinmari in Baliadangi upazila, about 35 km from Thakurgaon town.",
      "There is a small entry fee.",
    ],
    "Jamalpur Zamindar Mosque": [
      "The Jamalpur Jame Mosque was begun by the local zamindar family in the later 19th century. It has three domes and around eighty slender minarets, with fine plaster work.\n\nIt stands in the village of Jamalpur, not to be confused with the district of that name.",
      "November to February.",
      "About 12 km from Thakurgaon town at Shibganj.",
      "Dress modestly and avoid prayer times.",
    ],
    "Haripur Rajbari": [
      "The Haripur Rajbari was finished in the 1890s. The two-storey building is decorated with plaster figures and floral designs and stands near the Indian border.\n\nPart of it is ruined, but it remains the main landmark of Haripur.",
      "November to February.",
      "In Haripur upazila, about 60 km from Thakurgaon town.",
    ],
    "Ramrai Dighi": [
      "Ramrai Dighi is the largest old pond in the district, several hundred years old. More than a thousand litchi trees have been planted around it.\n\nIn winter it is noisy with migratory ducks.",
      "November to February.",
      "At Ranisankail, about 45 km from Thakurgaon town.",
    ],
  },

  // ---- Mymensingh ----
  jamalpur: {
    Lauchapra: [
      "Lauchapra is a recreation area in the low hills of Bakshiganj, at the foot of the Garo Hills of Meghalaya. A 150-foot-high hilltop has a watchtower with views over forest to the Indian mountains.\n\nGaro villages lie around it.",
      "November to February.",
      "In Bakshiganj upazila, about 50 km north of Jamalpur town.",
    ],
    "Old Brahmaputra": [
      "Until an earthquake and floods in the late 1700s, the main Brahmaputra flowed past Jamalpur and Mymensingh. The river then shifted west to become the Jamuna, leaving this quieter channel.\n\nThe bank at Jamalpur town is a pleasant evening walk.",
      "November to February.",
      "On the edge of Jamalpur town.",
    ],
    "Dayamoyee Temple": [
      "The Dayamoyee temple in Jamalpur town was founded in the late 1600s. It houses images of Kali, Shiva and other deities in separate shrines.\n\nIt is the centre of the town's Hindu festivals.",
      "Any time of year.",
      "In the centre of Jamalpur town.",
    ],
    "Nakshi kantha": [
      "A nakshi kantha is a quilt made from layers of old cloth, stitched all over with running-stitch pictures of flowers, birds, fish and village life. Jamalpur is the main centre of the craft, employing tens of thousands of women.\n\nShowrooms in town sell quilts, bedcovers, saris and wall hangings.",
      "Any time of year.",
      "Nakshi kantha showrooms in Jamalpur town.",
    ],
  },
  mymensingh: {
    "Zainul Abedin Museum": [
      "Shilpacharya Zainul Abedin (1914–1976) grew up beside this river. His sketches of the 1943 Bengal famine made him famous, and he founded the country's first art school.\n\nThe museum, in an old house on the bank of the Old Brahmaputra, shows around sixty of his paintings and sketches with his personal belongings.",
      "Any time of year.",
      "At Saheb Quarter Park beside the river, Mymensingh city.",
      "Closed one day a week; check the opening days before you go.",
    ],
    "Shoshi Lodge": [
      "Maharaja Shashikanta Acharya of Muktagacha built this palace in the early 1900s. A marble statue of Venus stands in the fountain in front, and the rooms once had crystal chandeliers and a musical staircase.\n\nFor decades it was a women's teachers' college. The gardens and the bathing house by the pond behind are worth seeing.",
      "November to February.",
      "In the centre of Mymensingh city.",
    ],
    "Muktagacha Zamindar Bari": [
      "The Muktagacha zamindars were among the richest in east Bengal and great patrons of music. Their estate has palace buildings, a revolving stage, temples and treasury rooms.\n\nMuch is in ruins, but restoration has begun on some parts.",
      "November to February.",
      "In Muktagacha town, about 16 km west of Mymensingh city.",
    ],
    "Alexander Castle": [
      "Maharaja Surya Kanta Acharya built this iron-and-timber mansion in 1879. It is locally called Lohar Kuthi, the iron house.\n\nTagore, Gandhi and other famous guests stayed here. It is now the library of the Teachers' Training College.",
      "November to February.",
      "In the Teachers' Training College grounds, Mymensingh city.",
    ],
    "Bangladesh Agricultural University": [
      "BAU was founded in 1961 on about 1,200 acres along the Old Brahmaputra. Its botanical garden has thousands of plant species, including a large cactus house.\n\nThe campus also has fish ponds, orchards, a small museum and long shaded roads.",
      "November to February.",
      "About 4 km south of Mymensingh city centre.",
    ],
    "Old Brahmaputra riverside": [
      "The Zainul Abedin Park runs along the Old Brahmaputra in the city. People come for boat rides, tea and snacks under the trees.\n\nIn winter the sandbanks on the far side are covered in white kash grass.",
      "October to February, late afternoon.",
      "At Saheb Quarter in Mymensingh city, by rickshaw.",
    ],
    "Muktagacha monda": [
      "Monda is a flat, round sweet of pure chhana and sugar with a grainy, melting texture. Gopal Pal first made it in 1824, and the zamindars of Muktagacha made it famous.\n\nHis family still runs the single shop and keeps the recipe secret. They have no branches.",
      "Any time of year.",
      "Gopal Pal's shop in Muktagacha town, 16 km from Mymensingh.",
    ],
  },
  netrokona: {
    "Birisiri china clay hills": [
      "At Bijoypur, white china clay has been dug from the hills for decades. The pits have filled with rainwater, making small lakes that look blue or green against the white, pink and purple clay.\n\nThe low hills above give views to the mountains of Meghalaya.",
      "November to February.",
      "Cross the Someshwari from Birisiri (Durgapur) by boat, then 30 minutes by motorbike or auto. Durgapur is 5 to 6 hours from Dhaka by bus.",
    ],
    "Someshwari river": [
      "The Someshwari comes down from the Garo Hills of Meghalaya and reaches the plain at Durgapur. In winter it is a shallow, clear stream running over wide golden sand.\n\nPeople wade in to collect coal and stones carried from the hills, and small boats ferry you across.",
      "November to February.",
      "Beside Durgapur town in Netrokona.",
    ],
    "Birisiri Tribal Cultural Academy": [
      "The academy at Birisiri works to keep alive the culture of the Garo, Hajong, Koch and other communities of greater Mymensingh. Its small museum shows their dress, tools and musical instruments.\n\nCultural shows are held on festival days such as Wangala, the Garo harvest festival.",
      "November to February; Wangala is usually in November.",
      "In Birisiri, 2 km from Durgapur town.",
    ],
    "Ranikhong Mission": [
      "The Catholic mission at Ranikhong was founded in 1912 on a hilltop beside the Someshwari. The white church, school and quiet gardens look out over the river and the Indian hills.\n\nIt is one of the most peaceful spots around Durgapur.",
      "November to February.",
      "About 6 km north of Durgapur, across the Someshwari.",
      "It is a working mission; be respectful during services.",
    ],
    "Balish mishti": [
      "Balish mishti means 'pillow sweet'. Gayanath Ghosh created it in Netrokona town about a century ago: a long, flat, fried chhana sweet soaked in syrup and topped with thick cream.\n\nThey come in several sizes, the biggest weighing a kilo or more.",
      "Any time of year.",
      "Gayanath Mistanna Bhandar at Barhatta Road, Netrokona town.",
    ],
  },
  sherpur: {
    "Gajni hills": [
      "Gajni Abakash is a recreation area in the sal-covered hills of Jhenaigati, right against the Meghalaya border. It has a lake with boats, a tall watchtower, hanging bridges and a walking trail through the forest.\n\nGaro, Koch and Hajong villages are close by.",
      "November to February.",
      "In Jhenaigati upazila, about 30 km north of Sherpur town; Sherpur is 4 to 5 hours from Dhaka.",
    ],
    "Madhutila Eco Park": [
      "Madhutila is an eco-park in the hill forest of Nalitabari. A watchtower on a hilltop looks over rolling green forest into India.\n\nThere is a lake with paddle boats and a small rest house. Wild elephants sometimes come down from the hills at night.",
      "November to February.",
      "In Nalitabari upazila, about 30 km from Sherpur town.",
    ],
    "Garo villages": [
      "The Garo, who call themselves Mandi, are a matrilineal people: property passes from mother to daughter. Many live in the foothill villages of Jhenaigati, Nalitabari and Sreebardi.\n\nYou can visit a village, see traditional houses and, in November, the Wangala harvest festival with drums and dance.",
      "November to February.",
      "Villages around Gajni and Madhutila, from Sherpur town.",
      "Go with a local guide and ask before taking photographs.",
    ],
    "Tulshimala rice": [
      "Tulshimala is a small-grained, fragrant rice grown in Sherpur's low hills and plains. It has a Geographical Indication mark.\n\nIt is used for polao, khichuri, payesh and winter pitha, and bags of it are a common gift from the district.",
      "December to January, after the harvest.",
      "Rice shops in Sherpur town.",
    ],
  },
};
